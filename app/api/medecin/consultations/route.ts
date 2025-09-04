// import { NextResponse } from "next/server";
// import jwt from "jsonwebtoken";
// import prisma from "@/lib/prisma";

// export async function GET(request: Request) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Aucun token fourni." }, { status: 401 });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
//     const userId = decoded.id;

//     console.log("GET /api/medecin/consultations - medecinId:", userId);

//     const medecin = await prisma.user.findUnique({
//       where: { id: userId, role: "Medecin" },
//     });
//     if (!medecin) {
//       return NextResponse.json({ error: "Médecin non trouvé ou rôle invalide." }, { status: 404 });
//     }

//     const consultations = await prisma.consultation.findMany({
//       where: { medecinId: userId },
//       include: {
//         patient: {
//           select: { id: true, firstName: true, lastName: true },
//         },
//       },
//     });

//     console.log("Consultations trouvées:", consultations.length);

//     return NextResponse.json(consultations, { status: 200 });
//   } catch (error: any) {
//     console.error("Erreur dans /api/medecin/consultations GET:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération des consultations.", details: error.message },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const token = request.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ error: "Aucun token fourni." }, { status: 401 });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
//     const medecinId = decoded.id;

//     const { patientId, date, summary } = await request.json();
//     if (!patientId || !date || !summary) {
//       return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
//     }

//     console.log("POST /api/medecin/consultations - données:", { patientId, medecinId, date, summary });

//     const medecin = await prisma.user.findUnique({
//       where: { id: medecinId, role: "Medecin" },
//     });
//     if (!medecin) {
//       return NextResponse.json({ error: "Médecin non trouvé ou rôle invalide." }, { status: 404 });
//     }

//     const patient = await prisma.user.findUnique({
//       where: { id: patientId, role: "Patient" },
//     });
//     if (!patient) {
//       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
//     }

//     const consultation = await prisma.consultation.create({
//       data: {
//         patientId,
//         medecinId,
//         date: new Date(date),
//         summary,
//       },
//     });

//     console.log("Consultation créée:", consultation);

//     return NextResponse.json(consultation, { status: 201 });
//   } catch (error: any) {
//     console.error("Erreur dans /api/medecin/consultations POST:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la création de la consultation.", details: error.message },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Aucun token fourni." }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string; role: string };
    if (decoded.role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const consultations = await prisma.consultation.findMany({
      where: { medecinId: decoded.id },
      include: { patient: { select: { firstName: true, lastName: true } } }, // Inclure les données du patient
    });

    return NextResponse.json(consultations, { status: 200 });
  } catch (error: any) {
    console.error("Erreur dans /api/medecin/consultations GET:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des consultations.", details: error.message },
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

    const { patientId, date, summary } = await request.json();
    if (!patientId || !date || !summary) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    console.log("POST /api/medecin/consultations - données:", { patientId, medecinId, date, summary });

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

    const consultation = await prisma.consultation.create({
      data: {
        patientId,
        medecinId,
        date: new Date(date),
        // target: "Patient",
        summary,
      },
    });

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        patientId,
        medecinId,
        message: `Nouvelle consultation planifiée le ${new Date(date).toLocaleDateString()}`,
        date: new Date(),
        read: false,
        type: "consultation", // Automatiquement défini
        target: "Patient",
      },
    });

    console.log("Consultation créée:", consultation);

    return NextResponse.json(consultation, { status: 201 });
  } catch (error: any) {
    console.error("Erreur dans /api/medecin/consultations POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la consultation.", details: error.message },
      { status: 500 }
    );
  }
}