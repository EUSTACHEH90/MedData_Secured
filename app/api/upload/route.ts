import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import path from "node:path";
import fsp from "node:fs/promises";
import crypto from "node:crypto";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

// --- Simule Blockchain ---
// TODO: remplacer par un vrai invoke sur Fabric
async function recordBlockchain(action: string, resultId: string, userId: string, hash: string) {
  console.log("📌 Blockchain:", { action, resultId, userId, hash });
  return { txId: "FAKE_TX_" + Date.now() };
}

export async function POST(req: Request) {
  try {
    // Vérification JWT
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });

    const uploaderId = payload.id as string;
    const role = String(payload.role).toLowerCase();

    if (role !== "patient" && role !== "medecin") {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 403 });
    }

    // Récupération du fichier
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Fichier manquant" }, { status: 400 });

    const category = String(form.get("category") || "resultats");
    const patientId = role === "patient" ? uploaderId : String(form.get("patientId") || "");

    if (role === "medecin" && !patientId) {
      return NextResponse.json({ error: "patientId obligatoire si médecin" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Seuls les PDF sont acceptés" }, { status: 415 });
    }

    // Chemin local
    const buf = Buffer.from(await file.arrayBuffer());
    const hash = crypto.createHash("sha256").update(buf).digest("hex");

    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");

    const rand = crypto.randomBytes(6).toString("hex");
    const relDir = path.join("results", `${y}-${m}-${d}`);
    const relFile = `${patientId}-${rand}.pdf`;
    const relPath = path.join(relDir, relFile);
    const absPath = path.join(LOCAL_FILES_DIR, relPath);

    await fsp.mkdir(path.dirname(absPath), { recursive: true });
    await fsp.writeFile(absPath, buf);

    // Enregistrement BD
    const result = await prisma.result.create({
      data: {
        patientId,
        createdById: uploaderId,
        type: category.toUpperCase(),
        date: today,
        description: `Fichier uploadé (${category})`,
        fileUrl: relPath,
        documentHash: hash,
        blockchainVerified: false,
      },
    });

    // Blockchain log
    const bc = await recordBlockchain("UPLOAD", result.id, uploaderId, hash);
    await prisma.blockchainTransaction.create({
      data: {
        relatedResultId: result.id,
        transactionId: bc.txId,
        transactionHash: hash,
        status: "SUCCESS",
      },
    });

    await prisma.result.update({
      where: { id: result.id },
      data: { blockchainVerified: true, blockchainVerifiedAt: new Date() },
    });

    return NextResponse.json({ ok: true, resultId: result.id, fileUrl: relPath });
  } catch (e: any) {
    console.error("Erreur upload:", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
