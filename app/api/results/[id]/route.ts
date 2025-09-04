import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

// Mock Blockchain
async function isAccessAllowed(patientId: string, doctorId: string, resultId: string): Promise<boolean> {
  console.log("➡️ Vérification Fabric:", { patientId, doctorId, resultId });
  return true; // à remplacer par invokeFabric("IsAccessAllowed", [...])
}
async function recordAccessView(patientId: string, doctorId: string, resultId: string) {
  console.log("➡️ Audit Fabric:", { patientId, doctorId, resultId });
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const userId = String(payload.id);
    const role = String(payload.role).toLowerCase();

    const result = await prisma.result.findUnique({
      where: { id: params.id },
    });
    if (!result) return NextResponse.json({ error: "Résultat introuvable" }, { status: 404 });

    if (role === "patient") {
      if (result.patientId !== userId) return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
      await recordAccessView(result.patientId, "SELF", result.id);
      return NextResponse.json(result);
    }

    if (role === "medecin") {
      const allowed = await isAccessAllowed(result.patientId, userId, result.id);
      if (!allowed) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      await recordAccessView(result.patientId, userId, result.id);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Rôle invalide" }, { status: 403 });
  } catch (e: any) {
    console.error("Erreur lecture résultat:", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
