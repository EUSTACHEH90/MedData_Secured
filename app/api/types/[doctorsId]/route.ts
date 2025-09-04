import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest, { params }: { params: { doctorId: string } }) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { message, patientId, accessGranted } = await req.json();
  // Logique pour envoyer une notification au médecin (ex. via base de données ou WebSocket)
  if (accessGranted) {
    // Mettre à jour l'accès du médecin aux dossiers du patient
    return NextResponse.json({ success: true });
  }
  return NextResponse.json({ success: false });
}