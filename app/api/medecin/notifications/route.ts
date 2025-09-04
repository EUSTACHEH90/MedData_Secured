
// app/api/medecin/notifications/route.ts
import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

type AllowedType =
  | "appointment"
  | "consultation"
  | "result"
  | "accessRequest"
  | "accessResponse"
  | "appointmentRequest"
  | "appointmentResponse"
  | "alert";

interface NotificationDTO {
  id: string;
  message: string;
  date: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  type?: AllowedType;
  relatedId?: string | null;
}

interface NotificationFromPrisma {
  id: string;
  message: string;
  date: Date;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
  type: string;
  relatedId: string | null;  
  patient: { firstName: string | null; lastName: string | null } | null;
}

export async function GET(req: Request) {
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
    } catch {
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * limit;

    const allowedTypes: AllowedType[] = [
      "result",
      "accessRequest",
      "accessResponse",
      "appointmentRequest",
      "appointmentResponse",
      "alert",
    ];

    const where = {
      medecinId: userId,
      target: "Medecin",
      type: { in: allowedTypes as string[] },
      ...(unreadOnly && { read: false }),
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: {
        patient: { select: { firstName: true, lastName: true } },
      },
    });

    const [totalNotifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { medecinId: userId, target: "Medecin", read: false } }),
    ]);

    const formatted: NotificationDTO[] = (notifications as NotificationFromPrisma[]).map(
      (n: NotificationFromPrisma): NotificationDTO => {
        const name =
          [n.patient?.firstName, n.patient?.lastName].filter(Boolean).join(" ").trim() || "le patient";

        const lower = (n.message || "").toLowerCase();
        let msg = n.message || "Notification";

        if (n.type === "accessResponse") {
          const isShared = /(partag(e|é)|a partagé)/i.test(lower);
          const isAccepted = /(approuv|accept)/i.test(lower);
          const isDeclined = /(refus|déclin)/i.test(lower);
        
          if (isShared) {
            // ✅ partage spontané du patient : on garde le message d'origine
            msg = n.message || `Le patient a partagé son dossier.`;
          } else if (isAccepted) {
            msg = `Votre demande d'accès a été approuvée par ${name}.`;
          } else if (isDeclined) {
            msg = `Votre demande d'accès a été refusée par ${name}.`;
          } else {
            // Sinon, ne pas forcer un "refusé" par défaut : on laisse le texte source
            msg = n.message || "Notification";
          }
        }

        // if (n.type === "appointmentResponse") {
        //   msg = n.message.toLowerCase().includes("confirmée") || n.message.toLowerCase().includes("accepté")
        //     ? `Votre demande de rendez-vous a été confirmée par ${name}.`
        //     : `Votre demande de rendez-vous a été refusée par ${name}.`;
        // }

        if (n.type === "appointmentResponse") {
          const isAccept = /(confirm|accept|approuv|valid)/i.test(lower);   // confirmé/accepté/approuvé/validé
          const isDecline = /(refus|déclin|declin|annul)/i.test(lower);     // refus/déclin/annul

          if (isAccept) {
            msg = `Le patient ${name} a confirmé la proposition de rendez-vous.`;
          } else if (isDecline) {
            msg = `Le patient ${name} a refusé la proposition de rendez-vous.`;
          } else {
            // ⚠️ Si on ne sait pas, on garde le texte source (surtout pas "refusé" par défaut)
            msg = n.message || "Notification";
          }
        }

        return {
          id: n.id,
          message: msg || "Notification",
          date: n.date.toISOString(),
          read: n.read,
          createdAt: n.createdAt.toISOString(),
          updatedAt: n.updatedAt.toISOString(),
          type: n.type as AllowedType,
          relatedId: n.relatedId ?? null, 
        };
      }
    );

    return NextResponse.json(
      {
        notifications: formatted,
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
    console.error("Erreur /api/medecin/notifications GET :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return NextResponse.json({ error: "Token manquant." }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const updated = await prisma.notification.updateMany({
      where: { medecinId: userId, target: "Medecin", read: false },
      data: { read: true },
    });

    return NextResponse.json({ message: "Notifications lues.", count: updated.count }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/medecin/notifications PUT :", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications." },
      { status: 500 }
    );
  }
}

// (optionnel) POST si un autre service veut pousser une notif médecin via HTTP.
// Le flux patient → médecin écrit déjà directement en DB, donc ce POST n'est pas requis.
export async function POST(req: Request) {
  try {
    const { medecinId, message, type, patientId, relatedId } = (await req.json()) as {
      medecinId: string;
      message: string;
      type?: AllowedType;
      patientId?: string;
      relatedId?: string | null;
    };

    if (!medecinId || !message) {
      return NextResponse.json({ error: "medecinId et message sont requis." }, { status: 400 });
    }

    const notif = await prisma.notification.create({
      data: {
        medecinId,
        patientId: patientId || null,
        message,
        type: (type || "alert") as string,
        date: new Date(),
        read: false,
        relatedId: relatedId || null,
        target: "Medecin",
      },
    });

    return NextResponse.json({ success: true, notification: notif }, { status: 201 });
  } catch (error) {
    console.error("Erreur /api/medecin/notifications POST :", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification." },
      { status: 500 }
    );
  }
}
