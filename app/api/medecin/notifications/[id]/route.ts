
// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// export async function PATCH(req: Request, { params }: { params: { id: string } }) {
//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const token = req.headers.get("authorization")?.split(" ")[1];
//     if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 401 });

//     const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || role !== "Medecin") {
//       return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
//     }

//     const id = params.id; // Correction : utiliser params.id au lieu de context.params.id
//     const body = await req.json().catch(() => ({}));
//     const read = typeof body.read === "boolean" ? body.read : true; // Par défaut, marque comme lu

//     // Vérifie que la notification appartient bien à ce médecin
//     const notif = await prisma.notification.findFirst({
//       where: { id, medecinId: userId, target: "Medecin" },
//     });
//     if (!notif) {
//       return NextResponse.json({ error: "Notification non trouvée ou non autorisée." }, { status: 404 });
//     }

//     const updated = await prisma.notification.update({
//       where: { id }, // id est unique
//       data: { read },
//     });

//     return NextResponse.json(updated, { status: 200 });
//   } catch (err) {
//     console.error("Erreur /api/medecin/notifications/[id] PATCH :", err);
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de la notification." },
//       { status: 500 }
//     );
//   }
// }


// app/api/medecin/notifications/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RAW_SECRET = process.env.JWT_SECRET || "";
const JWT_SECRET = RAW_SECRET ? new TextEncoder().encode(RAW_SECRET) : null;

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ⬅️ params est un Promise
) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "Configuration serveur incorrecte." },
        { status: 500 }
      );
    }

    const token = req.headers.get("authorization")?.split(" ")[1];
    if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 401 });

    let payload: any;
    try {
      const { payload: p } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = p;
    } catch {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    // ⬇️ ATTENDRE params avant d'utiliser id
    const { id } = await params;

    const body = await req.json().catch(() => ({}));
    const read = typeof body.read === "boolean" ? body.read : true; // par défaut: lu

    // Vérifie l'appartenance
    const notif = await prisma.notification.findFirst({
      where: { id, medecinId: userId, target: "Medecin" },
    });
    if (!notif) {
      return NextResponse.json(
        { error: "Notification non trouvée ou non autorisée." },
        { status: 404 }
      );
    }

    const updated = await prisma.notification.update({
      where: { id }, // id est unique
      data: { read },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (err) {
    console.error("Erreur /api/medecin/notifications/[id] PATCH :", err);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification." },
      { status: 500 }
    );
  }
}

