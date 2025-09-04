import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) {
      console.log("Aucun token fourni pour /api/patient/access POST.");
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const medecinId = typeof payload.id === "string" ? payload.id : null;
    const role = typeof payload.role === "string" ? payload.role : null;
    if (!medecinId || role !== "Medecin") {
      console.log("Rôle non autorisé pour /api/patient/access POST :", { medecinId, role });
      return NextResponse.json({ error: "Seuls les médecins peuvent demander l'accès" }, { status: 403 });
    }

    const { patientId, resultId, motif } = await req.json();
    if (!patientId) {
      console.error("patientId manquant dans le corps de la requête.");
      return NextResponse.json({ error: "patientId requis" }, { status: 400 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: "Patient" },
    });
    if (!patient) {
      console.log("Patient non trouvé pour patientId :", patientId);
      return NextResponse.json({ error: "Patient non trouvé" }, { status: 404 });
    }

    // Récupérer les informations du médecin
    const medecin = await prisma.user.findUnique({
      where: { id: medecinId, role: "Medecin" },
      select: { firstName: true, lastName: true },
    });
    if (!medecin) {
      console.log("Médecin non trouvé pour medecinId :", medecinId);
      return NextResponse.json({ error: "Médecin non trouvé" }, { status: 404 });
    }

    // Créer la demande d'accès
    const accessRequest = await prisma.accessRequest.create({
      data: {
        status: "En attente",
        patientId,
        medecinId,
        createdAt: new Date(),
        updatedAt: new Date(),
        motif,
      },
    });

    // Créer la notification pour le patient avec type "accessRequest"
    const notification = await prisma.notification.create({
      data: {
        message: `Le Dr. ${medecin.firstName || "Inconnu"} ${medecin.lastName || "Inconnu"} demande l'accès à votre dossier. Motif : ${motif || "Non spécifié"}`,
        date: new Date(),
        read: false,
        type: "accessRequest",
        target: "Patient",
        relatedId: accessRequest.id,
        patientId,
        medecinId,
      },
    });

    console.log("Demande d'accès créée :", { accessRequest, notification });

    return NextResponse.json({ success: true, accessRequest: { ...accessRequest, motif }, notification }, { status: 201 });
  } catch (error) {
    console.error("Erreur dans /api/patient/access POST :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la création de la demande", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}