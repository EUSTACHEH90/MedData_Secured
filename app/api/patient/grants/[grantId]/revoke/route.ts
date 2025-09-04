
// // app/api/patient/grants/[grantId]/revoke/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";
// import { exec } from "child_process";
// import { promisify } from "util";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// const execAsync = promisify(exec);

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// // --- WSL/Fabric config (mêmes ENV que pour GrantAccess) ---
// const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
// const FABRIC_PATH_LINUX = process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
// const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

// // mêmes CA que la route de grant
// const ORDERER_CA = `${FABRIC_PATH_LINUX}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`;
// const ORG1_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`;
// const ORG2_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt`;

// function buildWSLCommand(query: string): string {
//   const scriptContent = `#!/bin/bash
// set -e
// source ~/.bashrc 2>/dev/null || true
// export PATH=$PATH:/usr/local/go/bin:~/go/bin:${FABRIC_PATH_LINUX}/../bin
// export FABRIC_CFG_PATH=${FABRIC_PATH_LINUX}/../config/
// export CORE_PEER_TLS_ENABLED=true
// export CORE_PEER_LOCALMSPID="Org1MSP"
// export CORE_PEER_TLS_ROOTCERT_FILE="${ORG1_TLS_CA}"
// export CORE_PEER_MSPCONFIGPATH="${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
// export CORE_PEER_ADDRESS=localhost:7051
// cd "${FABRIC_PATH_LINUX}" || exit 1
// if ! docker ps --format "{{.Names}}" | grep -q "peer0.org1"; then
//   echo "ERROR: Conteneurs Fabric non actifs"
//   exit 2
// fi
// if ! peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null | grep -q "meddata_secured"; then
//   echo "ERROR: Chaincode meddata_secured non déployé"
//   exit 3
// fi
// ${query}
// `;
//   const encodedScript = Buffer.from(scriptContent).toString("base64");
//   return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${encodedScript}' | base64 -d | bash"`;
// }

// async function fabricInvokeRevokeAccess(patientId: string, doctorId: string, grantId: string) {
//   // ⚠️ Endorsement par Org1 + Org2 (comme GrantAccess), sinon policy failure
//   const ccArgs = JSON.stringify({
//     function: "RevokeAccess",
//     Args: [patientId, doctorId, grantId],
//   });

//   const invoke = `
// peer chaincode invoke \
//   -o localhost:7050 \
//   --ordererTLSHostnameOverride orderer.example.com \
//   --tls --cafile "${ORDERER_CA}" \
//   -C mychannel -n meddata_secured \
//   --peerAddresses localhost:7051 \
//   --tlsRootCertFiles "${ORG1_TLS_CA}" \
//   --peerAddresses localhost:9051 \
//   --tlsRootCertFiles "${ORG2_TLS_CA}" \
//   --waitForEvent --waitForEventTimeout 30s \
//   -c '${ccArgs}'
// `;

//   const cmd = buildWSLCommand(invoke);
//   const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
//   if (stderr && !/Chaincode invoke successful|committed|VALID|submitted/i.test(stderr)) {
//     console.warn("Fabric STDERR (revoke):", stderr);
//   }
//   if (stdout) console.log("Fabric INVOKE RevokeAccess OK:", stdout);
// }

// // IMPORTANT: ici, `params` doit être **awaited** (Next.js App Router)
// export async function POST(req: Request, { params }: { params: Promise<{ grantId: string }> }) {
//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json(
//         { error: "Configuration serveur incorrecte (JWT_SECRET manquant)" },
//         { status: 500 }
//       );
//     }

//     const token = req.headers.get("authorization")?.split(" ")[1];
//     if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

//     let payload: any;
//     try {
//       const { payload: p } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = p;
//     } catch (e) {
//       return NextResponse.json({ error: "Token invalide ou expiré" }, { status: 401 });
//     }

//     const role = String(payload.role || "").toLowerCase();
//     const patientId = String(payload.id || "");
//     if (role !== "patient" || !patientId) {
//       return NextResponse.json({ error: "Réservé au patient" }, { status: 403 });
//     }

//     const { grantId } = await params; // ✅ corrige l’erreur "params should be awaited"
//     if (!grantId) return NextResponse.json({ error: "grantId requis dans l'URL" }, { status: 400 });

//     // Charger le grant du patient
//     const grant = await prisma.accessGrant.findFirst({
//       where: { id: grantId, patientId },
//       select: { id: true, medecinId: true, revoked: true },
//     });
//     if (!grant) {
//       return NextResponse.json({ error: "Autorisation introuvable" }, { status: 404 });
//     }
//     if (grant.revoked) {
//       return NextResponse.json({ success: true, message: "Déjà révoqué" }, { status: 200 });
//     }

//     // 1) Blockchain (si activée) — on ne bloque plus si ça échoue (best-effort)
//     if (BLOCKCHAIN_ENABLED) {
//       try {
//         await fabricInvokeRevokeAccess(patientId, grant.medecinId, grant.id);
//       } catch (e: any) {
//         // journalise mais on continue (évite 502)
//         console.error("Fabric RevokeAccess failed (best-effort):", e?.message || e);
//       }
//     } else {
//       console.warn("BLOCKCHAIN_ENABLED=false : RevokeAccess non invoqué (dev mode).");
//     }

//     // 2) DB : marquer révoqué
//     await prisma.accessGrant.update({
//       where: { id: grant.id },
//       data: { revoked: true },
//     });

//     // 3) (Optionnel) notifier le médecin (best-effort)
//     try {
//       await prisma.notification.create({
//         data: {
//           medecinId: grant.medecinId,
//           patientId,
//           message: "Le patient a révoqué votre accès au dossier.",
//           date: new Date(),
//           read: false,
//           type: "accessResponse",
//           target: "Medecin",
//           relatedId: grant.id,
//         },
//       });
//     } catch {}

//     return NextResponse.json({ success: true, message: "Accès révoqué" }, { status: 200 });
//   } catch (error) {
//     console.error("Erreur /api/patient/grants/[grantId]/revoke :", error);
//     return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
//   }
// }


// app/api/patient/grants/[grantId]/revoke/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { exec } from "child_process";
import { promisify } from "util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const RAW_SECRET = process.env.JWT_SECRET || "";
const JWT_SECRET = RAW_SECRET ? new TextEncoder().encode(RAW_SECRET) : null;

// --- WSL/Fabric config (mêmes ENV que pour GrantAccess) ---
const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
const FABRIC_PATH_LINUX = process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

const ORDERER_CA = `${FABRIC_PATH_LINUX}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`;
const ORG1_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`;
const ORG2_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt`;

function buildWSLCommand(query: string): string {
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

async function fabricInvokeRevokeAccess(patientId: string, doctorId: string, grantId: string) {
  const ccArgs = JSON.stringify({
    function: "RevokeAccess",
    Args: [patientId, doctorId, grantId],
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
    console.warn("Fabric STDERR (revoke):", stderr);
  }
  if (stdout) console.log("Fabric INVOKE RevokeAccess OK:", stdout);
}

// IMPORTANT: params est un Promise dans App Router → il faut l'attendre
export async function POST(req: Request, { params }: { params: Promise<{ grantId: string }> }) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "Configuration serveur incorrecte (JWT_SECRET manquant)" },
        { status: 500 }
      );
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

    const { grantId } = await params;
    if (!grantId) return NextResponse.json({ error: "grantId requis dans l'URL" }, { status: 400 });

    // Charger le grant + accessRequestId (⚠️ nécessaire pour lier les notifications)
    const grant = await prisma.accessGrant.findFirst({
      where: { id: grantId, patientId },
      select: { id: true, medecinId: true, revoked: true, accessRequestId: true },
    });
    if (!grant) {
      return NextResponse.json({ error: "Autorisation introuvable" }, { status: 404 });
    }
    if (grant.revoked) {
      return NextResponse.json({ success: true, message: "Déjà révoqué" }, { status: 200 });
    }

    // (1) Blockchain best-effort
    if (BLOCKCHAIN_ENABLED) {
      try {
        await fabricInvokeRevokeAccess(patientId, grant.medecinId, grant.id);
      } catch (e: any) {
        console.error("Fabric RevokeAccess failed (best-effort):", e?.message || e);
      }
    } else {
      console.warn("BLOCKCHAIN_ENABLED=false : RevokeAccess non invoqué (dev mode).");
    }

    // (2) DB : marquer révoqué
    await prisma.accessGrant.update({
      where: { id: grant.id },
      data: { revoked: true, updatedAt: new Date() },
    });

    // Récup info patient (pour message médecin)
    const p = await prisma.user.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true },
    }).catch(() => null);

    // On préfère lier les notifications à la DEMANDE d'accès
    const relatedId = grant.accessRequestId || grant.id; // fallback grant.id si vieux enregistrements

    // (3a) Notif PATIENT — le texte EXACT demandé
    try {
      await prisma.notification.upsert({
        where: {
          // nécessite @@unique([relatedId, type, target]) dans ton schema
          relatedId_type_target: {
            relatedId,
            type: "accessResponse",
            target: "Patient",
          },
        },
        create: {
          relatedId,
          patientId,
          medecinId: grant.medecinId,
          type: "accessResponse",
          target: "Patient",
          date: new Date(),
          read: false,
          message: "Révocation de la demande d'accès reussi",
        },
        update: {
          date: new Date(),
          read: false,
          medecinId: grant.medecinId,
          patientId,
          message: "Révocation de la demande d'accès reussi",
        },
      });
    } catch (e) {
      console.error("Notif patient (révocation) KO:", (e as any)?.message || e);
    }

    // (3b) Notif MEDECIN — information de révocation
    try {
      await prisma.notification.upsert({
        where: {
          relatedId_type_target: {
            relatedId,
            type: "accessResponse",
            target: "Medecin",
          },
        },
        create: {
          relatedId,
          medecinId: grant.medecinId,
          patientId,
          type: "accessResponse",
          target: "Medecin",
          date: new Date(),
          read: false,
          message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a révoqué l'accès à son dossier.`,
        },
        update: {
          date: new Date(),
          read: false,
          medecinId: grant.medecinId,
          patientId,
          message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a révoqué l'accès à son dossier.`,
        },
      });
    } catch (e) {
      console.error("Notif médecin (révocation) KO:", (e as any)?.message || e);
    }

    // (4) Réponse API — texte demandé
    return NextResponse.json(
      { success: true, message: "Révocation de la demande d'accès reussi" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur /api/patient/grants/[grantId]/revoke :", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
