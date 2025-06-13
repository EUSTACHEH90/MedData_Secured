import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword } from "@/lib/utils/auth";

export async function POST(req: NextRequest) {
  try {
    const {
      role,
      firstName,
      lastName,
      gender,
      address,
      phoneNumber,
      socialSecurityNumber,
      email,
      password,
      dateOfBirth,
      bloodType,
      allergies,
      medicalHistory,
      numeroOrdre,
      speciality,
      hospital,
    } = await req.json();

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: "Email déjà utilisé." }, { status: 400 });
    }

    // Vérification numéro de sécurité sociale déjà utilisé
    const existingUserBySSN = await prisma.user.findUnique({ where: { socialSecurityNumber } });
    if (existingUserBySSN) {
      return NextResponse.json({ message: "Ce numéro de sécurité sociale est déjà utilisé." }, { status: 400 });
    }
    
    const hashedPassword = await hashPassword(password);

    // Validation du rôle avec des string literals typés
    let userRole: "Patient" | "Medecin";
    if (role.toLowerCase() === "patient") {
      userRole = "Patient";
    } else if (role.toLowerCase() === "medecin") {
      userRole = "Medecin";
    } else {
      return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
    }

    const newUserData: any = {
      email,
      password: hashedPassword,
      role: userRole,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName,
      lastName,
      gender,
      address,
      phoneNumber,
      socialSecurityNumber,
    };

    if (userRole === "Medecin") {
      newUserData.numeroOrdre = numeroOrdre;
      newUserData.speciality = speciality;
      newUserData.hospital = hospital;
    } else if (userRole === "Patient") {
      newUserData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
      newUserData.bloodType = bloodType || null;
      newUserData.allergies = allergies;
      newUserData.medicalHistory = medicalHistory;
    }

    const user = await prisma.user.create({
      data: newUserData,
    });

    return NextResponse.json({ message: "Inscription réussie", user });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}