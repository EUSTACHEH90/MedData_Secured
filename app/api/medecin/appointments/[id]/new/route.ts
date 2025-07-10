import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Aucun token fourni." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const medecinId = decoded.id;

    console.log("GET /api/medecin/rendezvous - medecinId:", medecinId);

    const medecin = await prisma.user.findUnique({
      where: { id: medecinId, role: "Medecin" },
    });
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé ou rôle invalide." }, { status: 404 });
    }

    const rendezvous = await prisma.rendezVous.findMany({
      where: { medecinId: medecinId }, // medecinId peut être null, mais ici on filtre sur une valeur non-null
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    console.log("Rendez-vous trouvés:", rendezvous.length);

    return NextResponse.json(rendezvous, { status: 200 });
  } catch (error: any) {
    console.error("Erreur dans /api/medecin/rendezvous GET:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous.", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Aucun token fourni." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const medecinId = decoded.id;

    const { patientId, date, location, isTeleconsultation } = await request.json();
    if (!patientId || !date || !location) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    console.log("POST /api/medecin/rendezvous - données:", { patientId, medecinId, date, location, isTeleconsultation });

    const medecin = await prisma.user.findUnique({
      where: { id: medecinId, role: "Medecin" },
    });
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé ou rôle invalide." }, { status: 404 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: "Patient" },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
    }

    const rendezvous = await prisma.rendezVous.create({
      data: {
        patientId,
        medecinId, // Puisque medecinId est facultatif, cela fonctionne, mais on s'assure qu'il est défini
        date: new Date(date),
        location,
        isTeleconsultation: isTeleconsultation || false,
        status: "Confirmé",
      },
    });

    console.log("Rendez-vous créé:", rendezvous);

    return NextResponse.json(rendezvous, { status: 201 });
  } catch (error: any) {
    console.error("Erreur dans /api/medecin/rendezvous POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous.", details: error.message },
      { status: 500 }
    );
  }
}