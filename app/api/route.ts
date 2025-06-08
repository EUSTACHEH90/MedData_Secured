import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json();

    console.log('Patient reçu :', patientData);

    // TODO: validation / stockage dans base de données

    return NextResponse.json({ message: 'Patient enregistré avec succès' }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Erreur serveur' }, { status: 500 });
  }
}
