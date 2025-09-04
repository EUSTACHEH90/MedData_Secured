
// app/api/medecin/access-requests/[id]/grant/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ⬅️ params est un Promise
) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    // Auth médecin
    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Authentification requise." }, { status: 401 });
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const role = String(payload.role || "").toLowerCase();
    const doctorId = String(payload.id || "");
    if (role !== "medecin" || !doctorId) {
      return NextResponse.json({ error: "Accès réservé au médecin." }, { status: 403 });
    }

    const { id } = await params;
    const relatedId = id; 
    if (!relatedId) {
      return NextResponse.json(
        {
          error: "Impossible d’ouvrir cette demande.",
          code: "MISSING_RELATED_ID",
          hint: "Rouvrez la notification puis cliquez à nouveau sur « Voir les documents »."
        },
        { status: 400 }
      );
    }

    // Demande d’accès
    const ar = await prisma.accessRequest.findUnique({
      where: { id: relatedId },
      select: { id: true, patientId: true, medecinId: true, createdAt: true, status: true },
    });

    if (!ar || ar.medecinId !== doctorId) {
      return NextResponse.json(
        {
          error: "Cette demande ne correspond pas à votre compte médecin.",
          code: "NOT_FOUND_OR_NOT_OWNED",
          hint: "Actualisez votre page de notifications.",
          patientId: ar?.patientId ?? null
        },
        { status: 404 }
      );
    }

    if (ar.status !== "Accepté") {
      return NextResponse.json(
        {
          error: "Le patient n’a pas encore accepté votre demande.",
          code: "NOT_ACCEPTED",
          status: ar.status,
          patientId: ar.patientId
        },
        { status: 409 }
      );
    }

    const now = new Date();

    // Grant le plus récent, non révoqué, postérieur à la demande
    let grant = await prisma.accessGrant.findFirst({
      where: {
        patientId: ar.patientId,
        medecinId: ar.medecinId,
        createdAt: { gte: ar.createdAt },
        revoked: false,
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, scope: true, expiresAt: true, revoked: true, resourceIds: true, updatedAt: true },
    });

    if (!grant) {
      // Essayer d’expliquer : expiré ou révoqué ?
      const lastGrant = await prisma.accessGrant.findFirst({
        where: { patientId: ar.patientId, medecinId: ar.medecinId },
        orderBy: { createdAt: "desc" },
        select: { id: true, expiresAt: true, revoked: true, updatedAt: true },
      });

      if (lastGrant?.revoked) {
        return NextResponse.json(
          {
            error: "Le patient a révoqué votre accès.",
            code: "REVOKED",
            revokedAt: lastGrant.updatedAt?.toISOString?.(),
            patientId: ar.patientId,
            hint: "Vous pouvez envoyer une nouvelle demande d’accès."
          },
          { status: 403 }
        );
      }

      if (lastGrant?.expiresAt && lastGrant.expiresAt <= now) {
        return NextResponse.json(
          {
            error: "Votre autorisation a expiré.",
            code: "EXPIRED",
            expiredAt: lastGrant.expiresAt.toISOString(),
            patientId: ar.patientId,
            hint: "Envoyez une nouvelle demande pour poursuivre la consultation."
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Aucune autorisation active n’a été trouvée pour cette demande.",
          code: "NO_GRANT",
          patientId: ar.patientId,
          hint: "Envoyez une nouvelle demande d’accès."
        },
        { status: 404 }
      );
    }

    

    // Résultats autorisés
    const whereResults =
      grant.resourceIds && grant.resourceIds.length > 0
        ? { id: { in: grant.resourceIds }, patientId: ar.patientId }
        : { patientId: ar.patientId };

    const results = await prisma.result.findMany({
      where: whereResults,
      select: { id: true, type: true, date: true, description: true, fileUrl: true },
      orderBy: { date: "desc" },
    });
    const patient = await prisma.user.findUnique({
      where: { id: ar.patientId },           // <- utilise l'id du patient lié à la request/grant
      select: { medicalHistory: true, allergies: true }
    });

    const canSeeAntecedents = grant.scope === "ALL";
// ...
    


    return NextResponse.json(
      {
        grant: {
          id: grant.id,
          scope: grant.scope,
          expiresAt: grant.expiresAt,
          resourceIds: grant.resourceIds,
        },
        results,
        patientId: ar.patientId,
        
        antecedents: canSeeAntecedents ? {
          medicalHistory: patient?.medicalHistory ?? null,
          allergies: patient?.allergies ?? null,
        } : null,
      },
      
      { status: 200 }
    );

    
  } catch (e: any) {
    console.error("GET /api/medecin/access-requests/[id]/grant :", e?.message || e);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

