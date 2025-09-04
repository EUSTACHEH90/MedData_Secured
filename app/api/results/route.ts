// app/api/results/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

// Simule la Blockchain (à remplacer par SDK Fabric)
async function recordAccessList(patientId: string) {
  console.log("➡️ Audit Fabric : patient a consulté la liste de ses résultats", { patientId });
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Token manquant" }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const role = String(payload.role).toLowerCase();
    const userId = String(payload.id);

    if (role !== "patient") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    // Récupérer les résultats du patient
    const results = await prisma.result.findMany({
      where: { patientId: userId },
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        fileUrl: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { date: "desc" },
    });

    // Audit Fabric (trace)
    await recordAccessList(userId);

    return NextResponse.json(results);
  } catch (err: any) {
    console.error("Erreur /api/results :", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
