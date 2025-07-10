
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

interface Notification {
  id: string;
  message: string;
  date: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  type?: string; // facultatif si tu veux l'utiliser
}


interface NotificationFromPrisma {
  id: string;
  message: string;
  date: Date;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  medecinId: string | null; 
  type: string;
  patient: {
    firstName: string | null;
    lastName: string | null;
  } | null; 
}



interface NotificationListResponse {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface PatchRequestBody {
  notificationId: string;
}

interface BulkUpdateResponse {
  message: string;
  count: number;
}

interface PostRequestBody {
  medecinId: string;
  message: string;
}

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/medecin/notifications.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/medecin/notifications :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      console.log("Rôle non autorisé pour /api/medecin/notifications :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Medecin" },
    });
    if (!user) {
      console.log("Médecin non trouvé pour userId :", userId);
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * limit;
    const allowedTypes = ["appointment", "consultation", "result", "accessRequest", "accessResponse", "appointmentRequest", "appointmentResponse"];
    const where = { 
        medecinId: userId,
      type: {
              in: allowedTypes,
    },
      ...(unreadOnly && { read: false }),
    };

    const notifications = await prisma.notification.findMany({
  where,
  orderBy: { date: "desc" },
  skip,
  take: limit,
  include: {
    patient: {
      select: { firstName: true, lastName: true },
    },
  },
});


    const [totalNotifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { medecinId: userId, read: false } }),
    ]);

    const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => {
  let customMessage = n.message;

  if (n.type === "accessResponse") {
    customMessage = n.message.toLowerCase().includes("accepté")
      ? "Votre demande d'accès a été approuvée."
      : "Votre demande d'accès a été refusée.";
  }

  if (n.type === "appointmentResponse") {
    customMessage = n.message.toLowerCase().includes("accepté")
      ? "Votre demande de rendez-vous a été confirmée."
      : "Votre demande de rendez-vous a été refusée.";
  }

  return {
    id: n.id,
    message: customMessage,
    date: n.date.toISOString(),
    read: n.read,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
});


    console.log("Notifications renvoyées pour medecinId :", userId, {
      count: formattedNotifications.length,
      unreadCount,
      page,
    });

    return NextResponse.json(
      {
        notifications: formattedNotifications,
        unreadCount,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalNotifications / limit),
          totalItems: totalNotifications,
          hasNext: skip + notifications.length < totalNotifications,
          hasPrev: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans /api/medecin/notifications GET :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// export async function PATCH(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/medecin/notifications PATCH.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/medecin/notifications PATCH :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Medecin") {
//       console.log("Rôle non autorisé pour /api/medecin/notifications PATCH :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId, role: "Medecin" },
//     });
//     if (!user) {
//       console.log("Médecin non trouvé pour userId :", userId);
//       return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
//     }

//     const { notificationId }: PatchRequestBody = await req.json();
//     if (!notificationId) {
//       return NextResponse.json({ error: "notificationId manquant." }, { status: 400 });
//     }

//     const updatedNotification = await prisma.notification.update({
//       where: {
//         id: notificationId,
//         medecinId: userId,
//       },
//       data: { read: true },
//     });

//     console.log("Notification marquée comme lue pour medecinId :", userId, { notificationId });

//     return NextResponse.json(updatedNotification, { status: 200 });
//   } catch (error) {
//     console.error("Erreur dans /api/medecin/notifications PATCH :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }
export async function PATCH(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/medecin/notifications PATCH.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token:", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      console.log("Rôle non autorisé:", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Medecin" },
    });
    if (!user) {
      console.log("Médecin non trouvé pour userId:", userId);
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
    console.log("Requête reçue:", { notificationId, action });

    if (!notificationId || !action) {
      console.log("Paramètres manquants:", { notificationId, action });
      return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notificationId,
        medecinId: userId,
      },
      data: { read: true },
      include: { patient: { select: { firstName: true, lastName: true } } },
    });

    console.log("Notification avant mise à jour:", updatedNotification);

    let customMessage = updatedNotification.message;
    if (updatedNotification.type === "accessResponse" || updatedNotification.type === "accessRequest") {
      customMessage = action === "accept"
        ? `Le patient ${updatedNotification.patient?.firstName || "Inconnu"} ${updatedNotification.patient?.lastName || ""} a accepté votre demande d'accès.`
        : `Le patient ${updatedNotification.patient?.firstName || "Inconnu"} ${updatedNotification.patient?.lastName || ""} a refusé votre demande d'accès.`;
    } else if (updatedNotification.type === "appointmentResponse" || updatedNotification.type === "appointmentRequest") {
      customMessage = action === "accept"
        ? `Le patient ${updatedNotification.patient?.firstName || "Inconnu"} ${updatedNotification.patient?.lastName || ""} a confirmé votre demande de rendez-vous.`
        : `Le patient ${updatedNotification.patient?.firstName || "Inconnu"} ${updatedNotification.patient?.lastName || ""} a refusé le rendez-vous programmé le ${new Date(updatedNotification.date).toLocaleDateString("fr-FR")}.`;
    }

    const finalNotification = {
      ...updatedNotification,
      message: customMessage,
    };

    console.log("Notification après mise à jour:", finalNotification);

    return NextResponse.json(finalNotification, { status: 200 });
  } catch (error) {
    console.error("Erreur dans PATCH:", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/medecin/notifications PUT.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/medecin/notifications PUT :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      console.log("Rôle non autorisé pour /api/medecin/notifications PUT :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Medecin" },
    });
    if (!user) {
      console.log("Médecin non trouvé pour userId :", userId);
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const updatedNotifications = await prisma.notification.updateMany({
      where: {
        medecinId: userId,
        read: false,
      },
      data: { read: true },
    });

    console.log("Notifications marquées comme lues pour medecinId :", userId, { count: updatedNotifications.count });

    return NextResponse.json(
      {
        message: "Toutes les notifications ont été marquées comme lues.",
        count: updatedNotifications.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans /api/medecin/notifications PUT :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { medecinId, message, type } = await req.json();
    if (!medecinId || !message) {
      return NextResponse.json({ error: "medecinId et message sont requis." }, { status: 400 });
    }

    const medecin = await prisma.user.findUnique({
      where: { id: medecinId, role: "Medecin" },
    });
    if (!medecin) {
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const notification = await prisma.notification.create({
      data: {
        medecinId,
        message,
        date: new Date(),
        read: false,
       type: type || "appointment", // Automatiquement défini pour une demande de rendez-vous
      },
    });

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("Erreur dans /api/medecin/notifications POST :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}