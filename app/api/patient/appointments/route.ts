// // app/api/patient/appointments/route.ts
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";

// const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

// async function verifyToken(req: Request) {
//   const authHeader = req.headers.get("authorization");
//   const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

//   if (!token) {
//     return { error: "Token manquant.", status: 401 };
//   }

//   try {
//     const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//     const payload = result.payload;
    
//     const userId = payload.id as string;
//     const role = payload.role as string;

//     if (!userId || role !== "Patient") {
//       return { error: "Accès non autorisé.", status: 403 };
//     }

//     return { userId };
//   } catch (err) {
//     return { error: "Token invalide ou expiré.", status: 401 };
//   }
// }

// export async function GET(req: Request) {
//   try {
//     const authResult = await verifyToken(req);
    
//     if ('error' in authResult) {
//       return NextResponse.json({ error: authResult.error }, { status: authResult.status });
//     }

//     const { userId } = authResult;

//     const appointments = await prisma.rendezVous.findMany({
//       where: { patientId: userId },
//       orderBy: { date: 'asc' },
//     });

//     return NextResponse.json(appointments);
//   } catch (error) {
//     console.error("Erreur GET appointments:", error);
//     return NextResponse.json({ error: "Erreur lors de la récupération des rendez-vous." }, { status: 500 });
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const authResult = await verifyToken(req);
    
//     if ('error' in authResult) {
//       return NextResponse.json({ error: authResult.error }, { status: authResult.status });
//     }

//     const { userId } = authResult;
//     const body = await req.json();
//     const { date, location, isTeleconsultation } = body;

//     if (!date) {
//       return NextResponse.json({ error: "La date est requise." }, { status: 400 });
//     }

//     const newAppointment = await prisma.rendezVous.create({
//   data: {
//     patient: {
//       connect: { id: userId }, // Lie le rendez-vous à un utilisateur existant via son ID
//     },
//     date: new Date(date),
//     location: location || null,
//     status: "En attente",
//     isTeleconsultation: isTeleconsultation || false,
//   },
// });

//     return NextResponse.json(newAppointment, { status: 201 });
//   } catch (error) {
//     console.error("Erreur POST appointment:", error);
    
//     if (error instanceof Error && error.message.includes('Invalid date')) {
//       return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
//     }
    
//     return NextResponse.json({ error: "Erreur lors de la création du rendez-vous." }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function verifyToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return { error: "Token manquant.", status: 401 };
  }

  try {
    const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const payload = result.payload;
    
    const userId = payload.id as string;
    const role = payload.role as string;

    if (!userId || role !== "Patient") {
      return { error: "Accès non autorisé.", status: 403 };
    }

    return { userId };
  } catch (err) {
    return { error: "Token invalide ou expiré.", status: 401 };
  }
}

export async function GET(req: Request) {
  try {
    const authResult = await verifyToken(req);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    const appointments = await prisma.rendezVous.findMany({
      where: { patientId: userId },
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Erreur GET appointments:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des rendez-vous." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const authResult = await verifyToken(req);
    
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const body = await req.json();
    const { date, location, isTeleconsultation } = body;

    if (!date) {
      return NextResponse.json({ error: "La date est requise." }, { status: 400 });
    }

    const newAppointment = await prisma.rendezVous.create({
      data: {
        patient: {
          connect: { id: userId },
        },
        date: new Date(date),
        location: location || null,
        status: "En attente",
        isTeleconsultation: isTeleconsultation || false,
      },
    });

    // Créer une notification pour le médecin (via l'API /api/medecin/notifications)
    const medecin = await prisma.user.findFirst({ where: { role: "Medecin" } }); // À ajuster selon votre logique
    if (medecin) {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/medecin/notifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${/* Obtenir le token du médecin ici, si nécessaire */ ""}`, // À implémenter avec un système de token
        },
        body: JSON.stringify({
          medecinId: medecin.id,
          message: `Nouveau rendez-vous demandé par ${userId} le ${new Date(date).toLocaleDateString()}`,
        }),
      });
    }

    // Créer une notification pour le patient (confirmation de soumission)
    await prisma.notification.create({
      data: {
        patientId: userId,
        medecinId: medecin?.id || null,
        message: `Demande de rendez-vous soumise pour le ${new Date(date).toLocaleDateString()}`,
        date: new Date(),
        read: false,
        type: "appointment", // Automatiquement défini
      },
    });

    return NextResponse.json(newAppointment, { status: 201 });
  } catch (error) {
    console.error("Erreur POST appointment:", error);
    
    if (error instanceof Error && error.message.includes('Invalid date')) {
      return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Erreur lors de la création du rendez-vous." }, { status: 500 });
  }
}