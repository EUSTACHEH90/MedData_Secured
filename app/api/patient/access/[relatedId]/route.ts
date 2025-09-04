
// // // app/api/patient/access/[relatedId]/route.ts
// // import { NextResponse } from "next/server";
// // import prisma from "@/lib/prisma";
// // import { jwtVerify } from "jose";
// // import { exec } from "child_process";
// // import { promisify } from "util";
// // import crypto from "node:crypto";

// // export const runtime = "nodejs";
// // export const dynamic = "force-dynamic";

// // const execAsync = promisify(exec);

// // const JWT_SECRET = process.env.JWT_SECRET
// //   ? new TextEncoder().encode(process.env.JWT_SECRET)
// //   : null;

// // // --- WSL/Fabric config ---
// // const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
// // const FABRIC_PATH_LINUX =
// //   process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
// // const FABRIC_USER = process.env.FABRIC_USER || "user";
// // const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

// // // TLS CA paths (réutilisés dans les invokes)
// // const ORDERER_CA = `${FABRIC_PATH_LINUX}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`;
// // const ORG1_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt`;
// // const ORG2_TLS_CA = `${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt`;

// // function buildWSLCommand(query: string): string {
// //   const scriptContent = `#!/bin/bash
// // set -e
// // source ~/.bashrc 2>/dev/null || true
// // export PATH=$PATH:/usr/local/go/bin:~/go/bin:${FABRIC_PATH_LINUX}/../bin
// // export FABRIC_CFG_PATH=${FABRIC_PATH_LINUX}/../config/
// // export CORE_PEER_TLS_ENABLED=true
// // export CORE_PEER_LOCALMSPID="Org1MSP"
// // export CORE_PEER_TLS_ROOTCERT_FILE="${ORG1_TLS_CA}"
// // export CORE_PEER_MSPCONFIGPATH="${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp"
// // export CORE_PEER_ADDRESS=localhost:7051
// // cd "${FABRIC_PATH_LINUX}" || exit 1
// // # Vérifie que les deux peers sont up
// // if ! docker ps --format "{{.Names}}" | grep -q "peer0.org1"; then
// //   echo "ERROR: peer0.org1 non actif"
// //   exit 2
// // fi
// // if ! docker ps --format "{{.Names}}" | grep -q "peer0.org2"; then
// //   echo "ERROR: peer0.org2 non actif"
// //   exit 2
// // fi
// // # Vérifie que le chaincode est bien committé
// // if ! peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null | grep -q "meddata_secured"; then
// //   echo "ERROR: Chaincode meddata_secured non déployé"
// //   exit 3
// // fi
// // ${query}
// // `;
// //   const encodedScript = Buffer.from(scriptContent).toString("base64");
// //   return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${encodedScript}' | base64 -d | bash"`;
// // }

// // // ---- Fabric helpers ----
// // async function fabricInvokeGrantAccess(
// //   grantId: string,
// //   patientId: string,
// //   doctorId: string,
// //   scope: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL",
// //   expiresAtISO: string,
// //   reasonHash: string,
// //   resourceIds: string[]
// // ) {
// //   const ccArgs = JSON.stringify({
// //     function: "GrantAccess",
// //     Args: [
// //       grantId,
// //       patientId,
// //       doctorId,
// //       scope,
// //       expiresAtISO,
// //       reasonHash,
// //       JSON.stringify(resourceIds || []),
// //     ],
// //   });

// //   // IMPORTANT : endosser sur Org1 + Org2 pour satisfaire MAJORITY
// //   const invoke = `
// // peer chaincode invoke \
// //   -o localhost:7050 \
// //   --ordererTLSHostnameOverride orderer.example.com \
// //   --tls --cafile "${ORDERER_CA}" \
// //   -C mychannel -n meddata_secured \
// //   --peerAddresses localhost:7051 \
// //   --tlsRootCertFiles "${ORG1_TLS_CA}" \
// //   --peerAddresses localhost:9051 \
// //   --tlsRootCertFiles "${ORG2_TLS_CA}" \
// //   --waitForEvent --waitForEventTimeout 30s \
// //   -c '${ccArgs}'
// // `;

// //   const cmd = buildWSLCommand(invoke);
// //   const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 10 * 1024 * 1024 });
// //   if (stderr && !/Chaincode invoke successful|committed|VALID|submitted/i.test(stderr)) {
// //     console.warn("Fabric STDERR (invoke):", stderr);
// //   }
// //   if (stdout) console.log("Fabric INVOKE GrantAccess OK:", stdout);
// // }

// // type ApproveBody = {
// //   approve: boolean;
// //   scope?: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL";
// //   durationMinutes?: number; // ex. 60
// //   resourceIds?: string[]; // optionnel: liste précise
// // };

// // // ✅ Handler PATCH : approbation / refus d'une demande d'accès
// // export async function PATCH(
// //   req: Request,
// //   { params }: { params: Promise<{ relatedId: string }> }
// // ) {
// //   try {
// //     if (!JWT_SECRET) {
// //       console.error("JWT_SECRET non défini.");
// //       return NextResponse.json(
// //         {
// //           error: "Configuration serveur incorrecte.",
// //           details: "Variable JWT_SECRET manquante.",
// //         },
// //         { status: 500 }
// //       );
// //     }

// //     const token = req.headers.get("authorization")?.split(" ")[1];
// //     if (!token) {
// //       return NextResponse.json(
// //         {
// //           error: "Token manquant pour notification",
// //           details: "En-tête Authorization absent.",
// //         },
// //         { status: 401 }
// //       );
// //     }

// //     let payload: any;
// //     try {
// //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, {
// //         algorithms: ["HS256"],
// //       });
// //       payload = verifiedPayload;
// //     } catch (err) {
// //       console.error("Erreur de vérification du token :", err);
// //       return NextResponse.json(
// //         {
// //           error: "Token invalide ou expiré.",
// //           details: err instanceof Error ? err.message : "Erreur inconnue",
// //         },
// //         { status: 401 }
// //       );
// //     }

// //     const patientId = typeof payload.id === "string" ? payload.id : null;
// //     const role =
// //       typeof payload.role === "string"
// //         ? String(payload.role).toLowerCase()
// //         : null;
// //     if (!patientId || role !== "patient") {
// //       return NextResponse.json(
// //         {
// //           error:
// //             "Seuls les patients peuvent approuver ou refuser une demande d'accès",
// //           details: "Rôle non autorisé",
// //         },
// //         { status: 403 }
// //       );
// //     }

// //     const { relatedId: accessRequestId } = await params;
// //     if (!accessRequestId) {
// //       return NextResponse.json(
// //         {
// //           error: "relatedId requis dans l'URL",
// //           details: "Paramètre relatedId manquant.",
// //         },
// //         { status: 400 }
// //       );
// //     }

// //     const body = (await req.json()) as ApproveBody;
// //     if (typeof body.approve !== "boolean") {
// //       return NextResponse.json(
// //         {
// //           error: "Le champ 'approve' doit être un booléen",
// //           details: `Valeur reçue : ${String((body as any).approve)}`,
// //         },
// //         { status: 400 }
// //       );
// //     }

// //     // Vérifier la demande et la propriété
// //     const accessRequest = await prisma.accessRequest.findFirst({
// //       where: { id: accessRequestId, patientId },
// //       include: { medecin: true },
// //     });
// //     if (!accessRequest) {
// //       return NextResponse.json(
// //         {
// //           error: "Demande d'accès non trouvée ou non autorisée",
// //           details: `relatedId: ${accessRequestId}, patientId: ${patientId}`,
// //         },
// //         { status: 404 }
// //       );
// //     }
// //     if (accessRequest.status !== "En attente") {
// //       return NextResponse.json(
// //         {
// //           error: "Demande d'accès déjà traitée",
// //           details: `Statut actuel : ${accessRequest.status}`,
// //         },
// //         { status: 400 }
// //       );
// //     }

// //     // Récup info patient (pour le message)
// //     const patient = await prisma.user.findUnique({
// //       where: { id: patientId },
// //       select: { firstName: true, lastName: true },
// //     });
// //     if (!patient) {
// //       return NextResponse.json(
// //         { error: "Patient non trouvé", details: `ID: ${patientId}` },
// //         { status: 404 }
// //       );
// //     }

// //     // Marquer la demande Accepté/Refusé
// //     await prisma.accessRequest.update({
// //       where: { id: accessRequestId },
// //       data: { status: body.approve ? "Accepté" : "Refusé", updatedAt: new Date() },
// //     });

// //     // Marquer la notif liée comme lue (si existe)
// //     const notification = await prisma.notification.findFirst({
// //       where: { relatedId: accessRequestId, patientId },
// //     });
// //     if (notification) {
// //       await prisma.notification.update({
// //         where: { id: notification.id },
// //         data: {
// //           read: true,
// //           message: `${notification.message || "Demande"} (${
// //             body.approve ? "Accepté" : "Refusé"
// //           })`,
// //         },
// //       });
// //     }

// //     // --- Cas REFUS : notifier le médecin et sortir ---
// //     if (!body.approve) {
// //       const notifRes = await fetch(
// //         `/api/medecin/notifications/${accessRequest.medecinId}`,
// //         {
// //           method: "POST",
// //           headers: {
// //             "Content-Type": "application/json",
// //             Authorization: `Bearer ${token}`,
// //           },
// //           body: JSON.stringify({
// //             message: `Le patient ${patient.firstName || "Inconnu"} ${
// //               patient.lastName || "Inconnu"
// //             } a refusé votre demande d'accès.`,
// //             patientId,
// //             accessGranted: false,
// //             type: "accessResponse",
// //           }),
// //         }
// //       ).catch(() => null);
// //       if (notifRes && !notifRes.ok) {
// //         console.error(
// //           "Erreur notif médecin (refus):",
// //           await notifRes.text().catch(() => "")
// //         );
// //       }
// //       return NextResponse.json(
// //         { success: false, message: "Accès refusé" },
// //         { status: 200 }
// //       );
// //     }

// //     // --- Cas ACCEPTÉ : créer un GRANT limité + (optionnel) liste d'IDs ---
// //     const scope = (String(body.scope || "RESULTS").toUpperCase() as
// //       | "RESULTS"
// //       | "PRESCRIPTIONS"
// //       | "TESTS"
// //       | "ALL");
// //     const durationMinutes = Math.max(1, Number(body.durationMinutes || 0) || 0); // min 1 minute
// //     const now = new Date();
// //     const expiresAt = new Date(now.getTime() + durationMinutes * 60_000);
// //     const resourceIds = Array.isArray(body.resourceIds) ? body.resourceIds : [];

// //     // Hash du motif (si tu ajoutes plus tard "reason" dans AccessRequest)
// //     const reasonHash = crypto.createHash("sha256").update("").digest("hex"); // e3b0... si vide

// //     // 1) DB: créer un AccessGrant miroir (assure-toi d'avoir le modèle dans schema.prisma)
// //     const grant = await prisma.accessGrant.create({
// //       data: {
// //         patientId,
// //         medecinId: accessRequest.medecinId,
// //         scope: scope as any,
// //         resourceIds,
// //         expiresAt,
// //         revoked: false,
// //         reasonHash,
// //       },
// //     });

// //     // 2) Blockchain: invoquer GrantAccess (si activé)
// //     if (BLOCKCHAIN_ENABLED) {
// //       try {
// //         await fabricInvokeGrantAccess(
// //           grant.id,
// //           patientId,
// //           accessRequest.medecinId,
// //           scope,
// //           expiresAt.toISOString(),
// //           reasonHash,
// //           resourceIds
// //         );
// //       } catch (e: any) {
// //         console.error("Fabric GrantAccess failed:", e?.message || e);
// //         // Option: rollback DB si cohérence stricte requise
// //         // await prisma.accessGrant.delete({ where: { id: grant.id } });
// //         return NextResponse.json(
// //           {
// //             error: "Échec d'enregistrement blockchain",
// //             details: e instanceof Error ? e.message : String(e),
// //           },
// //           { status: 502 }
// //         );
// //       }
// //     } else {
// //       console.warn("BLOCKCHAIN_ENABLED=false : GrantAccess non invoqué (dev mode).");
// //     }

// //     // 3) Notifier le médecin
// //     const notifRes = await fetch(
// //       `/api/medecin/notifications/${accessRequest.medecinId}`,
// //       {
// //         method: "POST",
// //         headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
// //         body: JSON.stringify({
// //           message: `Le patient ${patient.firstName || "Inconnu"} ${
// //             patient.lastName || "Inconnu"
// //           } a approuvé votre demande d'accès.`,
// //           patientId,
// //           accessGranted: true,
// //           type: "accessResponse",
// //           grant: { id: grant.id, scope, expiresAt },
// //         }),
// //       }
// //     ).catch(() => null);
// //     if (notifRes && !notifRes.ok) {
// //       console.error(
// //         "Erreur notif médecin (accepté):",
// //         await notifRes.text().catch(() => "")
// //       );
// //     }

// //     // ✅ Pas de partage global via isShared/sharedWithId :
// //     //    l'accès est contrôlé au moment de la lecture via IsAccessAllowed (smart contract)

// //     return NextResponse.json(
// //       {
// //         success: true,
// //         message: "Accès approuvé",
// //         grant: { id: grant.id, scope, expiresAt, resourceIds },
// //       },
// //       { status: 200 }
// //     );
// //   } catch (error) {
// //     console.error("Erreur dans /api/patient/access/[relatedId] PATCH :", {
// //       message: error instanceof Error ? error.message : "Erreur inconnue",
// //       stack: error instanceof Error ? error.stack : undefined,
// //     });
// //     return NextResponse.json(
// //       {
// //         error: "Erreur lors de la mise à jour de l'accès",
// //         details: error instanceof Error ? error.message : "Erreur inconnue",
// //       },
// //       { status: 500 }
// //     );
// //   }
// // }


// // app/api/patient/access/[relatedId]/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";
// import { exec } from "child_process";
// import { promisify } from "util";
// import crypto from "node:crypto";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// const execAsync = promisify(exec);

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// // --- WSL/Fabric config ---
// const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
// const FABRIC_PATH_LINUX =
//   process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
// const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

// // TLS CA paths (réutilisés dans les invokes)
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
// # Vérifie que les deux peers sont up
// if ! docker ps --format "{{.Names}}" | grep -q "peer0.org1"; then
//   echo "ERROR: peer0.org1 non actif"
//   exit 2
// fi
// if ! docker ps --format "{{.Names}}" | grep -q "peer0.org2"; then
//   echo "ERROR: peer0.org2 non actif"
//   exit 2
// fi
// # Vérifie que le chaincode est bien committé
// if ! peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null | grep -q "meddata_secured"; then
//   echo "ERROR: Chaincode meddata_secured non déployé"
//   exit 3
// fi
// ${query}
// `;
//   const encodedScript = Buffer.from(scriptContent).toString("base64");
//   return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${encodedScript}' | base64 -d | bash"`;
// }

// // ---- helpers HTTP ----
// // function baseURLFromRequest(req: Request) {
// //   const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
// //   const proto = req.headers.get("x-forwarded-proto") || "http";
// //   return `${proto}://${host}`;
// // }

// // ---- Fabric helpers ----
// async function fabricInvokeGrantAccess(
//   grantId: string,
//   patientId: string,
//   doctorId: string,
//   scope: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL",
//   expiresAtISO: string,
//   reasonHash: string,
//   resourceIds: string[]
// ) {
//   const ccArgs = JSON.stringify({
//     function: "GrantAccess",
//     Args: [
//       grantId,
//       patientId,
//       doctorId,
//       scope,
//       expiresAtISO,
//       reasonHash,
//       JSON.stringify(resourceIds || []),
//     ],
//   });

//   // IMPORTANT : endosser sur Org1 + Org2
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
//     console.warn("Fabric STDERR (invoke):", stderr);
//   }
//   if (stdout) console.log("Fabric INVOKE GrantAccess OK:", stdout);
// }

// type ApproveBody = {
//   approve: boolean;
//   scope?: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL";
//   durationMinutes?: number; // ex. 60
//   resourceIds?: string[];   // optionnel: liste précise
// };

// // ✅ Handler PATCH : approbation / refus d'une demande d'accès
// export async function PATCH(
//   req: Request,
//   { params }: { params: { relatedId: string } }
// ) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json(
//         { error: "Configuration serveur incorrecte.", details: "Variable JWT_SECRET manquante." },
//         { status: 500 }
//       );
//     }

//     const token = req.headers.get("authorization")?.split(" ")[1];
//     if (!token) {
//       return NextResponse.json(
//         { error: "Token manquant pour notification", details: "En-tête Authorization absent." },
//         { status: 401 }
//       );
//     }

//     let payload: any;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token :", err);
//       return NextResponse.json(
//         { error: "Token invalide ou expiré.", details: err instanceof Error ? err.message : "Erreur inconnue" },
//         { status: 401 }
//       );
//     }

//     const patientId = typeof payload.id === "string" ? payload.id : null;
//     const role = typeof payload.role === "string" ? String(payload.role).toLowerCase() : null;
//     if (!patientId || role !== "patient") {
//       return NextResponse.json(
//         { error: "Seuls les patients peuvent approuver ou refuser une demande d'accès", details: "Rôle non autorisé" },
//         { status: 403 }
//       );
//     }

//     const accessRequestId = params.relatedId;
//     if (!accessRequestId) {
//       return NextResponse.json(
//         { error: "relatedId requis dans l'URL", details: "Paramètre relatedId manquant." },
//         { status: 400 }
//       );
//     }

//     const body = (await req.json()) as ApproveBody;
//     if (typeof body.approve !== "boolean") {
//       return NextResponse.json(
//         { error: "Le champ 'approve' doit être un booléen", details: `Valeur reçue : ${String((body as any).approve)}` },
//         { status: 400 }
//       );
//     }

//     // Vérifier la demande et la propriété
//     const accessRequest = await prisma.accessRequest.findFirst({
//       where: { id: accessRequestId, patientId },
//       include: { medecin: true },
//     });
//     if (!accessRequest) {
//       return NextResponse.json(
//         { error: "Demande d'accès non trouvée ou non autorisée", details: `relatedId: ${accessRequestId}, patientId: ${patientId}` },
//         { status: 404 }
//       );
//     }
//     if (accessRequest.status !== "En attente") {
//       return NextResponse.json(
//         { error: "Demande d'accès déjà traitée", details: `Statut actuel : ${accessRequest.status}` },
//         { status: 400 }
//       );
//     }

//     // Récup info patient (pour le message)
//     const patient = await prisma.user.findUnique({
//       where: { id: patientId },
//       select: { firstName: true, lastName: true },
//     });
//     if (!patient) {
//       return NextResponse.json({ error: "Patient non trouvé", details: `ID: ${patientId}` }, { status: 404 });
//     }

//     // Marquer la demande Accepté/Refusé
//     await prisma.accessRequest.update({
//       where: { id: accessRequestId },
//       data: { status: body.approve ? "Accepté" : "Refusé", updatedAt: new Date() },
//     });

//     // Marquer la notif liée comme lue (si existe)
//     const notification = await prisma.notification.findFirst({
//       where: { relatedId: accessRequestId, patientId },
//     });
//     if (notification) {
//       await prisma.notification.update({
//         where: { id: notification.id },
//         data: { read: true, message: `${notification.message || "Demande"} (${body.approve ? "Accepté" : "Refusé"})` },
//       });
//     }

//     // const base = baseURLFromRequest(req);

//     // --- Cas REFUS : notifier le médecin et sortir ---
//     // --- Cas REFUS : notifier le médecin et sortir ---
// if (!body.approve) {
//   try {
//     await prisma.notification.create({
//       data: {
//         medecinId: accessRequest.medecinId,
//         patientId,
//         message: `Le patient ${patient.firstName || "Inconnu"} ${patient.lastName || "Inconnu"} a refusé votre demande d'accès.`,
//         date: new Date(),
//         read: false,
//         type: "accessResponse",
//         target: "Medecin",
//         // IMPORTANT si ton schema a encore @unique sur relatedId :
//         // mets une valeur distincte par événement
//         relatedId: `${accessRequestId}:refused`,
//       },
//     });
//   } catch (e) {
//     console.error("Erreur creation notif Medecin (refus):", e);
//   }

//   return NextResponse.json({ success: false, message: "Accès refusé" }, { status: 200 });
// }


//     // --- Cas ACCEPTÉ : créer un GRANT limité + (optionnel) liste d'IDs ---
//     const scope = (String(body.scope || "RESULTS").toUpperCase() as "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL");
//     const durationMinutes = Math.max(1, Number(body.durationMinutes || 0) || 0); // min 1 minute
//     const now = new Date();
//     const expiresAt = new Date(now.getTime() + durationMinutes * 60_000);
//     const resourceIds = Array.isArray(body.resourceIds) ? body.resourceIds : [];

//     // Hash du motif (si tu ajoutes plus tard "reason" dans AccessRequest)
//     const reasonHash = crypto.createHash("sha256").update("").digest("hex"); // e3b0... si vide

//     // 1) DB: créer un AccessGrant miroir
//     const grant = await prisma.accessGrant.create({
//       data: {
//         patientId,
//         medecinId: accessRequest.medecinId,
//         scope: scope as any,
//         resourceIds,
//         expiresAt,
//         revoked: false,
//         reasonHash,
//       },
//     });

//     // 2) Blockchain: invoquer GrantAccess (si activé)
//     if (BLOCKCHAIN_ENABLED) {
//       try {
//         await fabricInvokeGrantAccess(
//           grant.id,
//           patientId,
//           accessRequest.medecinId,
//           scope,
//           expiresAt.toISOString(),
//           reasonHash,
//           resourceIds
//         );
//       } catch (e: any) {
//         console.error("Fabric GrantAccess failed:", e?.message || e);
//         // Option: rollback DB si cohérence stricte requise
//         // await prisma.accessGrant.delete({ where: { id: grant.id } });
//         return NextResponse.json(
//           { error: "Échec d'enregistrement blockchain", details: e instanceof Error ? e.message : String(e) },
//           { status: 502 }
//         );
//       }
//     } else {
//       console.warn("BLOCKCHAIN_ENABLED=false : GrantAccess non invoqué (dev mode).");
//     }

//     // 3) Notifier le médecin
//     try {
//   await prisma.notification.create({
//     data: {
//       medecinId: accessRequest.medecinId,
//       patientId,
//       message: `Le patient ${patient.firstName || "Inconnu"} ${patient.lastName || "Inconnu"} a approuvé votre demande d'accès.`,
//       date: new Date(),
//       read: false,
//       type: "accessResponse",
//       target: "Medecin",
//       // on peut lier à l’ID du grant (unique naturellement)
//       relatedId: `grant:${grant.id}`,
//     },
//   });
// } catch (e) {
//   console.error("Erreur creation notif Medecin (accepté):", e);
// }


//     // ✅ Pas de partage global via isShared/sharedWithId :
//     //    l'accès est contrôlé au moment de la lecture via IsAccessAllowed (smart contract)

//     return NextResponse.json(
//       {
//         success: true,
//         message: "Accès approuvé",
//         grant: { id: grant.id, scope, expiresAt, resourceIds },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Erreur dans /api/patient/access/[relatedId] PATCH :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de l'accès", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }


// app/api/patient/access/[relatedId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { exec } from "child_process";
import { promisify } from "util";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

// --- WSL/Fabric config ---
const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
const FABRIC_PATH_LINUX =
  process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";

// TLS CA paths (réutilisés dans les invokes)
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
# Vérifie que les deux peers sont up
if ! docker ps --format "{{.Names}}" | grep -q "peer0.org1"; then
  echo "ERROR: peer0.org1 non actif"
  exit 2
fi
if ! docker ps --format "{{.Names}}" | grep -q "peer0.org2"; then
  echo "ERROR: peer0.org2 non actif"
  exit 2
fi
# Vérifie que le chaincode est bien committé
if ! peer lifecycle chaincode querycommitted --channelID mychannel 2>/dev/null | grep -q "meddata_secured"; then
  echo "ERROR: Chaincode meddata_secured non déployé"
  exit 3
fi
${query}
`;
  const encodedScript = Buffer.from(scriptContent).toString("base64");
  return `wsl -d ${WSL_DISTRO} -- bash -c "echo '${encodedScript}' | base64 -d | bash"`;
}

// ---- Fabric helpers ----
async function fabricInvokeGrantAccess(
  grantId: string,
  patientId: string,
  doctorId: string,
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

  // IMPORTANT : endosser sur Org1 + Org2
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

type ApproveBody = {
  approve: boolean;
  scope?: "RESULTS" | "PRESCRIPTIONS" | "TESTS" | "ALL";
  durationMinutes?: number; // ex. 60
  resourceIds?: string[];   // optionnel: liste précise
};

// ✅ Handler PATCH : approbation / refus d'une demande d'accès
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ relatedId: string }> }
) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json(
        { error: "Configuration serveur incorrecte.", details: "Variable JWT_SECRET manquante." },
        { status: 500 }
      );
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      return NextResponse.json(
        { error: "Token manquant pour notification", details: "En-tête Authorization absent." },
        { status: 401 }
      );
    }

    // Vérif JWT
    let payload: any;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token :", err);
      return NextResponse.json(
        { error: "Token invalide ou expiré.", details: err instanceof Error ? err.message : "Erreur inconnue" },
        { status: 401 }
      );
    }

    const patientId = typeof payload.id === "string" ? payload.id : null;
    const role = typeof payload.role === "string" ? String(payload.role).toLowerCase() : null;
    if (!patientId || role !== "patient") {
      return NextResponse.json(
        { error: "Seuls les patients peuvent approuver ou refuser une demande d'accès", details: "Rôle non autorisé" },
        { status: 403 }
      );
    }

      const { relatedId: accessRequestId } = await params;
    if (!accessRequestId) {
      return NextResponse.json(
        { error: "relatedId requis dans l'URL", details: "Paramètre relatedId manquant." },
        { status: 400 }
      );
    }

    const body = (await req.json()) as ApproveBody;
    if (typeof body.approve !== "boolean") {
      return NextResponse.json(
        { error: "Le champ 'approve' doit être un booléen", details: `Valeur reçue : ${String((body as any).approve)}` },
        { status: 400 }
      );
    }

    // Vérifier la demande et la propriété
    const accessRequest = await prisma.accessRequest.findFirst({
      where: { id: accessRequestId, patientId },
      include: { medecin: true },
    });
    if (!accessRequest) {
      return NextResponse.json(
        { error: "Demande d'accès non trouvée ou non autorisée", details: `relatedId: ${accessRequestId}, patientId: ${patientId}` },
        { status: 404 }
      );
    }
    if (accessRequest.status !== "En attente") {
      return NextResponse.json(
        { error: "Demande d'accès déjà traitée", details: `Statut actuel : ${accessRequest.status}` },
        { status: 400 }
      );
    }

    // Récup info patient (pour le message)
    const patient = await prisma.user.findUnique({
      where: { id: patientId },
      select: { firstName: true, lastName: true },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient non trouvé", details: `ID: ${patientId}` }, { status: 404 });
    }

    // Marquer la demande Accepté/Refusé
    await prisma.accessRequest.update({
      where: { id: accessRequestId },
      data: { status: body.approve ? "Accepté" : "Refusé", updatedAt: new Date() },
    });

    // Marquer la notif liée comme lue (si existe côté patient)
    const notification = await prisma.notification.findFirst({
      where: { relatedId: accessRequestId, patientId },
    });
    if (notification) {
      await prisma.notification.update({
        where: { id: notification.id },
        data: { read: true, message: `${notification.message || "Demande"} (${body.approve ? "Accepté" : "Refusé"})` },
      });
    }

    // --- Cas REFUS : notifier le médecin et sortir ---
    // --- Cas REFUS : notifier le médecin et sortir ---
if (!body.approve) {
  try {
    await prisma.notification.upsert({
      where: {
        // ⚠️ correspond à @@unique([relatedId, type, target])
        relatedId_type_target: {
          relatedId: accessRequestId,
          type: "accessResponse",
          target: "Medecin",
        },
      },
      create: {
        medecinId: accessRequest.medecinId,
        patientId,
        message: `Le patient ${patient.firstName || "Inconnu"} ${patient.lastName || "Inconnu"} a refusé votre demande d'accès.`,
        date: new Date(),
        read: false,
        type: "accessResponse",
        target: "Medecin",
        relatedId: accessRequestId,
      },
      update: {
        message: `Le patient ${patient.firstName || "Inconnu"} ${patient.lastName || "Inconnu"} a refusé votre demande d'accès.`,
        read: false,
        date: new Date(),
        medecinId: accessRequest.medecinId,
        patientId,
      },
    });
    console.log("Notif médecin (refus) upsert OK");
  } catch (e) {
    console.error("Erreur notif Medecin (refus):", e);
  }

  return NextResponse.json({ success: false, message: "Accès refusé" }, { status: 200 });
}


    // --- Cas ACCEPTÉ : créer un GRANT limité + (optionnel) liste d'IDs ---
    const rawScope = String(body.scope || "RESULTS").toUpperCase();
    const scope = ((): "RESULTS" | "ORDONNANCES" | "TESTS" | "ALL" => {
      switch (rawScope) {
        case "PRESCRIPTIONS": return "ORDONNANCES";
        case "TESTS": return "TESTS";
        case "ALL": return "ALL";
        default: return "RESULTS";
      }
    })();

    const durationMinutes = Math.max(1, Number(body.durationMinutes || 0) || 0); // min 1 minute
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationMinutes * 60_000);
    const resourceIds = Array.isArray(body.resourceIds) ? body.resourceIds : [];

    // Hash du motif (si plus tard AccessRequest.reason)
    const reasonHash = crypto.createHash("sha256").update("").digest("hex"); // e3b0...

    // 1) DB: créer un AccessGrant miroir
    const grant = await prisma.accessGrant.create({
      data: {
        patientId,
        medecinId: accessRequest.medecinId,
        scope: scope as any,
        resourceIds,
        expiresAt,
        revoked: false,
        reasonHash,
        accessRequestId: accessRequestId, // <<-- LIEN !!!
      },
    });
    console.log("Grant créé :", grant.id);

    // 2) Blockchain: invoquer GrantAccess (si activé)
    if (BLOCKCHAIN_ENABLED) {
      try {
        await fabricInvokeGrantAccess(
          grant.id,
          patientId,
          accessRequest.medecinId,
          scope,
          expiresAt.toISOString(),
          reasonHash,
          resourceIds
        );
      } catch (e: any) {
        console.error("Fabric GrantAccess failed:", e?.message || e);
        // Option si cohérence stricte requise :
        // await prisma.accessGrant.delete({ where: { id: grant.id } });
        return NextResponse.json(
          { error: "Échec d'enregistrement blockchain", details: e instanceof Error ? e.message : String(e) },
          { status: 502 }
        );
      }
    } else {
      console.warn("BLOCKCHAIN_ENABLED=false : GrantAccess non invoqué (dev mode).");
    }

    // 2.5) Marquer en base les résultats explicitement partagés par le patient
// (pour que le médecin voie ces docs dans sa liste "sharedResults" et
// pour que /api/medecin/files/[id] sache que le doc est lié au partage)
if (Array.isArray(resourceIds) && resourceIds.length > 0) {
  // Vérifie que ces résultats appartiennent bien au patient
  const owned = await prisma.result.findMany({
    where: { id: { in: resourceIds }, patientId },
    select: { id: true },
  });
  const ownedIds = owned.map(r => r.id);

  if (ownedIds.length > 0) {
    await prisma.result.updateMany({
      where: { id: { in: ownedIds } },
      data: {
        isShared: true,
        sharedWithId: accessRequest.medecinId, // <— très important
      },
    });
  }
}

// 3) Notifier le médecin (écriture directe DB, idempotent via upsert)
try {
  await prisma.notification.upsert({
    where: {
      relatedId_type_target: {
        relatedId: accessRequestId,
        type: "accessResponse",
        target: "Medecin",
      },
    },
    create: {
      medecinId: accessRequest.medecinId,
      patientId,
      message: `Le patient ${patient.firstName || "Inconnu"} ${patient.lastName || "Inconnu"} a approuvé votre demande d'accès.`,
      date: new Date(),
      read: false,
      type: "accessResponse",
      target: "Medecin",
      relatedId: accessRequestId,
    },
    update: {
      message: `Le patient ${patient.firstName || "Inconnu"} ${patient.lastName || "Inconnu"} a approuvé votre demande d'accès.`,
      read: false,
      date: new Date(),
      medecinId: accessRequest.medecinId,
      patientId,
    },
  });
  console.log("Notif médecin (accepté) upsert OK");
} catch (e) {
  console.error("Erreur notif Medecin (accepté):", e);
}


    // ✅ L'accès sera contrôlé côté lecture via IsAccessAllowed (smart contract)
    return NextResponse.json(
      {
        success: true,
        message: "Accès approuvé",
        grant: { id: grant.id, scope, expiresAt, resourceIds },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans /api/patient/access/[relatedId] PATCH :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'accès", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
    
  }
}
