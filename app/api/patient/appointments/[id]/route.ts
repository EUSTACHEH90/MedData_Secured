import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { status } = await req.json();
  const appointmentId = params.id;

  try {
    const updatedAppointment = await prisma.rendezVous.update({
      where: { id: appointmentId },
      data: { status },
    });

    return NextResponse.json(updatedAppointment, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/patient/appointments PUT:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du rendez-vous", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}