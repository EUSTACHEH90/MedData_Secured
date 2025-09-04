// app/api/blockchain/result/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { exec } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);
const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
const FABRIC_PATH_LINUX =
  process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

// --- helpers
function buildWSLCommand(query: string): string {
  const scriptContent = `#!/bin/bash
set -e
source ~/.bashrc 2>/dev/null || true
export PATH=$PATH:/usr/local/go/bin:~/go/bin:${FABRIC_PATH_LINUX}/../bin
export FABRIC_CFG_PATH=${FABRIC_PATH_LINUX}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt"
export CORE_PEER_MSPCONFIGPATH="${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
cd "${FABRIC_PATH_LINUX}" || exit 1
if ! docker ps --format "{{.Names}}" | grep -q "peer0.org1"; then
  echo "ERROR: Conteneurs Fabric non actifs"
  exit 2
fi
if ! peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null | grep -q "meddata_secured"; then
  echo "ERROR: Chaincode meddata_secured non déployé"
  exit 3
fi
${query}
`;
  const encodedScript = Buffer.from(scriptContent).toString("base64");
  return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${encodedScript}' | base64 -d | bash"`;
}

// NOTE: on accepte params aussi bien en objet direct qu'en Promise
async function handle(req: NextRequest, params: { id: string } | Promise<{ id: string }>) {
  const p: any = (params as any);
  const { id: resultId } = p?.then ? await p : p;

  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token || !JWT_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Token manquant ou configuration JWT incorrecte.", verified: "❌ Échec" },
        { status: 401 }
      );
    }

    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = String(payload.id || "");
    const userRole = String(payload.role || "");

    // Charger le résultat avec infos nécessaires
    const result = await prisma.result.findUnique({
      where: { id: resultId },
      include: {
        createdBy: { select: { id: true, role: true, firstName: true, lastName: true } },
        patient:   { select: { id: true, role: true, firstName: true, lastName: true } },
      },
    });

    if (!result) {
      return NextResponse.json({ ok: false, error: "Résultat introuvable.", verified: "❌ Échec" }, { status: 404 });
    }

    if (!result.documentHash) {
      const messageForReader = "ℹ️ Vérification impossible (aucun hash associé au document).";
      return NextResponse.json({
        ok: true,
        valid: false,
        resultId,
        message: "Aucun hash attendu en base. Impossible de conclure.",
        messageForReader,
        verified: messageForReader,
        blockchainHash: null,
        localHash: null,
        match: false,
        timestamp: new Date().toISOString(),
      });
    }

    // ---- Contrôle d’accès de lecture (élargi)
    const isOwner    = userRole === "Patient" && result.patientId === userId;
    const isSharedTo = userRole === "Medecin" && result.sharedWithId === userId;
    const isCreator  = userRole === "Medecin" && result.createdBy?.id === userId;

    // NB: on autorise aussi via grant actif
    let isCoveredByGrant = false;
    if (userRole === "Medecin" && !isOwner && !isSharedTo && !isCreator) {
      const now = new Date();
      const grant = await prisma.accessGrant.findFirst({
        where: {
          patientId: result.patient.id,
          medecinId: userId,
          revoked: false,
          expiresAt: { gt: now },
        },
        select: { scope: true, resourceIds: true },
      });

      if (grant) {
        if (Array.isArray(grant.resourceIds) && grant.resourceIds.length > 0) {
          isCoveredByGrant = grant.resourceIds.includes(resultId);
        } else {
          isCoveredByGrant =
            grant.scope === "ALL" || grant.scope === "RESULTS" || grant.scope === "TESTS";
        }
      }
    }

    if (!(isOwner || isSharedTo || isCreator || isCoveredByGrant)) {
      return NextResponse.json({ ok: false, error: "Accès non autorisé à ce résultat.", verified: "❌ Échec" }, { status: 403 });
    }

    // ---- Mode dev : pas de blockchain
    if (!BLOCKCHAIN_ENABLED) {
      const messageForReader = "✅ Intégrité confirmée (mode dev).";
      return NextResponse.json({
        ok: true,
        valid: true,
        resultId,
        message: "Intégrité vérifiée (mode développement).",
        messageForReader,
        verified: messageForReader,
        blockchainHash: `dev-hash-${resultId.slice(0, 8)}`,
        localHash: result.documentHash,
        mode: "development",
        match: true,
        timestamp: new Date().toISOString(),
        verifiedBy: `${userRole}: ${userId}`,
      });
    }

    // ---- Requête blockchain
    if (!result.patientId) {
      return NextResponse.json(
        { ok: false, error: "Patient ID manquant pour la requête blockchain", verified: "❌ Échec" },
        { status: 400 }
      );
    }

    const query = `peer chaincode query -C mychannel -n meddata_secured -c '{"function":"GetMetadata","Args":["${result.patientId}","${resultId}"]}'`;
    const command = buildWSLCommand(query);
    const { stdout, stderr } = await execAsync(command, {
      timeout: 30000,
      encoding: "utf8",
      windowsHide: true,
    });

    // On renvoie 200 avec message lisible pour que le front affiche un texte, même si non vérifiable
    if (stderr && /does not exist|error/i.test(stderr)) {
      const messageForReader = "❌ Intégrité non vérifiable (aucune trace blockchain).";
      return NextResponse.json({
        ok: true,
        valid: false,
        resultId,
        message: "Résultat non enregistré sur la blockchain.",
        messageForReader,
        verified: messageForReader,
        blockchainStderr: stderr,
        blockchainHash: null,
        localHash: result.documentHash,
        match: false,
        timestamp: new Date().toISOString(),
        verifiedBy: `${userRole}: ${userId}`,
      });
    }

    if (!stdout || !stdout.trim()) {
      const messageForReader = "❌ Intégrité non vérifiable (réponse blockchain vide).";
      return NextResponse.json({
        ok: true,
        valid: false,
        resultId,
        message: "Aucune réponse de la blockchain.",
        messageForReader,
        verified: messageForReader,
        blockchainHash: null,
        localHash: result.documentHash,
        match: false,
        timestamp: new Date().toISOString(),
        verifiedBy: `${userRole}: ${userId}`,
      });
    }

    let meta: any;
    try {
      meta = JSON.parse(stdout.trim());
    } catch {
      const messageForReader = "❌ Intégrité non vérifiable (réponse blockchain invalide).";
      return NextResponse.json({
        ok: true,
        valid: false,
        resultId,
        message: "Réponse blockchain invalide.",
        messageForReader,
        verified: messageForReader,
        rawOutput: stdout,
        blockchainHash: null,
        localHash: result.documentHash,
        match: false,
        timestamp: new Date().toISOString(),
        verifiedBy: `${userRole}: ${userId}`,
      });
    }

    const blockchainHash = meta?.hash ?? null;
    const localHash = result.documentHash;
    const match = Boolean(blockchainHash && localHash && blockchainHash === localHash);

    // Marquage en base
    await prisma.result.update({
      where: { id: resultId },
      data: {
        blockchainVerified: match,
        blockchainVerifiedAt: new Date(),
      },
    });

    // Message lecteur et éventuelle notification
    let messageForReader = "✅ Intégrité confirmée";
    let notified: { id: string; role: string; name: string } | null = null;

    if (!match) {
      // qui notifier ? créateur si dispo sinon patient
      const toNotify = result.createdBy?.id
        ? {
            id: result.createdBy.id,
            role: result.createdBy.role ?? "Medecin",
            name:
              [result.createdBy.firstName, result.createdBy.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || "le médecin",
          }
        : {
            id: result.patient.id,
            role: result.patient.role ?? "Patient",
            name:
              [result.patient.firstName, result.patient.lastName]
                .filter(Boolean)
                .join(" ")
                .trim() || "le patient",
          };

      notified = { ...toNotify };
      messageForReader = `❌ Intégrité compromise — nous avons notifié ${toNotify.name} pour renvoi d’un document correct.`;

      if (toNotify.role === "Medecin") {
        await prisma.notification.create({
          data: {
            patientId: result.patientId,
            medecinId: toNotify.id,
            message: `⚠️ Document compromis pour le résultat "${result.type}" du ${new Date(
              result.date
            ).toLocaleDateString("fr-FR")}. Merci d’en renvoyer une version correcte.`,
            date: new Date(),
            read: false,
            type: "alert",
            target: "Medecin",
          },
        });
      } else {
        await prisma.notification.create({
          data: {
            patientId: toNotify.id,
            medecinId: userRole === "Medecin" ? userId : null,
            message: `⚠️ Votre document "${result.type}" du ${new Date(
              result.date
            ).toLocaleDateString("fr-FR")} semble compromis. Merci d’en renvoyer une version correcte.`,
            date: new Date(),
            read: false,
            type: "alert",
            target: "Patient",
          },
        });
      }
    }

    return NextResponse.json({
      ok: true,
      valid: match,
      resultId,
      message: match ? "Dossier intègre ✅" : "Dossier compromis ❌",
      messageForReader,
      verified: messageForReader,            // <-- champ lu par ton bouton
      blockchainHash,
      localHash,
      match,
      timestamp: new Date().toISOString(),
      verifiedBy: `${userRole}: ${userId}`,
      metadata: meta,
      notified, // null si OK, sinon {id, role, name}
    });
  } catch (error: any) {
    console.error("❌ Erreur blockchain:", error);
    return NextResponse.json(
      { ok: false, error: "Erreur serveur", details: error?.message, verified: "❌ Échec" },
      { status: 500 }
    );
  }
}

// App Router : ici params peut être un Promise, on lui passe tel quel à handle()
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, ctx.params);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(req, ctx.params);
}
