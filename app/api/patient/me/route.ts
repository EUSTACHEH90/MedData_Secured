import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "fallback-secret");

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const payload = result.payload;
    
    const userId = payload.id as string;
    const role = payload.role as string;

    if (role !== "Patient") {
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!patient) {
      return NextResponse.json({ message: "Utilisateur non trouvé." }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error) {
    console.error("Erreur GET /api/patient/me :", error);
    return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const payload = result.payload;
    
    const userId = payload.id as string;
    const role = payload.role as string;

    if (role !== "Patient") {
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const body = await req.json();
    const { firstName, lastName, email, dateOfBirth, address, phoneNumber } = body;
    
    const updatedPatient = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        address,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      },
    });

    return NextResponse.json(updatedPatient);
  } catch (error) {
    console.error("Erreur PUT /api/patient/me :", error);
    return NextResponse.json({ message: "Erreur lors de la mise à jour." }, { status: 500 });
  }
}