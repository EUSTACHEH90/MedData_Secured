import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

interface AppointmentRecord {
  id: string;
  createdAt: Date;
  title: string | null;
  doctor: {
    firstName: string;
    lastName: string;
  };
}

interface Appointment {
  id: string;
  date: string;
  location: string;
  status: string;
  isTeleconsultation: boolean;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      console.log("Aucun token fourni dans Authorization pour /appointments.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = result.payload;
    } catch (err) {
      console.log("Token invalide ou expiré pour /appointments :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = payload.id as string;
    const role = payload.role as string;

    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé ou payload invalide pour /appointments :", role);
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const appointments = await prisma.medicalRecord.findMany({
      where: { patientId: userId, type: "AUTRE" },
      select: {
        id: true,
        createdAt: true,
        title: true,
        doctor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const formattedAppointments: Appointment[] = appointments.map((a: AppointmentRecord) => ({
      id: a.id,
      date: a.createdAt.toISOString().split("T")[0],
      location: a.title || "Non spécifié",
      status: "Confirmé",
      isTeleconsultation: false,
    }));

    console.log("Rendez-vous renvoyés pour userId :", userId, formattedAppointments);
    return NextResponse.json(formattedAppointments);
  } catch (error) {
    console.error("Erreur /api/patient/appointments :", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}