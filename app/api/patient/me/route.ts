import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      console.log("Aucun token fourni dans Authorization.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = result.payload;
    } catch (err) {
      console.log("Token invalide ou expiré :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = payload.id as string;
    const role = payload.role as string;

    if (!userId || !role) {
      console.log("Payload manquant ou invalide :", payload);
      return NextResponse.json({ message: "Données du token invalides." }, { status: 401 });
    }

    if (role !== "Patient") {
      console.log("Rôle non autorisé pour /api/patient/me :", role);
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });

    if (!patient) {
      console.log("Patient non trouvé pour userId :", userId);
      return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
    }

    console.log("Données patient renvoyées :", patient);
    return NextResponse.json(patient);
  } catch (error) {
    console.error("Erreur /api/patient/me :", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}