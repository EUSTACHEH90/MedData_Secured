import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // Ajustez le chemin selon votre structure

// Interfaces basées sur schema.prisma
interface User {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dateOfBirth: Date | null;
  medicalHistory: string | null;
  gender: string | null;
  address: string | null;
  phoneNumber: string | null;
  socialSecurityNumber: string | null;
  bloodType: string | null;
  allergies: string | null;
  weight: string | null;
  height: string | null;
  bloodPressure: { systolic: string; diastolic: string } | null;
  heartRate: string | null;
  oxygen: string | null;
  temperature: string | null;
  consultationsAsPatient: Consultation[];
  rendezVousAsPatient: RendezVous[];
}

interface Consultation {
  id: string;
  date: Date;
  summary: string;
  medecin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface RendezVous {
  id: string;
  date: Date;
  location: string | null;
  status: string;
  isTeleconsultation: boolean;
  medecin: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

export async function GET() {
  try {
    const patients = await prisma.user.findMany({
      where: {
        role: "Patient", // Filtrer uniquement les patients
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        medicalHistory: true,
        gender: true,
        address: true,
        phoneNumber: true,
        socialSecurityNumber: true,
        bloodType: true,
        allergies: true,
        weight: true,
        height: true,
        bloodPressure: true,
        heartRate: true,
        oxygen: true,
        temperature: true,
        consultationsAsPatient: {
          select: {
            id: true,
            date: true,
            summary: true,
            medecin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        rendezVousAsPatient: {
          select: {
            id: true,
            date: true,
            location: true,
            status: true,
            isTeleconsultation: true,
            medecin: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (patients.length === 0) {
      return NextResponse.json({ message: "Aucun patient trouvé" }, { status: 404 });
    }

    // Formater la réponse si nécessaire
    const formattedPatients = patients.map((patient: User) => ({
      ...patient,
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString() : null,
      bloodPressure: patient.bloodPressure ? JSON.stringify(patient.bloodPressure) : null,
      consultationsAsPatient: patient.consultationsAsPatient.map((consultation: Consultation) => ({
        ...consultation,
        date: consultation.date.toISOString(),
      })),
      rendezVousAsPatient: patient.rendezVousAsPatient.map((rendezVous: RendezVous) => ({
        ...rendezVous,
        date: rendezVous.date.toISOString(),
      })),
    }));

    return NextResponse.json(formattedPatients, { status: 200 });
  } catch (error: unknown) {
    let errorMessage = "Erreur interne du serveur";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Erreur lors de la récupération des patients:", error);
    }
    return NextResponse.json({ message: "Erreur interne du serveur", error: errorMessage }, { status: 500 });
  }
}