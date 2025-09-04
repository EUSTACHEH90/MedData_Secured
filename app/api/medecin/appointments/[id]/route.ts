

// app/api/medecin/appointments/[id]/route.ts
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
    if (!id || role !== "Medecin") return { error: "Accès réservé au médecin.", status: 403 as const };
    return { userId: id };
  } catch {
    return { error: "Token invalide ou expiré.", status: 401 as const };
  }
}

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const a = await auth(req);
    if ("error" in a) return NextResponse.json({ error: a.error }, { status: a.status });
    const medecinId = a.userId;

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
    if (!appt || appt.medecinId !== medecinId) {
      return NextResponse.json({ error: "Rendez-vous introuvable pour ce médecin." }, { status: 404 });
    }

    const needsPatientConfirm = !!date && !status;

    const updated = await prisma.rendezVous.update({
      where: { id },
        data: {
          ...(status ? { status } : needsPatientConfirm ? { status: "En attente patient" } : {}),
          ...(date ? { date: new Date(date) } : {}),
          ...(location !== undefined ? { location } : {}),
          ...(typeof isTeleconsultation === "boolean" ? { isTeleconsultation } : {}),
        },
    });


    // Notification au patient
    if (appt.patientId) {
      let msg = "Mise à jour du rendez-vous par le médecin.";
      if (status === "Confirmé") msg = "Votre rendez-vous a été confirmé par le médecin.";
      if (status === "Refusé") msg = "Votre demande de rendez-vous a été refusée par le médecin.";
      if (date) msg = `Le médecin propose une nouvelle date : ${new Date(date).toLocaleString("fr-FR")}.`;

      await prisma.notification.create({
        data: {
          patientId: appt.patientId,
          medecinId,
          message: msg,
          date: new Date(),
          read: false,
          type: "appointmentResponse",
          target: "Patient",
          
        },
      });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (e) {
    console.error("PUT /api/medecin/appointments/[id] :", e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
