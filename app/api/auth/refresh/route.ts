// app/api/auth/refresh/route.ts
import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const ACCESS_TTL = 2 * 60 * 60; // 2 heures
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const REFRESH_SECRET = new TextEncoder().encode(process.env.REFRESH_SECRET || process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const refreshToken = cookieHeader.match(/(?:^|;\s*)refreshToken=([^;]+)/)?.[1];

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token manquant" }, { status: 401 });
    }

    let payload: any;
    try {
      const { payload: p } = await jwtVerify(refreshToken, REFRESH_SECRET, { algorithms: ["HS256"] });
      payload = p;
    } catch {
      return NextResponse.json({ error: "Refresh token invalide ou expiré" }, { status: 401 });
    }

    const id = payload.sub || payload.id;
    const { role, email } = payload;

    const fresh = await new SignJWT({ id, role, email })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(`${ACCESS_TTL}s`)
      .sign(JWT_SECRET);

    const res = NextResponse.json({ token: fresh }, { status: 200 });

    // Met à jour le cookie d'access token
    const accessCookie = {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict" as const,
      maxAge: ACCESS_TTL,
      path: "/",
    };
    res.cookies.set("token", fresh, accessCookie);

    return res;
  } catch (e) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
