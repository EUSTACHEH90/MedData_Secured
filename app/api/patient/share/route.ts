// app/api/patient/share/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import crypto from "node:crypto";
import { exec } from "child_process";
import { promisify } from "util";


const execAsync = promisify(exec);

// --- WSL/Fabric config (mêmes ENV que les autres routes) ---
const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
const FABRIC_PATH_LINUX = process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

const ORDERER_CA = `${FABRIC_PATH_LINUX}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`;
const ORG1_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`;
const ORG2_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt`;

function buildWSLCommand(query: string) {
  const scriptContent = `#!/bin/bash
set -e
source ~/.bashrc 2>/dev/null || true
export PATH=$PATH:/usr/local/go/bin:~/go/bin:${FABRIC_PATH_LINUX}/../bin
export FABRIC_CFG_PATH=${FABRIC_PATH_LINUX}/../config/
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID="Org1MSP"
export CORE_PEER_TLS_ROOTCERT_FILE="${ORG1_TLS_CA}"
export CORE_PEER_MSPCONFIGPATH="${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
export CORE_PEER_ADDRESS=localhost:7051
cd "${FABRIC_PATH_LINUX}" || exit 1
if ! docker ps --format "{{.Names}}" | grep -q "peer0.org1"; then
  echo "ERROR: peer0.org1 non actif"
  exit 2
fi
if ! docker ps --format "{{.Names}}" | grep -q "peer0.org2"; then
  echo "ERROR: peer0.org2 non actif"
  exit 2
fi
if ! peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null | grep -q "meddata_secured"; then
  echo "ERROR: Chaincode meddata_secured non déployé"
  exit 3
fi
${query}
`;
  const encoded = Buffer.from(scriptContent).toString("base64");
  return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${encoded}' | base64 -d | bash"`;
}
async function fabricInvokeGrantAccess(
  grantId: string,
  patientId: string,
  doctorId: string,
  // ⚠️ ICI: types attendus par le chaincode
  scope: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL",
  expiresAtISO: string,
  reasonHash: string,
  resourceIds: string[]
) {
  const ccArgs = JSON.stringify({
    function: "GrantAccess",
    Args: [
      grantId,
      patientId,
      doctorId,
      scope,
      expiresAtISO,
      reasonHash,
      JSON.stringify(resourceIds || []),
    ],
  });

  const invoke = `
peer chaincode invoke \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile "${ORDERER_CA}" \
  -C mychannel -n meddata_secured \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "${ORG1_TLS_CA}" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "${ORG2_TLS_CA}" \
  --waitForEvent --waitForEventTimeout 30s \
  -c '${ccArgs}'
`;

  const cmd = buildWSLCommand(invoke);
  const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
  if (stderr && !/Chaincode invoke successful|committed|VALID|submitted/i.test(stderr)) {
    console.warn("Fabric STDERR (invoke):", stderr);
  }
  if (stdout) console.log("Fabric INVOKE GrantAccess OK:", stdout);
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_SECRET = process.env.JWT_SECRET || "";
const JWT_SECRET = RAW_SECRET ? new TextEncoder().encode(RAW_SECRET) : null;

type ShareBody = {
  medecinId: string;
  scope?: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL";
  durationMinutes?: number;
  resourceIds?: string[];
  motif?: string;
};

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte (JWT_SECRET)" }, { status: 500 });
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

    let payload: any;
    try {
      const { payload: p } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = p;
    } catch {
      return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
    }

    const role = String(payload.role || "").toLowerCase();
    const patientId = String(payload.id || "");
    if (role !== "patient" || !patientId) {
      return NextResponse.json({ error: "Réservé au patient" }, { status: 403 });
    }

    const body = (await req.json()) as ShareBody;
    const medecinId = body.medecinId?.trim();
    if (!medecinId) return NextResponse.json({ error: "medecinId requis" }, { status: 400 });

    // Valider le médecin
    const doctor = await prisma.user.findUnique({
        where: { id: medecinId, role: "Medecin" },
        select: { id: true, firstName: true, lastName: true }, // ⬅️ ajout
    });

    if (!doctor) return NextResponse.json({ error: "Médecin introuvable" }, { status: 404 });

    // Normaliser le scope côté DB
    const rawScope = String(body.scope || "ALL").toUpperCase();
    const scope = ((): "RESULTS" | "ORDONNANCES" | "TESTS" | "ALL" => {
      switch (rawScope) {
        case "PRESCRIPTIONS": return "ORDONNANCES";
        case "RESULTS": return "RESULTS";
        case "TESTS": return "TESTS";
        case "ALL": default: return "ALL";
      }
    })();

    const scopeLabelMap: Record<"RESULTS"|"ORDONNANCES"|"TESTS"|"ALL", string> = {
      ALL: "tout le dossier",
      RESULTS: "les résultats",
      ORDONNANCES: "les ordonnances",
      TESTS: "les tests",
    };

    const durationMinutes = Math.max(1, Number(body.durationMinutes || 60) || 60);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60_000);
    const resourceIds = Array.isArray(body.resourceIds) ? body.resourceIds : [];
    const motif = (body.motif || "").trim();

    // 1) Créer une AccessRequest déjà acceptée (initiée par patient)
    const accessRequest = await prisma.accessRequest.create({
      data: {
        patientId,
        medecinId,
        status: "Accepté",
        motif,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      select: { id: true }
    });

    // 2) Créer le Grant lié à cette demande
    const reasonHash = crypto.createHash("sha256").update(motif || "").digest("hex");
    const grant = await prisma.accessGrant.create({
      data: {
        accessRequestId: accessRequest.id, // lien vers la demande
        patientId,
        medecinId,
        scope: scope as any,
        resourceIds,
        expiresAt,
        revoked: false,
        reasonHash,
      },
      select: { id: true, scope: true, expiresAt: true, accessRequestId: true }
    });

    // 2-bis) Blockchain: invoquer GrantAccess (si l'accès on-chain est requis)
    if (BLOCKCHAIN_ENABLED) {
      try {
        // DB: "ORDONNANCES" ; Fabric: "PRESCRIPTIONS"
        const scopeForFabric =
          (grant.scope as any) === "ORDONNANCES" ? "PRESCRIPTIONS"
          : (grant.scope as "RESULTS" | "TESTS" | "ALL");

        await fabricInvokeGrantAccess(
          grant.id,
          patientId,
          medecinId,
          scopeForFabric,
          grant.expiresAt.toISOString(),
          reasonHash,
          resourceIds
        );
      } catch (e: any) {
        console.error("Fabric GrantAccess failed:", e?.message || e);
        // Comportement "bloquant" recommandé si la lecture dépend STRICTEMENT du on-chain :
        return NextResponse.json(
          { error: "Échec d'enregistrement blockchain" },
          { status: 502 }
        );
        // Ou, en dev seulement, tu peux choisir "best-effort" :
        // console.warn("Grant enregistré en DB mais pas on-chain (best-effort).");
      }
    } else {
      console.warn("BLOCKCHAIN_ENABLED=false : GrantAccess non invoqué (dev mode).");
    }


    // 3) Marquer explicitement partagé (si sélection fournie)
    if (resourceIds.length > 0) {
      await prisma.result.updateMany({
        where: { id: { in: resourceIds }, patientId },
        data: { isShared: true, sharedWithId: medecinId },
      });
    }

    // 4) Notifier le médecin (UNE SEULE fois ; pas d'upsert ici)
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true }
    });

    const scopeLabel = scopeLabelMap[scope]; // joli libellé dans le message
    await prisma.notification.create({
      data: {
        medecinId,
        patientId,
        type: "accessResponse",
        target: "Medecin",
        relatedId: accessRequest.id,
        read: false,
        date: new Date(),
        message:
          `Le patient ${patient?.firstName || "Inconnu"} ${patient?.lastName || ""} ` +
          `a partagé ${scopeLabel}${motif ? ` (motif : ${motif})` : ""}.`,
      },
    });
    // 4-bis) Notifier aussi le PATIENT (même relatedId = accessRequest.id)
    await prisma.notification.create({
      data: {
        medecinId,
        patientId,
        type: "accessResponse",
        target: "Patient",
        relatedId: accessRequest.id,             // ⬅️ même lien que côté médecin
        read: false,
        date: new Date(),
        message:
          `Vous avez partagé ${scopeLabel}` + `${motif ? ` (motif : ${motif})` : ""} ` +
          `avec le Dr. ${doctor?.firstName ?? ""} ${doctor?.lastName ?? ""}.`,
      },
    });


    return NextResponse.json({ success: true, accessRequest, grant }, { status: 201 });
  } catch (e: any) {
    console.error("POST /api/patient/share error:", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
