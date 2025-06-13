import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      console.log("Aucun token fourni dans Authorization pour /medecin/available.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = result.payload;
    } catch (err) {
      console.log("Token invalide ou expiré pour /medecin/available :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = payload.id as string;
    const role = payload.role as string;

    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé ou payload invalide pour /medecin/available :", role);
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const doctors = await prisma.user.findMany({
      where: { role: "Medecin" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        speciality: true,
      },
    });

    console.log("Médecins disponibles renvoyés pour userId :", userId, doctors);
    return NextResponse.json(doctors);
  } catch (error) {
    console.error("Erreur /api/medecin/available :", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}