import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    const { payload } = await jwtVerify(token!, JWT_SECRET);
    if (payload.role !== "Patient")
      return NextResponse.json({ message: "Accès interdit." }, { status: 403 });

    const { sharedWithId } = await req.json();

    // Vérifier si le médecin existe
    const doctor = await prisma.user.findUnique({
      where: { id: sharedWithId, role: "Medecin" },
    });
    if (!doctor) return NextResponse.json({ message: "Médecin non trouvé." }, { status: 404 });

    // Récupérer le patient (User)
    const patient = await prisma.user.findUnique({
      where: { id: payload.id as string },
    });
    if (!patient) return NextResponse.json({ message: "Patient non trouvé." }, { status: 404 });

    const result = await prisma.result.update({
      where: { id: params.id, patientId: payload.id as string },
      data: { isShared: true, sharedWithId },
    });

    // Créer une notification pour le médecin
    await prisma.notification.create({
      data: {
        message: `Nouveau résultat partagé par le patient ${patient.firstName} ${patient.lastName}`,
        medecinId: sharedWithId,
        patientId: result.patientId,
      },
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Erreur lors du partage du résultat :", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
