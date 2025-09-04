// app/api/files/[id]/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const LOCAL_FILES_DIR = path.resolve(process.env.LOCAL_FILES_DIR || "./storage");

// Mock Blockchain
async function isAccessAllowed(patientId: string, doctorId: string, resultId: string): Promise<boolean> {
  console.log("➡️ Vérification Fabric accès fichier:", { patientId, doctorId, resultId });
  return true; // TODO : remplacer par invokeFabric("IsAccessAllowed")
}
async function recordAccessView(patientId: string, doctorId: string | "SELF", resultId: string) {
  console.log("➡️ Audit Fabric lecture fichier:", { patientId, doctorId, resultId });
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = String(payload.id);
    const role = String(payload.role).toLowerCase();

    const result = await prisma.result.findUnique({ where: { id: params.id } });
    if (!result) return NextResponse.json({ error: "Résultat introuvable" }, { status: 404 });

    // Cas patient
    if (role === "patient") {
      if (result.patientId !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
      await recordAccessView(result.patientId, "SELF", result.id);
    }

    // Cas médecin
    if (role === "medecin") {
      if (result.createdById !== userId) {
        const allowed = await isAccessAllowed(result.patientId, userId, result.id);
        if (!allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
      await recordAccessView(result.patientId, userId, result.id);
    }

    // Lecture fichier local
    const absPath = path.join(LOCAL_FILES_DIR, result.fileUrl);
    const file = await fs.readFile(absPath);

    return new Response(file, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${path.basename(absPath)}"`,
      },
    });
  } catch (e: any) {
    console.error("Erreur lecture fichier:", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
