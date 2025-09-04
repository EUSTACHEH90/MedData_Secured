// app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { SignJWT } from "jose";

const ACCESS_TTL = 2 * 60 * 60;            // 2 heures
const REFRESH_TTL = 30 * 24 * 60 * 60;     // 30 jours

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(
  process.env.REFRESH_SECRET || process.env.JWT_SECRET! // fallback si pas défini
);

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json();
    console.log("Requête reçue par /api/auth/login :", { email, role });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      console.log("Utilisateur non trouvé pour l'email :", email);
      return NextResponse.json({ message: "Identifiants incorrects." }, { status: 401 });
    }

    console.log("Utilisateur trouvé :", { email: user.email, role: user.role });

    if (user.role.toLowerCase() !== role.toLowerCase()) {
      console.log("Rôle incorrect. Reçu :", role, "Attendu :", user.role);
      return NextResponse.json({ message: "Identifiants incorrects." }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log("Mot de passe incorrect pour l'email :", email);
      return NextResponse.json({ message: "Mot de passe incorrect." }, { status: 401 });
    }

    // --- Access token court (2h)
    const token = await new SignJWT({ id: user.id, role: user.role, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${ACCESS_TTL}s`)
      .sign(JWT_SECRET);

    // --- Refresh token long (30j)
    // on met "sub" = id pour la compat avec /api/auth/refresh
    const refreshToken = await new SignJWT({ sub: user.id, role: user.role, email: user.email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${REFRESH_TTL}s`)
      .sign(REFRESH_SECRET);

    console.log("Réponse envoyée :", { token, role: user.role, userId: user.id });

    const response = NextResponse.json({
      token,
      role: user.role,
      userId: user.id,
    });

    // Cookies (on garde ton token accessible côté client pour tes fetch actuels)
    const accessCookie = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: ACCESS_TTL,
      path: "/",
    };
    const refreshCookie = {
      httpOnly: true,                              // refresh = httpOnly (sécurisé)
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,                    // lax pour les navigations internes
      maxAge: REFRESH_TTL,
      path: "/",
    };

    response.cookies.set("token", token, accessCookie);
    response.cookies.set("refreshToken", refreshToken, refreshCookie);
    response.cookies.set("role", user.role, accessCookie);
    response.cookies.set("email", user.email, accessCookie);

    return response;
  } catch (error) {
    console.error("Erreur login:", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}
