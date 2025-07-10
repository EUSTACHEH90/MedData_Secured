import { NextResponse } from "next/server";
import { jwtVerify, SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    // Vérifier le token existant en ignorant l'expiration pour extraire le payload
    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, {
        algorithms: ["HS256"],
        ignoreExpiration: true, // Permet de lire le payload même si expiré
      });
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ error: "Token invalide." }, { status: 401 });
    }

    if (!payload.id || !payload.role) {
      return NextResponse.json({ error: "Payload invalide." }, { status: 400 });
    }

    // Générer un nouveau token avec les mêmes id et role
    const newToken = await new SignJWT({ id: payload.id, role: payload.role })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("24h") // Ajustez la durée selon vos besoins
      .sign(JWT_SECRET);

    return NextResponse.json({ token: newToken }, { status: 200 });
  } catch (err) {
    console.error("Erreur lors du rafraîchissement du token à 07:44 PM GMT, 08/07/2025 :", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}