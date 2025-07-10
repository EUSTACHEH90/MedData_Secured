import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  speciality: string;
}

// Définir le type pour les éléments retournés par findMany
interface DoctorFromPrisma {
  id: string;
  firstName: string | null;
  lastName: string | null;
  speciality: string | null;
}

export async function GET(req: Request) {
  try {
    // Vérifier la configuration de l'environnement
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini dans les variables d'environnement.");
      return NextResponse.json(
        { message: "Configuration serveur incorrecte." },
        { status: 500 }
      );
    }

    // Extraire et valider le token
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      console.log("Aucun token fourni dans Authorization pour /api/medecin/available.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    // Vérifier le token JWT
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/medecin/available :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    // Valider le payload avec une vérification stricte
    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;

    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé ou payload invalide pour /api/medecin/available :", { userId, role });
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Patient" },
    });
    if (!user) {
      console.log("Utilisateur non trouvé pour userId :", userId);
      return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
    }

    // Récupérer les médecins disponibles
    const doctors = await prisma.user.findMany({
      where: { role: "Medecin" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        speciality: true,
      },
    });

    // Formater les données avec type explicite
    const formattedDoctors: Doctor[] = doctors.map((d: DoctorFromPrisma) => ({
      id: d.id,
      firstName: d.firstName ?? "Non spécifié",
      lastName: d.lastName ?? "",
      speciality: d.speciality ?? "Non spécifiée",
    }));

    console.log("Médecins disponibles renvoyés pour userId :", userId, {
      count: formattedDoctors.length,
      doctors: formattedDoctors.map((d) => ({ id: d.id, speciality: d.speciality })),
    });

    return NextResponse.json(formattedDoctors, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/medecin/available :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: "Erreur lors de la récupération des médecins.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}