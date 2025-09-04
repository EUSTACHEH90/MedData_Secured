


// app/api/medecin/results/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";
import { exec } from "child_process";
import { promisify } from "util";
import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";
import crypto from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

const WSL_DISTRO = process.env.WSL_DISTRO || "Ubuntu";
const FABRIC_PATH_LINUX = process.env.FABRIC_PATH_LINUX || "/home/user/fabric-samples/test-network";
const BLOCKCHAIN_ENABLED = process.env.BLOCKCHAIN_ENABLED !== "false";
const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./stockage");

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

function isHttpUrl(u?: string | null): u is string {
  if (!u) return false;
  try {
    const x = new URL(u);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
}

function isGoogleDriveUrl(u?: string | null): u is string {
  if (!u) return false;
  try {
    const x = new URL(u);
    return (x.hostname === "drive.google.com" && x.pathname.startsWith("/file/d/")) ||
           (x.hostname === "docs.google.com" && x.pathname.startsWith("/document/d/"));
  } catch {
    return false;
  }
}

async function sha256Buffer(buf: Buffer): Promise<string> {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function computeHashFromLocal(relativePath: string): Promise<string | null> {
  try {
    const safe = relativePath.replace(/^[/\\]+/, "");
    const abs = path.join(LOCAL_FILES_DIR, safe);
    if (!abs.startsWith(LOCAL_FILES_DIR)) return null;
    const stat = await fsp.stat(abs).catch(() => null);
    if (!stat || !stat.isFile()) return null;
    const fileBuf = await fsp.readFile(abs);
    return await sha256Buffer(fileBuf);
  } catch {
    return null;
  }
}

async function computeHashFromHttp(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const ab = await resp.arrayBuffer();
    return await sha256Buffer(Buffer.from(ab));
  } catch {
    return null;
  }
}

async function computeHashFromGoogleDrive(url: string): Promise<string | null> {
  try {
    const match = url.match(/\/(file|document)\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) {
      console.error("Format d'URL Google Drive invalide:", url);
      return null;
    }
    const fileId = match[2];

    const localFilePath = path.join(LOCAL_FILES_DIR, `${fileId}.pdf`);
    console.log("Vérification du fichier local:", localFilePath, "Existe:", fs.existsSync(localFilePath));

    if (fs.existsSync(localFilePath)) {
      console.log("Fichier trouvé dans stockage, lecture...");
      const fileBuf = await fsp.readFile(localFilePath);
      const hash = await sha256Buffer(fileBuf);
      console.log("Hash from cached file - Buffer length:", fileBuf.length, "Sample:", fileBuf.slice(0, 10).toString('hex'));
      return hash;
    }

    console.log("Fichier non trouvé, téléchargement depuis:", `https://drive.google.com/uc?export=download&id=${fileId}`);
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("Erreur téléchargement Google Drive:", response.status, await response.text());
      return null;
    }

    const contentType = response.headers.get("content-type");
    console.log("Type de contenu détecté:", contentType);
    const ab = await response.arrayBuffer();
    const buf = Buffer.from(ab);

    console.log("Sauvegarde du fichier dans:", localFilePath);
    await fsp.mkdir(path.dirname(localFilePath), { recursive: true });
    await fsp.writeFile(localFilePath, buf);

    const hash = await sha256Buffer(buf);
    console.log("Hash from downloaded file - Buffer length:", buf.length, "Sample:", buf.slice(0, 10).toString('hex'));
    return hash;
  } catch (err) {
    console.error("Erreur lors du calcul du hash Google Drive :", err);
    return null;
  }
}

// --- GET (inchangé)
export async function GET(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const results = await prisma.result.findMany({
      where: {
        OR: [
          { sharedWithId: userId, isShared: true },
          { createdById: userId }
        ]
      },
      include: { patient: { select: { id: true, firstName: true, lastName: true } } },
    });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Erreur lors de la récupération des résultats." },
      { status: 500 }
    );
  }
}

// --- POST
export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const {
      patientId, type, date, description,
      fileUrl,                // http(s), Google Drive OU chemin RELATIF "results/..."
      isShared,
      documentHash            // optionnel (fourni par le front si upload)
    } = await req.json();

    if (!patientId || !type || !date) {
      return NextResponse.json({ error: "patientId, type et date sont requis." }, { status: 400 });
    }

    // 1) Calcul du hash si manquant (forcer l'appel même si documentHash existe)
    let finalHash: string | null = null;
    console.log("Début calcul du hash, fileUrl:", fileUrl, "documentHash fourni:", documentHash);
    if (fileUrl && isGoogleDriveUrl(fileUrl)) {
      finalHash = await computeHashFromGoogleDrive(fileUrl);
      console.log("Hash calculé:", finalHash);
    } else if (fileUrl && isHttpUrl(fileUrl)) {
      finalHash = await computeHashFromHttp(fileUrl);
    } else if (fileUrl) {
      finalHash = await computeHashFromLocal(String(fileUrl));
    } else if (documentHash) {
      finalHash = documentHash; // Utiliser le hash fourni seulement si pas de fileUrl
      console.log("Utilisation du hash fourni par le front:", finalHash);
    }

    // 2) Si la blockchain est activée, on impose que le hash existe
    if (BLOCKCHAIN_ENABLED && !finalHash) {
      return NextResponse.json(
        { error: "Impossible de calculer le hash du document. Vérifiez fileUrl ou uploadez un PDF." },
        { status: 422 }
      );
    }

    // 3) Création en base
    const created = await prisma.result.create({
      data: {
        patientId,
        createdById: userId,
        type,
        date: new Date(date),
        description: description || null,
        fileUrl: fileUrl || null,         // stocke URL Google Drive, HTTP(S) ou RELATIF si local
        documentHash: finalHash || null,  // ✅ hash garanti si blockchain ON
        isShared: Boolean(isShared),
        sharedWithId: isShared ? userId : null,
      },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        sharedWith: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // 4) Notif patient
    await prisma.notification.create({
      data: {
        patientId,
        medecinId: userId,
        message: `Nouveau résultat (${type}) du ${new Date(date).toLocaleDateString("fr-FR")} par Dr ${created.createdBy.firstName} ${created.createdBy.lastName}`,
        date: new Date(),
        read: false,
        type: "result",
        target: "Patient",
      },
    });

    // 5) Blockchain
    if (BLOCKCHAIN_ENABLED) {
      try {
        await storeResultOnBlockchain(created);
      } catch (err) {
        console.error("❌ Erreur blockchain :", err);
        // tu peux décider d'échouer la requête si c'est critique
      }
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Erreur création résultat :", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du résultat." },
      { status: 500 }
    );
  }
}

async function storeResultOnBlockchain(result: any) {
  const query = `peer chaincode invoke -o localhost:7050 \
--ordererTLSHostnameOverride orderer.example.com \
--tls --cafile ${FABRIC_PATH_LINUX}/organizations/ordererOrganizations/example.com/tlsca/tlsca.example.com-cert.pem \
-C mychannel -n meddata_secured \
--peerAddresses localhost:7051 \
--tlsRootCertFiles ${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt \
--peerAddresses localhost:9051 \
--tlsRootCertFiles ${FABRIC_PATH_LINUX}/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt \
-c '{"function":"RecordAccess","Args":["${result.id}","${result.patientId}","Ajout résultat","${result.documentHash ?? "hash-non-disponible"}"]}'`;

  const command = buildWSLCommand(query);
  const { stdout, stderr } = await execAsync(command, { timeout: 30000, encoding: "utf8", windowsHide: true });

  if (stderr && !stderr.includes("Chaincode invoke successful")) {
    throw new Error(`Erreur blockchain: ${stderr}`);
  }

  await prisma.blockchainTransaction.create({
    data: {
      relatedResultId: result.id,
      transactionHash: result.documentHash ?? "hash-non-disponible",
      status: "success",
      transactionId: (stdout || "invoke-success").trim(),
    },
  });
}