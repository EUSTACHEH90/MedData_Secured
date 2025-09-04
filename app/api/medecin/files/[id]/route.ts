
// app/api/medecin/files/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";
const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
const FABRIC_PATH_LINUX =
  process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
const ORDERER_CA = `${FABRIC_PATH_LINUX}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`;

// Dossier racine local (doit exister). Ex: C:\Users\user\Videos\meddata_secured\storage
const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

function buildWSLCommand(query: string): string {
  const script = `#!/bin/bash
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
  const b64 = Buffer.from(script).toString("base64");
  return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${b64}' | base64 -d | bash"`;
}

async function fabricQueryIsAccessAllowed(
  patientId: string,
  doctorId: string,
  resourceType: "RESULT" | "PRESCRIPTION" | "TEST",
  resourceId: string
): Promise<boolean> {
  if (!BLOCKCHAIN_ENABLED) return true; // mode dev
  const ccArgs = JSON.stringify({
    function: "IsAccessAllowed",
    Args: [patientId, doctorId, resourceType, resourceId],
  });
  const query = `
peer chaincode query \
  -C mychannel -n meddata_secured \
  -c '${ccArgs}'
`;
  const cmd = buildWSLCommand(query);
  const { stdout } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
  // La query doit renvoyer "true" ou "false"
  return String(stdout).toLowerCase().includes("true");
}

async function fabricInvokeRecordAccessView(
  patientId: string,
  doctorId: string,
  resourceType: "RESULT" | "PRESCRIPTION" | "TEST",
  resourceId: string
) {
  if (!BLOCKCHAIN_ENABLED) return;
  const ccArgs = JSON.stringify({
    function: "RecordAccessView",
    Args: [patientId, doctorId, resourceType, resourceId],
  });
  const invoke = `
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C mychannel -n meddata_secured \
  -c '${ccArgs}' \
  --waitForEvent --waitForEventTimeout 30s
`;
  const cmd = buildWSLCommand(invoke);
  await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 }).catch(() => {});
}

function isHttpUrl(u?: string | null): u is string {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}



export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ⬅️
) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "JWT_SECRET manquant" }, { status: 500 });
    }

    // Auth médecin
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const role = String(payload.role || "").toLowerCase();
    if (role !== "medecin") return NextResponse.json({ error: "Réservé au médecin" }, { status: 403 });
    const doctorId = String(payload.id || "");

    const { id } = await params;

    // Charger le résultat
    const result = await prisma.result.findUnique({
      where: { id },
      select: { id: true, patientId: true, fileUrl: true, type: true, description: true },
    });
    if (!result) return NextResponse.json({ error: "Document introuvable" }, { status: 404 });
    if (!result.fileUrl) return NextResponse.json({ error: "Aucun fichier associé" }, { status: 404 });

    const now = new Date();

    // 1) On tente d'abord de trouver un grant ACTIF (non révoqué), le plus récent
    let grant = await prisma.accessGrant.findFirst({
      where: {
        patientId: result.patientId,
        medecinId: doctorId,
        revoked: false,
        createdAt: { lte: now },
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, scope: true, expiresAt: true, revoked: true, createdAt: true, updatedAt: true, resourceIds: true },
    });

    // 1b) Si aucun grant actif, on récupère quand même le DERNIER grant (même révoqué) pour expliquer pourquoi
    if (!grant) {
      const lastGrant = await prisma.accessGrant.findFirst({
        where: { patientId: result.patientId, medecinId: doctorId },
        orderBy: { createdAt: "desc" },
        select: { id: true, scope: true, expiresAt: true, revoked: true, createdAt: true, updatedAt: true },
      });

      if (!lastGrant) {
        return NextResponse.json(
          {
            error: "Vous n’avez pas d’autorisation active pour ce dossier.",
            code: "NO_GRANT",
            hint: "Demandez un nouvel accès depuis la page patient."
          },
          { status: 403 }
        );
      }

      if (lastGrant.revoked) {
        return NextResponse.json(
          {
            error: "Le patient a révoqué votre accès à son dossier.",
            code: "REVOKED",
            revokedAt: lastGrant.updatedAt?.toISOString?.() || undefined,
            hint: "Vous pouvez envoyer une nouvelle demande d’accès."
          },
          { status: 403 }
        );
      }

      if (lastGrant.expiresAt && lastGrant.expiresAt <= now) {
        return NextResponse.json(
          {
            error: "Votre autorisation a expiré.",
            code: "EXPIRED",
            expiredAt: lastGrant.expiresAt.toISOString(),
            hint: "Demandez un nouvel accès pour consulter ce document."
          },
          { status: 403 }
        );
      }

      // Par défaut (aucun actif et dernier non révoqué/non expiré = cas rare)
      return NextResponse.json(
        {
          error: "Aucune autorisation active trouvée.",
          code: "NO_GRANT",
          hint: "Demandez un nouvel accès."
        },
        { status: 403 }
      );
    }

    // 2) Ici: grant non révoqué trouvé. Vérifier expiration
    if (grant.expiresAt && grant.expiresAt <= now) {
      return NextResponse.json(
        {
          error: "Votre autorisation a expiré.",
          code: "EXPIRED",
          expiredAt: grant.expiresAt.toISOString(),
          hint: "Demandez un nouvel accès pour consulter ce document."
        },
        { status: 403 }
      );
    }

    // 3) Vérifier le périmètre (scope / resourceIds)
    const inScope =
      grant.scope === "ALL" ||
      (grant.scope === "RESULTS" &&
        (!grant.resourceIds || grant.resourceIds.length === 0 || grant.resourceIds.includes(result.id)));

    if (!inScope) {
      return NextResponse.json(
        {
          error: "Ce document n’entre pas dans la permission accordée par le patient.",
          code: "NOT_IN_SCOPE",
          hint: "Demandez une nouvelle autorisation incluant ce document."
        },
        { status: 403 }
      );
    }

    // 4) Blockchain (si activée)
    const allowed = await fabricQueryIsAccessAllowed(result.patientId, doctorId, "RESULT", result.id);
    if (!allowed) {
      return NextResponse.json(
        {
          error: "Accès refusé par la blockchain (autorisation retirée ou non reconnue).",
          code: "BLOCKCHAIN_DENY",
          hint: "Demandez un nouvel accès."
        },
        { status: 403 }
      );
    }

    // 5) Servir le fichier
    if (isHttpUrl(result.fileUrl)) {
      const upstream = await fetch(result.fileUrl);
      if (!upstream.ok || !upstream.body) {
        return NextResponse.json({ error: "Fichier indisponible" }, { status: 502 });
      }
      fabricInvokeRecordAccessView(result.patientId, doctorId, "RESULT", result.id).catch(() => {});
      const headers = new Headers();
      headers.set("Content-Type", upstream.headers.get("content-type") || "application/octet-stream");
      headers.set("Content-Disposition", `inline; filename="${result.id}"`);
      headers.set("Cache-Control", "no-store");
      return new Response(upstream.body, { status: 200, headers });
    }

    // === Fichier local sécurisé ===
    const root = path.resolve(LOCAL_FILES_DIR);
    const raw: string = String(result.fileUrl ?? "");
    const cleanedRel = raw
      .replace(/^([A-Za-z]:)?[\\/]+/, "")
      .replace(/[\\/]+/g, path.sep);
    const abs = path.resolve(root, cleanedRel);

    const rel = path.relative(root, abs);
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      console.error("[/api/medecin/files] Chemin invalide", { root, raw, cleanedRel, abs, rel });
      return NextResponse.json({ error: "Chemin invalide" }, { status: 400 });
    }

    const exists = await fsp.stat(abs).then(s => s.isFile()).catch(() => false);
    if (!exists) return NextResponse.json({ error: "Fichier introuvable" }, { status: 404 });

    fabricInvokeRecordAccessView(result.patientId, doctorId, "RESULT", result.id).catch(() => {});

    const ext = path.extname(abs).toLowerCase();
    const mime =
      ext === ".pdf" ? "application/pdf" :
      ext === ".png" ? "image/png" :
      ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" :
      "application/octet-stream";

    const stream = fs.createReadStream(abs);
    const headers = new Headers();
    headers.set("Content-Type", mime);
    headers.set("Content-Disposition", `inline; filename="${path.basename(abs)}"`);
    headers.set("Cache-Control", "no-store");

    // @ts-ignore
    return new Response(stream, { status: 200, headers });
  } catch (e: any) {
    console.error("Erreur /api/medecin/files/[id] :", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}



