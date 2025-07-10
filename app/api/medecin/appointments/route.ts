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
//     const medecinId = decoded.id;

//     const medecin = await prisma.user.findUnique({
//       where: { id: medecinId, role: "Medecin" },
//     });
//     if (!medecin) {
//       return NextResponse.json({ error: "Médecin non trouvé ou rôle invalide." }, { status: 404 });
//     }

//     const rendezvous = await prisma.rendezVous.findMany({
//       where: { medecinId },
//       include: {
//         patient: {
//           select: { id: true, firstName: true, lastName: true },
//         },
//       },
//     });

//     return NextResponse.json(rendezvous, { status: 200 });
//   } catch (error: any) {
//     console.error("Erreur dans /api/medecin/rendezvous GET:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération des rendez-vous." },
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

//     const { patientId, date, location, isTeleconsultation } = await request.json();
//     if (!patientId || !date || !location) {
//       return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
//     }

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

//     const rendezvous = await prisma.rendezVous.create({
//       data: {
//         patientId,
//         medecinId,
//         date: new Date(date),
//         location,
//         isTeleconsultation: isTeleconsultation || false,
//         status: "Confirmé",
//       },
//     });

//     return NextResponse.json(rendezvous, { status: 201 });
//   } catch (error: any) {
//     console.error("Erreur dans /api/medecin/rendezvous POST:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la création du rendez-vous." },
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

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const medecinId = decoded.id;

    const medecin = await prisma.user.findUnique({
      where: { id: medecinId, role: "Medecin" },
    });
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé ou rôle invalide." }, { status: 404 });
    }

    const rendezvous = await prisma.rendezVous.findMany({
      where: { medecinId },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    return NextResponse.json(rendezvous, { status: 200 });
  } catch (error: any) {
    console.error("Erreur dans /api/medecin/rendezvous GET:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des rendez-vous." },
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
        medecinId,
        date: new Date(date),
        location,
        isTeleconsultation: isTeleconsultation || false,
        status: "Confirmé",
      },
    });

    // Créer une notification pour le patient
    await prisma.notification.create({
      data: {
        patientId,
        medecinId,
        message: `Nouveau rendez-vous confirmé le ${new Date(date).toLocaleDateString()}`,
        date: new Date(),
        read: false,
        type: "appointment", // Automatiquement défini
      },
    });

    return NextResponse.json(rendezvous, { status: 201 });
  } catch (error: any) {
    console.error("Erreur dans /api/medecin/rendezvous POST:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du rendez-vous." },
      { status: 500 }
    );
  }
}