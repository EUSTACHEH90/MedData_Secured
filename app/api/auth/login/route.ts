import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    console.log("Requête reçue par /api/auth/login :", { email, role });

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log("Utilisateur non trouvé pour l'email :", email);
      return NextResponse.json(
        { message: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    console.log("Utilisateur trouvé :", { email: user.email, role: user.role });

    if (user.role.toLowerCase() !== role.toLowerCase()) {
      console.log("Rôle incorrect. Reçu :", role, "Attendu :", user.role);
      return NextResponse.json(
        { message: "Identifiants incorrects." },
        { status: 401 }
      );
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Mot de passe incorrect pour l'email :", email);
      return NextResponse.json(
        { message: "Mot de passe incorrect." },
        { status: 401 }
      );
    }

    // Générer le token avec jose
    const token = await new SignJWT({ id: user.id, role: user.role, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("2h")
      .sign(JWT_SECRET);

    console.log("Réponse envoyée :", { token, role: user.role, userId: user.id });

    return NextResponse.json({
      token,
      role: user.role,
      userId: user.id,
    });
  } catch (error) {
    console.error("Erreur login:", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}