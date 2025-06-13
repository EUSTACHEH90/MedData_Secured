import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      console.log("Aucun token fourni dans Authorization pour /results.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = result.payload;
    } catch (err) {
      console.log("Token invalide ou expiré pour /results :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = payload.id as string;
    const role = payload.role as string;

    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé ou payload invalide pour /results :", role);
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const results = await prisma.medicalRecord.findMany({
      where: { patientId: userId, type: { in: ["ANALYSE", "ORDONNANCE"] } },
      select: {
        id: true,
        createdAt: true,
        type: true,
        content: true,
        doctor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Formater les données pour correspondre à l'interface Result
    const formattedResults = results.map((r) => ({
      id: r.id,
      type: r.type,
      date: r.createdAt.toISOString().split("T")[0],
      documentHash: null, // À implémenter si hachage Blockchain est ajouté
    }));

    console.log("Résultats renvoyés pour userId :", userId, formattedResults);
    return NextResponse.json(formattedResults);
  } catch (error) {
    console.error("Erreur /api/patient/results :", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}