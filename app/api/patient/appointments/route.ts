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
      include: { medecin: { select: { firstName: true, lastName: true } } },
    });

    const payload = appointments.map(a => ({
    ...a,
    doctorName: [a.medecin?.firstName, a.medecin?.lastName].filter(Boolean).join(" ") || "Médecin",
  }));

  return NextResponse.json(payload);

    return NextResponse.json(appointments);
  } catch (error) {
    console.error("Erreur GET appointments:", error);
    return NextResponse.json({ error: "Erreur lors de la récupération des rendez-vous." }, { status: 500 });
  }
}

// export async function POST(req: Request) {
//   try {
//     const authResult = await verifyToken(req);
//     if ("error" in authResult) {
//       return NextResponse.json({ error: authResult.error }, { status: authResult.status });
//     }

//     const { userId } = authResult;
//     const body = await req.json();
//     const { date, location, isTeleconsultation, doctorId } = body;

//     if (!date) {
//       return NextResponse.json({ error: "La date est requise." }, { status: 400 });
//     }
//     if (!doctorId) {
//       return NextResponse.json({ error: "Veuillez sélectionner un médecin." }, { status: 400 });
//     }

//     const medecin = await prisma.user.findUnique({ where: { id: doctorId, role: "Medecin" } });
//     if (!medecin) {
//       return NextResponse.json({ error: "Médecin introuvable." }, { status: 404 });
//     }

//     const newAppointment = await prisma.rendezVous.create({
//       data: {
//         patient: { connect: { id: userId } },
//         medecin: { connect: { id: doctorId } },
//         date: new Date(date),
//         location: location || null,
//         isTeleconsultation: !!isTeleconsultation,
//         // 👉 le patient demande, donc on attend la réponse du médecin :
//         status: "En attente médecin",
//       },
//     });

//     // Notif côté médecin (il doit répondre)
//     await prisma.notification.create({
//       data: {
//         medecinId: doctorId,
//         patientId: userId,
//         message: `Nouveau rendez-vous demandé le ${new Date(date).toLocaleString("fr-FR")}`,
//         date: new Date(),
//         read: false,
//         type: "appointmentRequest",
//         target: "Medecin",
//         relatedId: newAppointment.id,
//       },
//     });

//     // Notif côté patient (accusé réception)
//     await prisma.notification.create({
//       data: {
//         patientId: userId,
//         medecinId: doctorId,
//         message: `Votre demande de rendez-vous a été envoyée pour le ${new Date(date).toLocaleString("fr-FR")}`,
//         date: new Date(),
//         read: false,
//         type: "appointment",
//         target: "Patient",
//         relatedId: newAppointment.id,
//       },
//     });

//     return NextResponse.json(newAppointment, { status: 201 });
//   } catch (error) {
//     console.error("Erreur POST appointment:", error);
//     if (error instanceof Error && error.message.includes("Invalid date")) {
//       return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
//     }
//     return NextResponse.json({ error: "Erreur lors de la création du rendez-vous." }, { status: 500 });
//   }
// }

// export async function POST(req: Request) {
//   try {
//     const authResult = await verifyToken(req);
//     if ("error" in authResult) {
//       return NextResponse.json({ error: authResult.error }, { status: authResult.status });
//     }

//     const { userId } = authResult;
//     const body = await req.json();
    
//     const { date, location, isTeleconsultation, doctorId } = body;

// if (!date || !doctorId) {
//   return NextResponse.json({ error: "La date et le médecin sont requis." }, { status: 400 });
// }

// // vérif médecin cible
// const medecin = await prisma.user.findUnique({ where: { id: doctorId, role: "Medecin" } });
// if (!medecin) {
//   return NextResponse.json({ error: "Médecin cible introuvable." }, { status: 404 });
// }

// // crée le RDV en "En attente"
// const newAppointment = await prisma.rendezVous.create({
//   data: {
//     patientId: userId,
//     medecinId: doctorId,
//     date: new Date(date),
//     location: location || null,
//     isTeleconsultation: !!isTeleconsultation,
//     status: "En attente",
//   },
// });

// // notif médecin (demande entrante)
// await prisma.notification.create({
//   data: {
//     medecinId: doctorId,
//     patientId: userId,
//     message: `Nouveau rendez-vous demandé le ${new Date(date).toLocaleString("fr-FR")}`,
//     date: new Date(),
//     read: false,
//     type: "appointmentRequest",
//     target: "Medecin",
//     // relatedId: null  // (laisse vide)
//   },
// });

// // accusé pour le patient
// await prisma.notification.create({
//   data: {
//     patientId: userId,
//     medecinId: doctorId,
//     message: `Votre demande de rendez-vous a été envoyée.`,
//     date: new Date(),
//     read: false,
//     type: "appointment",
//     target: "Patient",
//   },
// });

// return NextResponse.json(newAppointment, { status: 201 });

//   } catch (error) {
//     console.error("Erreur POST appointment:", error);
//     if (error instanceof Error && error.message.includes("Invalid date")) {
//       return NextResponse.json({ error: "Format de date invalide." }, { status: 400 });
//     }
//     return NextResponse.json({ error: "Erreur lors de la création du rendez-vous." }, { status: 500 });
//   }
// }

export async function POST(req: Request) {
  try {
    const authResult = await verifyToken(req);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const body = await req.json();
    const { date, location, isTeleconsultation, medecinId } = body;

    if (!date || !medecinId) {
      return NextResponse.json({ error: "La date et le medecinId sont requis." }, { status: 400 });
    }

    // Vérifie que le médecin existe
    const med = await prisma.user.findUnique({ where: { id: medecinId, role: "Medecin" } });
    if (!med) return NextResponse.json({ error: "Médecin introuvable." }, { status: 404 });

    const pat = await prisma.user.findUnique({
  where: { id: userId, role: "Patient" },
  select: { id: true, firstName: true, lastName: true },
});

    const newAppointment = await prisma.rendezVous.create({
      data: {
        patientId: userId,
        medecinId,
        date: new Date(date),
        location: location || null,
        status: "En attente médecin",
        isTeleconsultation: !!isTeleconsultation,
      },
    });

    // 1) Notif au médecin (demande entrante)
    await prisma.notification.create({
      data: {
        medecinId,
        patientId: userId,
        message: `Nouveau rendez-vous demandé par le patient ${[pat?.firstName, pat?.lastName].filter(Boolean).join(" ")} pour le ${new Date(date).toLocaleString("fr-FR")}.`,
        date: new Date(),
        read: false,
        type: "appointmentRequest",
        target: "Medecin",
        // ❌ PAS de relatedId ici (FK vers AccessRequest)
      },
    });

    // 2) Notif au patient (accusé de demande)
    await prisma.notification.create({
      data: {
        patientId: userId,
        medecinId,
        message: `Votre demande de rendez-vous auprès du Dr. ${[med.firstName, med.lastName].filter(Boolean).join(" ")} a été envoyée pour le ${new Date(date).toLocaleDateString("fr-FR")}.`,
        date: new Date(),
        read: false,
        type: "appointment",
        target: "Patient",
        // ❌ PAS de relatedId ici non plus
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


