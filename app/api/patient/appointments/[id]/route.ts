// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import prisma from "@/lib/prisma";

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const session = await getServerSession();
//   if (!session || !session.user?.id) {
//     return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
//   }

//   const { status } = await req.json();
//   const appointmentId = params.id;

//   try {
//     const updatedAppointment = await prisma.rendezVous.update({
//       where: { id: appointmentId },
//       data: { status },
//     });

//     return NextResponse.json(updatedAppointment, { status: 200 });
//   } catch (error) {
//     console.error("Erreur dans /api/patient/appointments PUT:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour du rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

// app/api/patient/appointments/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

async function auth(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return { error: "Token manquant.", status: 401 as const };

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const id = String(payload.id || "");
    const role = String(payload.role || "");
    if (!id || role !== "Patient") return { error: "Accès réservé au patient.", status: 403 as const };
    return { userId: id };
  } catch {
    return { error: "Token invalide ou expiré.", status: 401 as const };
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await auth(req);
    if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });
    const patientId = a.userId;
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: "Identifiant du rendez-vous manquant." }, { status: 400 });

    const payload = await req.json().catch(() => ({}));
    const { status, date, location, isTeleconsultation } = payload as {
      status?: "Confirmé" | "Refusé" | "En attente";
      date?: string;
      location?: string | null;
      isTeleconsultation?: boolean;
    };

    const appt = await prisma.rendezVous.findUnique({ where: { id } });
    if (!appt || appt.patientId !== patientId) {
      return NextResponse.json({ error: "Rendez-vous introuvable pour ce patient." }, { status: 404 });
    }

    const needsDoctorConfirm = !!date && !status;

    const updated = await prisma.rendezVous.update({
      where: { id },
        data: {
          ...(status ? { status } : needsDoctorConfirm ? { status: "En attente médecin" } : {}),
          ...(date ? { date: new Date(date) } : {}),
          ...(location !== undefined ? { location } : {}),
          ...(typeof isTeleconsultation === "boolean" ? { isTeleconsultation } : {}),
        },
    });
    


    // Notification au médecin
    if (appt.medecinId) {
      let msg = "Mise à jour du rendez-vous par le patient.";
      if (status === "Confirmé") msg = "Le patient a confirmé votre rendez-vous.";
      if (status === "Refusé") msg = "Le patient a refusé votre rendez-vous.";
      if (date) msg = `Le patient propose une nouvelle date : ${new Date(date).toLocaleString("fr-FR")}.`;

      await prisma.notification.create({
        data: {
          medecinId: appt.medecinId,
          patientId,
          message: msg,
          date: new Date(),
          read: false,
          type: "appointmentResponse",
          target: "Medecin",
          
        },
      });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error("PUT /api/patient/appointments/[id] :", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
