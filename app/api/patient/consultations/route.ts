import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

interface Consultation {
  id: string;
  date: string;
  doctorName: string;
  summary: string;
  documentHash?: string | null;
}

// Définir le type pour les éléments retournés par findMany
interface ConsultationFromPrisma {
  id: string;
  date: Date;
  summary: string;
  medecin: {
    firstName: string | null;
    lastName: string | null;
  };
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
      console.log("Aucun token fourni dans Authorization pour /api/patient/consultations.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    // Vérifier le token JWT
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/patient/consultations :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    // Valider le payload
    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;

    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé ou payload invalide pour /api/patient/consultations :", { userId, role });
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    // Trouver l'utilisateur associé (patient)
    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Patient" },
    });

    if (!user) {
      console.log("Aucun utilisateur patient trouvé pour userId :", userId);
      return NextResponse.json({ message: "Patient non trouvé." }, { status: 404 });
    }

    // Récupérer les consultations du patient
    const consultations = await prisma.consultation.findMany({
      where: { patientId: userId },
      select: {
        id: true,
        date: true,
        summary: true,
        medecin: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Formater les consultations
    const formattedConsultations: Consultation[] = consultations.map((c: ConsultationFromPrisma) => ({
      id: c.id,
      date: c.date.toISOString().split("T")[0],
      doctorName: `${c.medecin.firstName ?? "Dr"} ${c.medecin.lastName ?? "Non spécifié"}`.trim(),
      summary: c.summary || "Aucun résumé disponible",
      documentHash: null, // À implémenter pour le hachage Blockchain
    }));

    console.log("Consultations renvoyées pour userId :", userId, {
      patientId: userId,
      count: formattedConsultations.length,
      consultations: formattedConsultations.map((c) => ({ id: c.id, date: c.date })),
    });

    return NextResponse.json(formattedConsultations, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/patient/consultations :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { message: "Erreur lors de la récupération des consultations.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}