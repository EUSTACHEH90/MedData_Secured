// // /api/patient/notification/[id]/read/route.ts
// import prisma from "@/lib/prisma";
// import { NextRequest } from "next/server";

// export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
//   const { id } = params;

//   try {
//     const notif = await prisma.notification.update({
//       where: { id },
//       data: { read: true },
//     });

//     return new Response(JSON.stringify(notif), { status: 200 });
//   } catch (error) {
//     console.error("Erreur notification:", error);
//     return new Response("Erreur serveur", { status: 500 });
//   }
// }


// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import prisma from "@/lib/prisma";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// export async function PUT(req: Request, { params }: { params: { id: string } }) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/patient/notification/[id]/read PUT.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Patient") {
//       console.log("Rôle non autorisé pour /api/patient/notification/[id]/read PUT :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent marquer leurs notifications comme lues." }, { status: 403 });
//     }

//     const { id } = params;

//     const notification = await prisma.notification.findUnique({
//       where: { id, patientId: userId, target: "Patient" },
//     });
//     if (!notification) {
//       console.log("Notification non trouvée pour id :", id, "et patientId :", userId);
//       return NextResponse.json({ error: "Notification non trouvée ou non autorisée." }, { status: 404 });
//     }

//     const updatedNotification = await prisma.notification.update({
//       where: { id },
//       data: { read: true },
//     });

//     console.log("Notification marquée comme lue :", { id, patientId: userId });

//     return NextResponse.json(updatedNotification, { status: 200 });
//   } catch (error) {
//     console.error("Erreur dans /api/patient/notifications/[id]/read PUT :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// export async function PATCH(req: Request, context: { params: { id: string } }) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Patient") {
//       return NextResponse.json(
//         { error: "Accès non autorisé. Seuls les patients peuvent modifier leurs notifications." },
//         { status: 403 }
//       );
//     }

//     const id = context.params.id;
//     const { action, read } = await req.json();

//     const notification = await prisma.notification.findUnique({
//       where: { id, patientId: userId, target: "Patient" },
//     });
//     if (!notification) {
//       return NextResponse.json({ error: "Notification non trouvée ou non autorisée." }, { status: 404 });
//     }

//     const updateData: { read?: boolean; message?: string } = {};
//     if (read !== undefined) {
//       updateData.read = read;
//     }
//     if (action) {
//       updateData.message = `${notification.message} (${action === "accept" ? "Accepté" : "Refusé"})`;
//     }

//     const updatedNotification = await prisma.notification.update({
//       where: { id },
//       data: updateData,
//     });

//     console.log("Notification mise à jour :", { id, patientId: userId, action, read });

//     return NextResponse.json(updatedNotification, { status: 200 });
//   } catch (error) {
//     console.error("Erreur dans /api/patient/notifications/[id] PATCH :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

// NEW FILE: app/api/patient/notifications/[notificationId]/route.ts
// This handles PATCH for specific notification (accept/decline accessRequest).
// Moved from static PATCH to dynamic route to match frontend calls like PATCH /api/patient/notifications/${id}.
// Fixed: Use findFirst instead of findUnique (since target/patientId not unique).
// Added transaction for atomicity.
// Used upsert for doctor's notification to avoid duplicates.

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export async function PATCH(req: Request, { params }: { params: { notificationId: string } }) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload: any;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Patient") {
      return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
    }

    const { action } = (await req.json()) as { action: "accept" | "decline" };
    if (!action) {
      return NextResponse.json({ error: "action est requis." }, { status: 400 });
    }

    // Find the notification with flexible where (findFirst)
    const notif = await prisma.notification.findFirst({
      where: { id: params.notificationId, patientId: userId, target: "Patient" },
      include: { accessRequest: true },
    });
    if (!notif) {
      return NextResponse.json({ error: "Notification non trouvée ou non autorisée." }, { status: 404 });
    }
    if (notif.type !== "accessRequest") {
      return NextResponse.json({ error: "Cette notification n'est pas une demande d'accès." }, { status: 422 });
    }
    if (!notif.relatedId || !notif.accessRequest) {
      return NextResponse.json({ error: "La notification n'est pas liée à une AccessRequest valide." }, { status: 422 });
    }

    // Determine status & message
    const responseLabel = action === "accept" ? "Accepté" : "Refusé";

    // Get medecinId: priority to notif, fallback to accessRequest
    const medecinId = notif.medecinId ?? notif.accessRequest.medecinId;
    if (!medecinId) {
      return NextResponse.json({ error: "Médecin introuvable pour cette demande d'accès." }, { status: 422 });
    }

    // Optional: Patient name for message
    const p = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });

    // Dans PATCH /api/patient/notifications/[notificationId]
const body = await req.json().catch(() => ({} as any));
const rawAction = body?.action as "accept"|"decline"|undefined;
const markReadOnly = body?.read === true && !rawAction;

// 0) Juste marquer comme lu
if (markReadOnly) {
  await prisma.notification.update({
    where: { id: params.notificationId },
    data: { read: true }
  });
  return NextResponse.json({ message: "Notification marquée comme lue." }, { status: 200 });
}

// 1) Sinon, exiger action
if (!rawAction) {
  return NextResponse.json({ error: "action est requis." }, { status: 400 });
}


    // Transaction for atomicity
    await prisma.$transaction([
      // 1) Update access request status
      // prisma.accessRequest.update({
      //   where: { id: notif.relatedId },
      //   data: { status: responseLabel, updatedAt: new Date() },
      // }),

      // 2) Notify doctor - Use upsert to avoid duplicates (requires @@unique([relatedId, type, target]) in schema)
      prisma.notification.upsert({
        where: {
          relatedId_type_target: {
            relatedId: notif.relatedId,
            type: "accessResponse",
            target: "Medecin",
          },
        },
        create: {
          medecinId,
          patientId: userId,
          message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a ${responseLabel.toLowerCase()} votre demande d'accès.`,
          date: new Date(),
          read: false,
          type: "accessResponse",
          target: "Medecin",
          relatedId: notif.relatedId,
        },
        update: {
          message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a ${responseLabel.toLowerCase()} votre demande d'accès.`,
          read: false,
          date: new Date(),
          medecinId,
        },
      }),

      // 3) Mark patient's notification as read and annotated
      prisma.notification.update({
        where: { id: notif.id },
        data: {
          read: true,
          message: `${notif.message || `Notification ${notif.type}`} (${responseLabel})`,
        },
      }),
    ]);

    console.log("PATCH /api/patient/notifications/[id] OK", { notificationId: params.notificationId, userId, action, relatedId: notif.relatedId });

    return NextResponse.json({ message: `Demande ${responseLabel}.` }, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/patient/notifications/[id] PATCH :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}