import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "");

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const patientId = typeof payload.id === "string" ? payload.id : null;
    const role = typeof payload.role === "string" ? payload.role : null;
    if (!patientId || role !== "Patient") {
      return NextResponse.json({ error: "Accès interdit" }, { status: 403 });
    }

    const now = new Date();
    const grants = await prisma.accessGrant.findMany({
      where: { patientId, revoked: false, expiresAt: { gt: now } },
      select: {
        id: true,
        medecinId: true,
        scope: true,
        expiresAt: true,
        revoked: true,
        accessRequestId: true,
      },
      orderBy: { expiresAt: "desc" },
    });
    const doctorIds = grants.map(g => g.medecinId);
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });
    const byId = Object.fromEntries(
      doctors.map(d => [d.id, { firstName: d.firstName, lastName: d.lastName, email: d.email }])
    );
    return NextResponse.json({ grants: grants.map(g => ({ ...g, medecin: byId[g.medecinId] || null })) }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ error: "Erreur", details: e?.message }, { status: 500 });
  }
}
