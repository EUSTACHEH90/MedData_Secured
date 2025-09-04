import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ajustez le chemin selon votre structure
import { jwtVerify } from "jose";

// Définition des interfaces pour les types
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  medicalHistory: string | null;
}

interface Doctor extends User {
  email: string | null;
  speciality: string | null;
  phoneNumber: string | null;
  address: string | null;
  numeroOrdre: string | null;
}

interface Notification {
  id: string;
  message: string;
  date: Date;
  read: boolean;
  patientId: string | null;
}

interface Result {
  id: string;
  type: string;
  date: Date;
  description: string;
  fileUrl: string | null;
  patientId: string;
  patient: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const doctor = await prisma.user.findUnique({
      where: { id: userId, role: "Medecin" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        speciality: true,
        phoneNumber: true,
        address: true,
        numeroOrdre: true,
      },
    });

    if (!doctor) {
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const patients = await prisma.user.findMany({
      where: {
        role: "Patient",
        consultationsAsPatient: {
          some: { medecinId: userId },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        medicalHistory: true,
      },
    });

    const notifications = await prisma.notification.findMany({
      where: { medecinId: userId },
      select: {
        id: true,
        message: true,
        date: true,
        read: true,
        patientId: true,
      },
    });

    const sharedResults = await prisma.result.findMany({
      where: { createdById: userId, isShared: true },
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        fileUrl: true,
        patientId: true,
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        doctor,
        patients: patients.map((p: User) => ({
          id: p.id,
          firstName: p.firstName,
          lastName: p.lastName,
          dateOfBirth: p.dateOfBirth ? p.dateOfBirth.toISOString() : null,
          dossier: p.medicalHistory || "Aucun dossier médical",
        })),
        notifications,
        sharedResults,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans /api/medecin/me GET :", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const body = await req.json();
    const { firstName, lastName, email, speciality, phoneNumber, address, numeroOrdre } = body;

    const updatedDoctor = await prisma.user.update({
      where: { id: userId, role: "Medecin" },
      data: {
        firstName,
        lastName,
        email,
        speciality,
        phoneNumber,
        address,
        numeroOrdre: body.numeroOrdre,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        speciality: true,
        phoneNumber: true,
        address: true,
        numeroOrdre: true,
      },
    });

    return NextResponse.json(updatedDoctor, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/medecin/me PUT :", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du profil." },
      { status: 500 }
    );
  }
}