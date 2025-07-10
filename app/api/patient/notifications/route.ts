// // // import { NextResponse } from "next/server";
// // // import { jwtVerify } from "jose";
// // // import prisma from "@/lib/prisma";

// // // const JWT_SECRET = process.env.JWT_SECRET
// // //   ? new TextEncoder().encode(process.env.JWT_SECRET)
// // //   : null;

// // // // Interfaces
// // // interface Notification {
// // //   id: string;
// // //   message: string;
// // //   date: string;
// // //   read: boolean;
// // //   createdAt: string;
// // //   updatedAt: string;
// // // }

// // // interface NotificationFromPrisma {
// // //   id: string;
// // //   message: string;
// // //   date: Date;
// // //   read: boolean;
// // //   createdAt: Date;
// // //   updatedAt: Date;
// // // }

// // // interface PostRequestBody {
// // //   patientId: string;
// // //   message: string;
// // // }

// // // interface NotificationListResponse {
// // //   notifications: Notification[];
// // //   unreadCount: number;
// // //   pagination: {
// // //     currentPage: number;
// // //     totalPages: number;
// // //     totalItems: number;
// // //     hasNext: boolean;
// // //     hasPrev: boolean;
// // //   };
// // // }

// // // interface PatchRequestBody {
// // //   notificationId: string;
// // // }

// // // interface BulkUpdateResponse {
// // //   message: string;
// // //   count: number;
// // // }

// // // export async function GET(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const url = new URL(req.url);
// // //     const page = parseInt(url.searchParams.get("page") || "1");
// // //     const limit = parseInt(url.searchParams.get("limit") || "10");
// // //     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
// // //     const skip = (page - 1) * limit;

// // //     const where = { patientId: userId, ...(unreadOnly && { read: false }) };

// // //     const notifications = await prisma.notification.findMany({
// // //       where,
// // //       orderBy: { date: "desc" },
// // //       skip,
// // //       take: limit,
// // //     });

// // //     const [totalNotifications, unreadCount] = await Promise.all([
// // //       prisma.notification.count({ where }),
// // //       prisma.notification.count({ where: { patientId: userId, read: false } }),
// // //     ]);

// // //     const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => ({
// // //       id: n.id,
// // //       message: n.message,
// // //       date: n.date.toISOString(),
// // //       read: n.read,
// // //       createdAt: n.createdAt.toISOString(),
// // //       updatedAt: n.updatedAt.toISOString(),
// // //     }));

// // //     console.log("Notifications renvoyées pour patientId :", userId, {
// // //       count: formattedNotifications.length,
// // //       unreadCount,
// // //       page,
// // //     });

// // //     return NextResponse.json(
// // //       {
// // //         notifications: formattedNotifications,
// // //         unreadCount,
// // //         pagination: {
// // //           currentPage: page,
// // //           totalPages: Math.ceil(totalNotifications / limit),
// // //           totalItems: totalNotifications,
// // //           hasNext: skip + notifications.length < totalNotifications,
// // //           hasPrev: page > 1,
// // //         },
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications GET :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function POST(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications POST.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Medecin") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
// // //     }

// // //     const { patientId, message }: PostRequestBody = await req.json();
// // //     if (!patientId || !message) {
// // //       return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
// // //     }

// // //     const patient = await prisma.user.findUnique({
// // //       where: { id: patientId, role: "Patient" },
// // //     });
// // //     if (!patient) {
// // //       console.log("Patient non trouvé pour patientId :", patientId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const notification = await prisma.notification.create({
// // //       data: {
// // //         patientId,
// // //         message,
// // //         date: new Date(),
// // //         read: false,
// // //       },
// // //     });

// // //     console.log("Notification créée pour patientId :", patientId, { notificationId: notification.id });

// // //     return NextResponse.json(notification, { status: 201 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications POST :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PATCH(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const { notificationId }: PatchRequestBody = await req.json();
// // //     if (!notificationId) {
// // //       return NextResponse.json({ error: "notificationId manquant." }, { status: 400 });
// // //     }

// // //     const updatedNotification = await prisma.notification.update({
// // //       where: {
// // //         id: notificationId,
// // //         patientId: userId,
// // //       },
// // //       data: { read: true },
// // //     });

// // //     console.log("Notification marquée comme lue pour patientId :", userId, { notificationId });

// // //     return NextResponse.json(updatedNotification, { status: 200 });
// // //   } catch (error) {
// // //   console.error("Erreur dans /api/patient/notifications GET :", {
// // //     message: error instanceof Error ? error.message : "Erreur inconnue",
// // //     stack: error instanceof Error ? error.stack : undefined,
// // //   });
// // //   return NextResponse.json(
// // //     { 
// // //       error: "Erreur lors de la récupération des notifications.", 
// // //       details: error instanceof Error ? error.message : String(error) // Convert to string for safety
// // //     },
// // //     { status: 500 }
// // //   );
// // // }
// // // }

// // // export async function PUT(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PUT.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const updatedNotifications = await prisma.notification.updateMany({
// // //       where: {
// // //         patientId: userId,
// // //         read: false,
// // //       },
// // //       data: { read: true },
// // //     });

// // //     console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

// // //     return NextResponse.json(
// // //       {
// // //         message: "Toutes les notifications ont été marquées comme lues.",
// // //         count: updatedNotifications.count,
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PUT :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }


// // // import { NextResponse } from "next/server";
// // // import { jwtVerify } from "jose";
// // // import prisma from "@/lib/prisma";

// // // const JWT_SECRET = process.env.JWT_SECRET
// // //   ? new TextEncoder().encode(process.env.JWT_SECRET)
// // //   : null;

// // // // Interfaces
// // // interface Notification {
// // //   id: string;
// // //   message: string;
// // //   date: string;
// // //   read: boolean;
// // //   createdAt: string;
// // //   updatedAt: string;
// // // }

// // // interface NotificationFromPrisma {
// // //   id: string;
// // //   message: string;
// // //   date: Date;
// // //   read: boolean;
// // //   createdAt: Date;
// // //   updatedAt: Date;
// // // }

// // // interface PostRequestBody {
// // //   patientId: string;
// // //   message: string;
// // // }

// // // interface NotificationListResponse {
// // //   notifications: Notification[];
// // //   unreadCount: number;
// // //   pagination: {
// // //     currentPage: number;
// // //     totalPages: number;
// // //     totalItems: number;
// // //     hasNext: boolean;
// // //     hasPrev: boolean;
// // //   };
// // // }

// // // interface PatchRequestBody {
// // //   notificationId: string;
// // // }

// // // interface BulkUpdateResponse {
// // //   message: string;
// // //   count: number;
// // // }

// // // interface AccessRequest {
// // //   id: string;
// // //   medecinId: string;
// // //   patientId: string;
// // //   status: "En attente" | "Accepté" | "Refusé";
// // //   createdAt: Date;
// // //   updatedAt: Date;
// // // }

// // // export async function GET(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const url = new URL(req.url);
// // //     const page = parseInt(url.searchParams.get("page") || "1");
// // //     const limit = parseInt(url.searchParams.get("limit") || "10");
// // //     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
// // //     const skip = (page - 1) * limit;

// // //     const where = { patientId: userId, ...(unreadOnly && { read: false }) };

// // //     const notifications = await prisma.notification.findMany({
// // //       where,
// // //       orderBy: { date: "desc" },
// // //       skip,
// // //       take: limit,
// // //     });

// // //     const [totalNotifications, unreadCount] = await Promise.all([
// // //       prisma.notification.count({ where }),
// // //       prisma.notification.count({ where: { patientId: userId, read: false } }),
// // //     ]);

// // //     const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => ({
// // //       id: n.id,
// // //       message: n.message,
// // //       date: n.date.toISOString(),
// // //       read: n.read,
// // //       createdAt: n.createdAt.toISOString(),
// // //       updatedAt: n.updatedAt.toISOString(),
// // //     }));

// // //     console.log("Notifications renvoyées pour patientId :", userId, {
// // //       count: formattedNotifications.length,
// // //       unreadCount,
// // //       page,
// // //     });

// // //     return NextResponse.json(
// // //       {
// // //         notifications: formattedNotifications,
// // //         unreadCount,
// // //         pagination: {
// // //           currentPage: page,
// // //           totalPages: Math.ceil(totalNotifications / limit),
// // //           totalItems: totalNotifications,
// // //           hasNext: skip + notifications.length < totalNotifications,
// // //           hasPrev: page > 1,
// // //         },
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications GET :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function POST(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications POST.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Medecin") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
// // //     }

// // //     const { patientId, message }: PostRequestBody = await req.json();
// // //     if (!patientId || !message) {
// // //       return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
// // //     }

// // //     const patient = await prisma.user.findUnique({
// // //       where: { id: patientId, role: "Patient" },
// // //     });
// // //     if (!patient) {
// // //       console.log("Patient non trouvé pour patientId :", patientId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     if (!userId) {
// // //       return NextResponse.json({ error: "Identifiant du médecin manquant." }, { status: 400 });
// // //     }

// // //     // Enregistrer la demande d'accès dans la table AccessRequest
// // //     const accessRequest = await prisma.accessRequest.create({
// // //       data: {
// // //         medecinId: userId,
// // //         patientId,
// // //         status: "En attente",
// // //         createdAt: new Date(),
// // //         updatedAt: new Date(),
// // //       },
// // //     });

// // //     // Créer la notification avec medecinId
// // //     const notification = await prisma.notification.create({
// // //       data: {
// // //         patientId,
// // //         medecinId: userId,
// // //         message,
// // //         date: new Date(),
// // //         read: false,
// // //       },
// // //     });

// // //     console.log("Notification et demande d'accès créées pour patientId :", patientId, { notificationId: notification.id, accessRequestId: accessRequest.id });

// // //     return NextResponse.json(notification, { status: 201 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications POST :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PATCH(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
// // //     if (!notificationId || !action) {
// // //       return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
// // //     }

// // //     // Récupérer la notification
// // //     const notification = await prisma.notification.findUnique({
// // //       where: { id: notificationId, patientId: userId },
// // //     });
// // //     if (!notification) {
// // //       return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
// // //     }

// // //     // Récupérer la demande d'accès associée
// // //     const whereClause = {
// // //       patientId: userId,
// // //       status: "En attente" as const,
// // //       ...(notification.medecinId && { medecinId: notification.medecinId }),
// // //     };

// // //     const accessRequest = await prisma.accessRequest.findFirst({
// // //       where: whereClause,
// // //     });

// // //     let responseMessage = "";
// // //     if (accessRequest) {
// // //       const updatedAccessRequest = await prisma.accessRequest.update({
// // //         where: { id: accessRequest.id },
// // //         data: { status: action === "accept" ? "Accepté" : "Refusé", updatedAt: new Date() },
// // //       });
// // //       responseMessage = action === "accept" ? "Accepté" : "Refusé";

// // //       // Envoyer une notification au médecin
// // //       await prisma.notification.create({
// // //         data: {
// // //           medecinId: notification.medecinId,
// // //           message: `Le patient ${userId} a ${responseMessage.toLowerCase()} votre demande d'accès.`,
// // //           date: new Date(),
// // //           read: false,
// // //         },
// // //       });

// // //       await prisma.notification.update({
// // //         where: { id: notificationId },
// // //         data: { read: true, message: `${notification.message} (${responseMessage})` },
// // //       });
// // //     } else {
// // //       await prisma.notification.update({
// // //         where: { id: notificationId },
// // //         data: { read: true, message: `${notification.message} (Refusé)` },
// // //       });
// // //       responseMessage = "Refusé";
// // //     }

// // //     console.log("Notification mise à jour pour patientId :", userId, { notificationId });

// // //     return NextResponse.json({ message: `Demande ${responseMessage}.` }, { status: 200 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PATCH :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PUT(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PUT.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const updatedNotifications = await prisma.notification.updateMany({
// // //       where: {
// // //         patientId: userId,
// // //         read: false,
// // //       },
// // //       data: { read: true },
// // //     });

// // //     console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

// // //     return NextResponse.json(
// // //       {
// // //         message: "Toutes les notifications ont été marquées comme lues.",
// // //         count: updatedNotifications.count,
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PUT :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // import { NextResponse } from "next/server";
// // // import { jwtVerify } from "jose";
// // // import prisma from "@/lib/prisma";

// // // const JWT_SECRET = process.env.JWT_SECRET
// // //   ? new TextEncoder().encode(process.env.JWT_SECRET)
// // //   : null;

// // // // Interfaces
// // // interface Notification {
// // //   id: string;
// // //   message: string;
// // //   date: string;
// // //   read: boolean;
// // //   type: string;
// // //   createdAt: string;
// // //   updatedAt: string;
// // // }

// // // interface NotificationFromPrisma {
// // //   id: string;
// // //   message: string;
// // //   date: Date;
// // //   read: boolean;
// // //   type: string;
// // //   relatedId: string | null;
// // //   createdAt: Date;
// // //   updatedAt: Date;
// // //   accessRequest: { id: string } | null;
// // // }

// // // interface PostRequestBody {
// // //   patientId: string;
// // //   message: string;
// // //   type?: string; // Optionnel pour spécifier le type
// // // }

// // // // Type pour notificationData avec relatedId optionnel
// // // interface NotificationCreateInput {
// // //   patientId: string;
// // //   medecinId: string;
// // //   message: string;
// // //   date: Date;
// // //   read: boolean;
// // //   type: string;
// // //   relatedId?: string | null;
// // // }

// // // export async function GET(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
// // //     }

// // //     const url = new URL(req.url);
// // //     const page = parseInt(url.searchParams.get("page") || "1");
// // //     const limit = parseInt(url.searchParams.get("limit") || "10");
// // //     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
// // //     const skip = (page - 1) * limit;

// // //     const where = { patientId: userId, ...(unreadOnly && { read: false }) };
// // //     console.log("Filtre WHERE pour GET :", where); // Débogage

// // //     const notifications = await prisma.notification.findMany({
// // //       where,
// // //       orderBy: { date: "desc" },
// // //       skip,
// // //       take: limit,
// // //       include: { accessRequest: true }, // Inclure les détails de la demande d'accès pour débogage
// // //     });

// // //     const [totalNotifications, unreadCount] = await Promise.all([
// // //       prisma.notification.count({ where }),
// // //       prisma.notification.count({ where: { patientId: userId, read: false } }),
// // //     ]);

// // //     const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => ({
// // //       id: n.id,
// // //       message: n.message || `Notification ${n.type} sans message`, // Valeur par défaut basée sur le type
// // //       date: n.date.toISOString(),
// // //       read: n.read,
// // //       type: n.type,
// // //       createdAt: n.createdAt.toISOString(),
// // //       updatedAt: n.updatedAt.toISOString(),
// // //     }));

// // //     console.log("Notifications brutes depuis Prisma :", notifications);
// // //     console.log("Notifications formatées renvoyées :", formattedNotifications);

// // //     return NextResponse.json(
// // //       {
// // //         notifications: formattedNotifications,
// // //         unreadCount,
// // //         pagination: {
// // //           currentPage: page,
// // //           totalPages: Math.ceil(totalNotifications / limit),
// // //           totalItems: totalNotifications,
// // //           hasNext: skip + notifications.length < totalNotifications,
// // //           hasPrev: page > 1,
// // //         },
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications GET :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function POST(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications POST.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Medecin") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
// // //     }

// // //     const { patientId, message, type = "general" }: PostRequestBody = await req.json();
// // //     if (!patientId || !message) {
// // //       return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
// // //     }

// // //     const patient = await prisma.user.findUnique({
// // //       where: { id: patientId, role: "Patient" },
// // //     });
// // //     if (!patient) {
// // //       console.log("Patient non trouvé pour patientId :", patientId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     let notificationData: NotificationCreateInput = {
// // //       patientId,
// // //       medecinId: userId,
// // //       message,
// // //       date: new Date(),
// // //       read: false,
// // //       type,
// // //     };

// // //     let accessRequest = null;
// // //     if (type === "accessRequest") {
// // //       accessRequest = await prisma.accessRequest.create({
// // //         data: {
// // //           medecinId: userId,
// // //           patientId,
// // //           status: "En attente",
// // //           createdAt: new Date(),
// // //           updatedAt: new Date(),
// // //         },
// // //       });
// // //       // Ajout de relatedId uniquement si accessRequest existe
// // //       notificationData = { ...notificationData, relatedId: accessRequest.id };
// // //     }

// // //     const notification = await prisma.notification.create({
// // //       data: notificationData,
// // //     });

// // //     console.log("Notification créée :", { id: notification.id, message: notification.message, type: notification.type, relatedId: notification.relatedId });

// // //     return NextResponse.json(notification, { status: 201 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications POST :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PATCH(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
// // //     if (!notificationId || !action) {
// // //       return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
// // //     }

// // //     const notification = await prisma.notification.findUnique({
// // //       where: { id: notificationId, patientId: userId },
// // //     });
// // //     if (!notification) {
// // //       return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
// // //     }

// // //     let responseMessage = "";
// // //     if (notification.type === "accessRequest" && notification.relatedId) {
// // //       const accessRequest = await prisma.accessRequest.findUnique({
// // //         where: { id: notification.relatedId },
// // //       });
// // //       if (accessRequest) {
// // //         await prisma.accessRequest.update({
// // //           where: { id: accessRequest.id },
// // //           data: { status: action === "accept" ? "Accepté" : "Refusé", updatedAt: new Date() },
// // //         });
// // //         responseMessage = action === "accept" ? "Accepté" : "Refusé";

// // //         await prisma.notification.create({
// // //           data: {
// // //             medecinId: notification.medecinId,
// // //             message: `Le patient ${userId} a ${responseMessage.toLowerCase()} votre demande d'accès.`,
// // //             date: new Date(),
// // //             read: false,
// // //             type: "general",
// // //           },
// // //         });
// // //       }
// // //     }

// // //     await prisma.notification.update({
// // //       where: { id: notificationId },
// // //       data: { read: true, message: `${notification.message || `Notification ${notification.type}`} (${responseMessage || "Refusé"})` },
// // //     });

// // //     console.log("Notification mise à jour pour patientId :", userId, { notificationId });

// // //     return NextResponse.json({ message: `Demande ${responseMessage || "Refusé"}.` }, { status: 200 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PATCH :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PUT(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PUT.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const updatedNotifications = await prisma.notification.updateMany({
// // //       where: {
// // //         patientId: userId,
// // //         read: false,
// // //       },
// // //       data: { read: true },
// // //     });

// // //     console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

// // //     return NextResponse.json(
// // //       {
// // //         message: "Toutes les notifications ont été marquées comme lues.",
// // //         count: updatedNotifications.count,
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PUT :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }


// // // import { NextResponse } from "next/server";
// // // import { jwtVerify } from "jose";
// // // import prisma from "@/lib/prisma";

// // // const JWT_SECRET = process.env.JWT_SECRET
// // //   ? new TextEncoder().encode(process.env.JWT_SECRET)
// // //   : null;

// // // // Interfaces
// // // interface Notification {
// // //   id: string;
// // //   message: string;
// // //   date: string;
// // //   read: boolean;
// // //   type: string;
// // //   createdAt: string;
// // //   updatedAt: string;
// // // }

// // // interface NotificationFromPrisma {
// // //   id: string;
// // //   message: string;
// // //   date: Date;
// // //   read: boolean;
// // //   type: string;
// // //   relatedId: string | null;
// // //   createdAt: Date;
// // //   updatedAt: Date;
// // //   accessRequest: { id: string } | null;
// // // }

// // // interface PostRequestBody {
// // //   patientId: string;
// // //   message: string;
// // //   type?: string; // Optionnel pour spécifier le type, surchargera le défaut "result"
// // // }

// // // // Type pour notificationData avec relatedId optionnel
// // // interface NotificationCreateInput {
// // //   patientId: string;
// // //   medecinId: string;
// // //   message: string;
// // //   date: Date;
// // //   read: boolean;
// // //   type: string;
// // //   relatedId?: string | null;
// // // }

// // // export async function GET(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
// // //     }

// // //     const url = new URL(req.url);
// // //     const page = parseInt(url.searchParams.get("page") || "1");
// // //     const limit = parseInt(url.searchParams.get("limit") || "10");
// // //     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
// // //     const skip = (page - 1) * limit;

// // //     const where = { patientId: userId }; // Simplifié pour inclure toutes les notifications
// // //     if (unreadOnly) {
// // //       where.read = false;
// // //     }
// // //     console.log("Filtre WHERE pour GET :", where); // Débogage

// // //     const notifications = await prisma.notification.findMany({
// // //       where,
// // //       orderBy: { date: "desc" },
// // //       skip,
// // //       take: limit,
// // //       include: { accessRequest: true }, // Inclure les détails pour débogage
// // //     });

// // //     const [totalNotifications] = await Promise.all([
// // //       prisma.notification.count({ where }),
// // //     ]);
// // //     const unreadCount = await prisma.notification.count({ where: { patientId: userId, read: false } });

// // //     const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => ({
// // //       id: n.id,
// // //       message: n.message || `Notification ${n.type} sans message`,
// // //       date: n.date.toISOString(),
// // //       read: n.read,
// // //       type: n.type,
// // //       createdAt: n.createdAt.toISOString(),
// // //       updatedAt: n.updatedAt.toISOString(),
// // //     }));

// // //     console.log("Notifications brutes depuis Prisma :", notifications);
// // //     console.log("Notifications formatées renvoyées :", formattedNotifications);

// // //     return NextResponse.json(
// // //       {
// // //         notifications: formattedNotifications,
// // //         unreadCount,
// // //         pagination: {
// // //           currentPage: page,
// // //           totalPages: Math.ceil(totalNotifications / limit),
// // //           totalItems: totalNotifications,
// // //           hasNext: skip + notifications.length < totalNotifications,
// // //           hasPrev: page > 1,
// // //         },
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications GET :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function POST(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications POST.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Medecin") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
// // //     }

// // //     const { patientId, message, type = "general" }: PostRequestBody = await req.json(); // Surcharge "result" par défaut
// // //     if (!patientId || !message) {
// // //       return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
// // //     }

// // //     const patient = await prisma.user.findUnique({
// // //       where: { id: patientId, role: "Patient" },
// // //     });
// // //     if (!patient) {
// // //       console.log("Patient non trouvé pour patientId :", patientId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     let notificationData: NotificationCreateInput = {
// // //       patientId,
// // //       medecinId: userId,
// // //       message,
// // //       date: new Date(),
// // //       read: false,
// // //       type, // Utilise le type fourni ou "general" par défaut
// // //     };

// // //     let accessRequest = null;
// // //     if (type === "accessRequest") {
// // //       accessRequest = await prisma.accessRequest.create({
// // //         data: {
// // //           medecinId: userId,
// // //           patientId,
// // //           status: "En attente",
// // //           createdAt: new Date(),
// // //           updatedAt: new Date(),
// // //         },
// // //       });
// // //       notificationData = { ...notificationData, relatedId: accessRequest.id };
// // //     }

// // //     const notification = await prisma.notification.create({
// // //       data: notificationData,
// // //     });

// // //     console.log("Notification créée :", { id: notification.id, message: notification.message, type: notification.type, relatedId: notification.relatedId });

// // //     return NextResponse.json(notification, { status: 201 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications POST :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PATCH(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
// // //     if (!notificationId || !action) {
// // //       return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
// // //     }

// // //     const notification = await prisma.notification.findUnique({
// // //       where: { id: notificationId, patientId: userId },
// // //     });
// // //     if (!notification) {
// // //       return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
// // //     }

// // //     let responseMessage = "";
// // //     if (notification.type === "accessRequest" && notification.relatedId) {
// // //       const accessRequest = await prisma.accessRequest.findUnique({
// // //         where: { id: notification.relatedId },
// // //       });
// // //       if (accessRequest) {
// // //         await prisma.accessRequest.update({
// // //           where: { id: accessRequest.id },
// // //           data: { status: action === "accept" ? "Accepté" : "Refusé", updatedAt: new Date() },
// // //         });
// // //         responseMessage = action === "accept" ? "Accepté" : "Refusé";

// // //         await prisma.notification.create({
// // //           data: {
// // //             medecinId: notification.medecinId,
// // //             message: `Le patient ${userId} a ${responseMessage.toLowerCase()} votre demande d'accès.`,
// // //             date: new Date(),
// // //             read: false,
// // //             type: "general",
// // //           },
// // //         });
// // //       }
// // //     }

// // //     await prisma.notification.update({
// // //       where: { id: notificationId },
// // //       data: { read: true, message: `${notification.message || `Notification ${notification.type}`} (${responseMessage || "Refusé"})` },
// // //     });

// // //     console.log("Notification mise à jour pour patientId :", userId, { notificationId });

// // //     return NextResponse.json({ message: `Demande ${responseMessage || "Refusé"}.` }, { status: 200 });
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PATCH :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }

// // // export async function PUT(req: Request) {
// // //   try {
// // //     if (!JWT_SECRET) {
// // //       console.error("JWT_SECRET non défini.");
// // //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// // //     }

// // //     const authHeader = req.headers.get("authorization");
// // //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// // //     if (!token) {
// // //       console.log("Aucun token fourni pour /api/patient/notifications PUT.");
// // //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// // //     }

// // //     let payload;
// // //     try {
// // //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// // //       payload = verifiedPayload;
// // //     } catch (err) {
// // //       console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
// // //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// // //     }

// // //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// // //     const role = typeof payload.role === "string" ? payload.role : undefined;
// // //     if (!userId || !role || role !== "Patient") {
// // //       console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
// // //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// // //     }

// // //     const user = await prisma.user.findUnique({
// // //       where: { id: userId, role: "Patient" },
// // //     });
// // //     if (!user) {
// // //       console.log("Patient non trouvé pour userId :", userId);
// // //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// // //     }

// // //     const updatedNotifications = await prisma.notification.updateMany({
// // //       where: {
// // //         patientId: userId,
// // //         read: false,
// // //       },
// // //       data: { read: true },
// // //     });

// // //     console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

// // //     return NextResponse.json(
// // //       {
// // //         message: "Toutes les notifications ont été marquées comme lues.",
// // //         count: updatedNotifications.count,
// // //       },
// // //       { status: 200 }
// // //     );
// // //   } catch (error) {
// // //     console.error("Erreur dans /api/patient/notifications PUT :", {
// // //       message: error instanceof Error ? error.message : "Erreur inconnue",
// // //       stack: error instanceof Error ? error.stack : undefined,
// // //     });
// // //     return NextResponse.json(
// // //       { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// // //       { status: 500 }
// // //     );
// // //   }
// // // }


// // import { NextResponse } from "next/server";
// // import { jwtVerify } from "jose";
// // import prisma from "@/lib/prisma";

// // const JWT_SECRET = process.env.JWT_SECRET
// //   ? new TextEncoder().encode(process.env.JWT_SECRET)
// //   : null;

// // interface Notification {
// //   id: string;
// //   message: string;
// //   date: string;
// //   read: boolean;
// //   type: "appointment" | "consultation" | "result" | "accessRequest";
// //   createdAt: string;
// //   updatedAt: string;
// // }

// // interface NotificationFromPrisma {
// //   id: string;
// //   message: string;
// //   date: Date;
// //   read: boolean;
// //   type: string;
// //   relatedId: string | null;
// //   createdAt: Date;
// //   updatedAt: Date;
// //   accessRequest: { id: string } | null;
// // }

// // interface PostRequestBody {
// //   patientId: string;
// //   message: string;
// //   type?: string; // Optionnel, sera validé
// //   relatedId?: string;
// // }

// // interface NotificationCreateInput {
// //   patientId: string;
// //   medecinId: string;
// //   message: string;
// //   date: Date;
// //   read: boolean;
// //   type: "appointment" | "consultation" | "result" | "accessRequest";
// //   relatedId?: string | null;
// // }

// // // Définir VALID_TYPES comme un tuple de littéraux
// // const VALID_TYPES = ["appointment", "consultation", "result", "accessRequest"] as const;
// // // Type dérivé pour les valeurs valides
// // type ValidType = typeof VALID_TYPES[number];

// // export async function POST(req: Request) {
// //   try {
// //     if (!JWT_SECRET) {
// //       console.error("JWT_SECRET non défini.");
// //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// //     }

// //     const authHeader = req.headers.get("authorization");
// //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// //     if (!token) {
// //       console.log("Aucun token fourni pour /api/patient/notifications POST.");
// //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// //     }

// //     let payload;
// //     try {
// //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// //       payload = verifiedPayload;
// //     } catch (err) {
// //       console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
// //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// //     }

// //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// //     const role = typeof payload.role === "string" ? payload.role : undefined;
// //     if (!userId || !role || role !== "Medecin") {
// //       console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
// //       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
// //     }

// //     const { patientId, message, type }: PostRequestBody = await req.json();
// //     if (!patientId || !message) {
// //       return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
// //     }

// //     // Validation stricte du type
// //     let validatedType: ValidType;
// //     if (type) {
// //       if (!VALID_TYPES.includes(type as ValidType)) {
// //         return NextResponse.json({ error: "Type invalide. Doit être 'appointment', 'consultation', 'result', ou 'accessRequest'." }, { status: 400 });
// //       }
// //       validatedType = type as ValidType;
// //     } else {
// //       // Inférence basée sur le message si type non fourni
// //       if (message.toLowerCase().includes("rendez-vous")) validatedType = "appointment";
// //       else if (message.toLowerCase().includes("consultation")) validatedType = "consultation";
// //       else if (message.toLowerCase().includes("résultat")) validatedType = "result";
// //       else if (message.toLowerCase().includes("demande d'accès")) validatedType = "accessRequest";
// //       else {
// //         return NextResponse.json({ error: "Type non spécifié et impossible à inférer. Doit être 'appointment', 'consultation', 'result', ou 'accessRequest'." }, { status: 400 });
// //       }
// //     }

// //     const patient = await prisma.user.findUnique({
// //       where: { id: patientId, role: "Patient" },
// //     });
// //     if (!patient) {
// //       console.log("Patient non trouvé pour patientId :", patientId);
// //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// //     }

// //     let notificationData: NotificationCreateInput = {
// //       patientId,
// //       medecinId: userId,
// //       message,
// //       date: new Date(),
// //       read: false,
// //       type: validatedType,
// //     };

// //     let accessRequest = null;
// //     if (validatedType === "accessRequest") {
// //       accessRequest = await prisma.accessRequest.create({
// //         data: {
// //           medecinId: userId,
// //           patientId,
// //           status: "En attente",
// //           createdAt: new Date(),
// //           updatedAt: new Date(),
// //         },
// //       });
// //       notificationData = { ...notificationData, relatedId: accessRequest.id };
// //     }

// //     const notification = await prisma.notification.create({
// //       data: notificationData,
// //     });

// //     console.log("Notification créée :", { id: notification.id, message: notification.message, type: notification.type, relatedId: notification.relatedId });

// //     return NextResponse.json(notification, { status: 201 });
// //   } catch (error) {
// //     console.error("Erreur dans /api/patient/notifications POST :", {
// //       message: error instanceof Error ? error.message : "Erreur inconnue",
// //       stack: error instanceof Error ? error.stack : undefined,
// //     });
// //     return NextResponse.json(
// //       { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // export async function GET(req: Request) {
// //   try {
// //     if (!JWT_SECRET) {
// //       console.error("JWT_SECRET non défini.");
// //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// //     }

// //     const authHeader = req.headers.get("authorization");
// //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// //     if (!token) {
// //       console.log("Aucun token fourni pour /api/patient/notifications.");
// //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// //     }

// //     let payload;
// //     try {
// //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// //       payload = verifiedPayload;
// //     } catch (err) {
// //       console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
// //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// //     }

// //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// //     const role = typeof payload.role === "string" ? payload.role : undefined;
// //     if (!userId || !role || role !== "Patient") {
// //       console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
// //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
// //     }

// //     const url = new URL(req.url);
// //     const page = parseInt(url.searchParams.get("page") || "1");
// //     const limit = parseInt(url.searchParams.get("limit") || "10");
// //     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
// //     const skip = (page - 1) * limit;

// //     const where = {
// //       patientId: userId,
// //       ...(unreadOnly && { read: false }),
// //     };
// //     console.log("Filtre WHERE pour GET :", where);

// //     const notifications = await prisma.notification.findMany({
// //       where,
// //       orderBy: { date: "desc" },
// //       skip,
// //       take: limit,
// //       include: { accessRequest: true },
// //     });

// //     const [totalNotifications] = await Promise.all([
// //       prisma.notification.count({ where }),
// //     ]);
// //     const unreadCount = await prisma.notification.count({ where: { patientId: userId, read: false } });

// //     const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => {
// //       if (!VALID_TYPES.includes(n.type as ValidType)) {
// //         console.warn(`Type invalide trouvé : ${n.type}, ignoré pour le patient ${userId}`);
// //         return null; // Ignorer les notifications avec un type invalide
// //       }
// //       return {
// //         id: n.id,
// //         message: n.message || `Notification ${n.type} sans message`,
// //         date: n.date.toISOString(),
// //         read: n.read,
// //         type: n.type as "appointment" | "consultation" | "result" | "accessRequest",
// //         createdAt: n.createdAt.toISOString(),
// //         updatedAt: n.updatedAt.toISOString(),
// //       };
// //     }).filter((n): n is Notification => n !== null);

// //     console.log("Notifications brutes depuis Prisma :", notifications);
// //     console.log("Notifications formatées renvoyées :", formattedNotifications);

// //     return NextResponse.json(
// //       {
// //         notifications: formattedNotifications,
// //         unreadCount,
// //         pagination: {
// //           currentPage: page,
// //           totalPages: Math.ceil(totalNotifications / limit),
// //           totalItems: totalNotifications,
// //           hasNext: skip + notifications.length < totalNotifications,
// //           hasPrev: page > 1,
// //         },
// //       },
// //       { status: 200 }
// //     );
// //   } catch (error) {
// //     console.error("Erreur dans /api/patient/notifications GET :", {
// //       message: error instanceof Error ? error.message : "Erreur inconnue",
// //       stack: error instanceof Error ? error.stack : undefined,
// //     });
// //     return NextResponse.json(
// //       { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // export async function PATCH(req: Request) {
// //   try {
// //     if (!JWT_SECRET) {
// //       console.error("JWT_SECRET non défini.");
// //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// //     }

// //     const authHeader = req.headers.get("authorization");
// //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// //     if (!token) {
// //       console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
// //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// //     }

// //     let payload;
// //     try {
// //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// //       payload = verifiedPayload;
// //     } catch (err) {
// //       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
// //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// //     }

// //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// //     const role = typeof payload.role === "string" ? payload.role : undefined;
// //     if (!userId || !role || role !== "Patient") {
// //       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
// //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// //     }

// //     const user = await prisma.user.findUnique({
// //       where: { id: userId, role: "Patient" },
// //     });
// //     if (!user) {
// //       console.log("Patient non trouvé pour userId :", userId);
// //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// //     }

// //     const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
// //     if (!notificationId || !action) {
// //       return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
// //     }

// //     const notification = await prisma.notification.findUnique({
// //       where: { id: notificationId, patientId: userId },
// //     });
// //     if (!notification) {
// //       return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
// //     }

// //     let responseMessage = "";
// //     if (notification.type === "accessRequest" && notification.relatedId) {
// //       const accessRequest = await prisma.accessRequest.findUnique({
// //         where: { id: notification.relatedId },
// //       });
// //       if (accessRequest) {
// //         await prisma.accessRequest.update({
// //           where: { id: accessRequest.id },
// //           data: { status: action === "accept" ? "Accepté" : "Refusé", updatedAt: new Date() },
// //         });
// //         responseMessage = action === "accept" ? "Accepté" : "Refusé";

// //         await prisma.notification.create({
// //           data: {
// //             medecinId: notification.medecinId,
// //             message: `Le patient ${userId} a ${responseMessage.toLowerCase()} votre demande d'accès.`,
// //             date: new Date(),
// //             read: false,
// //             type: "accessRequest",
// //           },
// //         });
// //       }
// //     }

// //     await prisma.notification.update({
// //       where: { id: notificationId },
// //       data: { read: true, message: `${notification.message || `Notification ${notification.type}`} (${responseMessage || "Refusé"})` },
// //     });

// //     console.log("Notification mise à jour pour patientId :", userId, { notificationId });

// //     return NextResponse.json({ message: `Demande ${responseMessage || "Refusé"}.` }, { status: 200 });
// //   } catch (error) {
// //     console.error("Erreur dans /api/patient/notifications PATCH :", {
// //       message: error instanceof Error ? error.message : "Erreur inconnue",
// //       stack: error instanceof Error ? error.stack : undefined,
// //     });
// //     return NextResponse.json(
// //       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// //       { status: 500 }
// //     );
// //   }
// // }

// // export async function PUT(req: Request) {
// //   try {
// //     if (!JWT_SECRET) {
// //       console.error("JWT_SECRET non défini.");
// //       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
// //     }

// //     const authHeader = req.headers.get("authorization");
// //     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
// //     if (!token) {
// //       console.log("Aucun token fourni pour /api/patient/notifications PUT.");
// //       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
// //     }

// //     let payload;
// //     try {
// //       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
// //       payload = verifiedPayload;
// //     } catch (err) {
// //       console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
// //       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
// //     }

// //     const userId = typeof payload.id === "string" ? payload.id : undefined;
// //     const role = typeof payload.role === "string" ? payload.role : undefined;
// //     if (!userId || !role || role !== "Patient") {
// //       console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
// //       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
// //     }

// //     const user = await prisma.user.findUnique({
// //       where: { id: userId, role: "Patient" },
// //     });
// //     if (!user) {
// //       console.log("Patient non trouvé pour userId :", userId);
// //       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
// //     }

// //     const updatedNotifications = await prisma.notification.updateMany({
// //       where: {
// //         patientId: userId,
// //         read: false,
// //       },
// //       data: { read: true },
// //     });

// //     console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

// //     return NextResponse.json(
// //       {
// //         message: "Toutes les notifications ont été marquées comme lues.",
// //         count: updatedNotifications.count,
// //       },
// //       { status: 200 }
// //     );
// //   } catch (error) {
// //     console.error("Erreur dans /api/patient/notifications PUT :", {
// //       message: error instanceof Error ? error.message : "Erreur inconnue",
// //       stack: error instanceof Error ? error.stack : undefined,
// //     });
// //     return NextResponse.json(
// //       { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
// //       { status: 500 }
// //     );
// //   }
// // }


// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import prisma from "@/lib/prisma";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// interface Notification {
//   id: string;
//   message: string;
//   date: string;
//   read: boolean;
//   type: "appointment" | "consultation" | "result" | "accessRequest";
//   createdAt: string;
//   updatedAt: string;
// }

// interface NotificationFromPrisma {
//   id: string;
//   message: string;
//   date: Date;
//   read: boolean;
//   type: string;
//   relatedId: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   accessRequest: { id: string } | null;
// }

// interface PostRequestBody {
//   patientId: string;
//   message: string;
//   type?: string;
//   relatedId?: string;
// }

// interface NotificationCreateInput {
//   patientId: string;
//   medecinId: string;
//   message: string;
//   date: Date;
//   read: boolean;
//   type: "appointment" | "consultation" | "result" | "accessRequest";
//   relatedId?: string | null;
// }

// export async function GET(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/patient/notifications.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Patient") {
//       console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
//     }

//     const url = new URL(req.url);
//     const page = parseInt(url.searchParams.get("page") || "1");
//     const limit = parseInt(url.searchParams.get("limit") || "10");
//     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
//     const skip = (page - 1) * limit;

//     const where = { patientId: userId, ...(unreadOnly && { read: false }) };
//     console.log("Filtre WHERE pour GET :", where);

//     const notifications = await prisma.notification.findMany({
//       where,
//       orderBy: { date: "desc" },
//       skip,
//       take: limit,
//       include: { accessRequest: true },
//     });

//     const [totalNotifications] = await Promise.all([
//       prisma.notification.count({ where }),
//     ]);
//     const unreadCount = await prisma.notification.count({ where: { patientId: userId, read: false } });

//     const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => ({
//       id: n.id,
//       message: n.message || `Notification ${n.type} sans message`,
//       date: n.date.toISOString(),
//       read: n.read,
//       type: n.type as "appointment" | "consultation" | "result" | "accessRequest",
//       createdAt: n.createdAt.toISOString(),
//       updatedAt: n.updatedAt.toISOString(),
//     }));

//     console.log("Notifications brutes depuis Prisma :", notifications);
//     console.log("Notifications formatées renvoyées :", formattedNotifications);

//     return NextResponse.json(
//       {
//         notifications: formattedNotifications,
//         unreadCount,
//         pagination: {
//           currentPage: page,
//           totalPages: Math.ceil(totalNotifications / limit),
//           totalItems: totalNotifications,
//           hasNext: skip + notifications.length < totalNotifications,
//           hasPrev: page > 1,
//         },
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Erreur dans /api/patient/notifications GET :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/patient/notifications POST.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Medecin") {
//       console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
//     }

//     const { patientId, message, type, relatedId }: PostRequestBody = await req.json();
//     if (!patientId || !message) {
//       return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
//     }

//     const patient = await prisma.user.findUnique({
//       where: { id: patientId, role: "Patient" },
//     });
//     if (!patient) {
//       console.log("Patient non trouvé pour patientId :", patientId);
//       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
//     }

//     let notificationData: NotificationCreateInput = {
//       patientId,
//       medecinId: userId,
//       message,
//       date: new Date(),
//       read: false,
//       type: type as "appointment" | "consultation" | "result" | "accessRequest" || "accessRequest",
//       relatedId,
//     };

//     let accessRequest = null;
//     if (notificationData.type === "accessRequest" && !relatedId) {
//       accessRequest = await prisma.accessRequest.create({
//         data: {
//           medecinId: userId,
//           patientId,
//           status: "En attente",
//           createdAt: new Date(),
//           updatedAt: new Date(),
//         },
//       });
//       notificationData = { ...notificationData, relatedId: accessRequest.id };
//     }

//     const notification = await prisma.notification.create({
//       data: notificationData,
//     });

//     console.log("Notification créée :", { id: notification.id, message: notification.message, type: notification.type, relatedId: notification.relatedId });

//     return NextResponse.json(notification, { status: 201 });
//   } catch (error) {
//     console.error("Erreur dans /api/patient/notifications POST :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

// export async function PATCH(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Patient") {
//       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId, role: "Patient" },
//     });
//     if (!user) {
//       console.log("Patient non trouvé pour userId :", userId);
//       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
//     }

//     const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
//     if (!notificationId || !action) {
//       return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
//     }

//     const notification = await prisma.notification.findUnique({
//       where: { id: notificationId, patientId: userId },
//     });
//     if (!notification) {
//       return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
//     }

//     let responseMessage = "";
//     if (notification.type === "accessRequest" && notification.relatedId) {
//       const accessRequest = await prisma.accessRequest.findUnique({
//         where: { id: notification.relatedId },
//       });
//       if (accessRequest) {
//         await prisma.accessRequest.update({
//           where: { id: accessRequest.id },
//           data: { status: action === "accept" ? "Accepté" : "Refusé", updatedAt: new Date() },
//         });
//         responseMessage = action === "accept" ? "Accepté" : "Refusé";

//         await prisma.notification.create({
//           data: {
//             medecinId: notification.medecinId,
//             message: `Le patient ${userId} a ${responseMessage.toLowerCase()} votre demande d'accès.`,
//             date: new Date(),
//             read: false,
//             type: "general",
//           },
//         });
//       }
//     }

//     await prisma.notification.update({
//       where: { id: notificationId },
//       data: { read: true, message: `${notification.message || `Notification ${notification.type}`} (${responseMessage || "Refusé"})` },
//     });

//     console.log("Notification mise à jour pour patientId :", userId, { notificationId });

//     return NextResponse.json({ message: `Demande ${responseMessage || "Refusé"}.` }, { status: 200 });
//   } catch (error) {
//     console.error("Erreur dans /api/patient/notifications PATCH :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

// export async function PUT(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/patient/notifications PUT.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Patient") {
//       console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id: userId, role: "Patient" },
//     });
//     if (!user) {
//       console.log("Patient non trouvé pour userId :", userId);
//       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
//     }

//     const updatedNotifications = await prisma.notification.updateMany({
//       where: {
//         patientId: userId,
//         read: false,
//       },
//       data: { read: true },
//     });

//     console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

//     return NextResponse.json(
//       {
//         message: "Toutes les notifications ont été marquées comme lues.",
//         count: updatedNotifications.count,
//       },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Erreur dans /api/patient/notifications PUT :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }


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
  type: "appointment" | "consultation" | "result" | "accessRequest";
  createdAt: string;
  updatedAt: string;
}

interface NotificationFromPrisma {
  id: string;
  message: string;
  date: Date;
  read: boolean;
  type: string;
  relatedId: string | null;
  createdAt: Date;
  updatedAt: Date;
  accessRequest: {
    id: string;
    medecinId: string;
    // Ajoute d'autres champs si nécessaires (ex: patientId, status, etc.)
  } | null;
}

interface PostRequestBody {
  patientId: string;
  message: string;
  type?: string;
  relatedId?: string;
}

interface NotificationCreateInput {
  patientId: string;
  medecinId: string;
  message: string;
  date: Date;
  read: boolean;
  type: "appointment" | "consultation" | "result" | "accessRequest";
  relatedId?: string | null;
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
      console.log("Aucun token fourni pour /api/patient/notifications.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/patient/notifications :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé pour /api/patient/notifications GET :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * limit;

    const where = { patientId: userId, ...(unreadOnly && { read: false }) };
    console.log("Filtre WHERE pour GET :", where);

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { accessRequest: true },
    });

    const [totalNotifications] = await Promise.all([
      prisma.notification.count({ where }),
    ]);
    const unreadCount = await prisma.notification.count({ where: { patientId: userId, read: false } });

    const formattedNotifications: Notification[] = notifications.map((n: NotificationFromPrisma) => ({
      id: n.id,
      message: n.message || `Notification ${n.type} sans message`,
      date: n.date.toISOString(),
      read: n.read,
      type: n.type as "appointment" | "consultation" | "result" | "accessRequest",
      relatedId: n.relatedId,
      medecinId: n.accessRequest?.medecinId || null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

    console.log("Notifications brutes depuis Prisma :", notifications);
    console.log("Notifications formatées renvoyées :", formattedNotifications);

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
    console.error("Erreur dans /api/patient/notifications GET :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/patient/notifications POST.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/patient/notifications POST :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      console.log("Rôle non autorisé pour /api/patient/notifications POST :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
    }

    const { patientId, message, type, relatedId }: PostRequestBody = await req.json();
    if (!patientId || !message) {
      return NextResponse.json({ error: "patientId et message sont requis." }, { status: 400 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: "Patient" },
    });
    if (!patient) {
      console.log("Patient non trouvé pour patientId :", patientId);
      return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
    }

    let notificationData: NotificationCreateInput = {
      patientId,
      medecinId: userId,
      message,
      date: new Date(),
      read: false,
      type: type as "appointment" | "consultation" | "result" | "accessRequest" || "accessRequest",
      relatedId,
    };

    // Assurer que relatedId est défini pour les notifications de type accessRequest
    if (notificationData.type === "accessRequest" && !relatedId) {
      const accessRequest = await prisma.accessRequest.create({
        data: {
          medecinId: userId,
          patientId,
          status: "En attente",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      notificationData = { ...notificationData, relatedId: accessRequest.id };
    } else if (notificationData.type === "accessRequest" && !relatedId) {
      return NextResponse.json({ error: "relatedId est requis pour une notification de type accessRequest." }, { status: 400 });
    }

    const notification = await prisma.notification.create({
      data: notificationData,
    });

    console.log("Notification créée :", { id: notification.id, message: notification.message, type: notification.type, relatedId: notification.relatedId });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Erreur dans /api/patient/notifications POST :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/patient/notifications PATCH.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Patient" },
    });
    if (!user) {
      console.log("Patient non trouvé pour userId :", userId);
      return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
    }

    const { notificationId, action }: { notificationId: string; action: "accept" | "decline" } = await req.json();
    if (!notificationId || !action) {
      return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId, patientId: userId },
      include: { accessRequest: true }, // Inclure accessRequest pour validation
    });
    if (!notification) {
      return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
    }

    let responseMessage = "";
    if (notification.type === "accessRequest" && notification.relatedId) {
      const accessRequest = await prisma.accessRequest.findUnique({
        where: { id: notification.relatedId },
      });
      if (accessRequest) {
        await prisma.accessRequest.update({
          where: { id: accessRequest.id },
          data: { status: action === "accept" ? "Accepté" : "Refusé", updatedAt: new Date() },
        });
        responseMessage = action === "accept" ? "Accepté" : "Refusé";

        if (notification.medecinId) {
  await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/medecin/notifications`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      medecinId: notification.medecinId,
      message: `Le patient a ${responseMessage.toLowerCase()} votre demande d'accès.`,
      type: "accessResponse",
    }),
  });
}

      }
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, message: `${notification.message || `Notification ${notification.type}`} (${responseMessage || "Refusé"})` },
    });

    console.log("Notification mise à jour pour patientId :", userId, { notificationId });

    return NextResponse.json({ message: `Demande ${responseMessage || "Refusé"}.` }, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/patient/notifications PATCH :", {
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
      console.log("Aucun token fourni pour /api/patient/notifications PUT.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/patient/notifications PUT :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé pour /api/patient/notifications PUT :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Patient" },
    });
    if (!user) {
      console.log("Patient non trouvé pour userId :", userId);
      return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
    }

    const updatedNotifications = await prisma.notification.updateMany({
      where: {
        patientId: userId,
        read: false,
      },
      data: { read: true },
    });

    console.log("Notifications marquées comme lues pour patientId :", userId, { count: updatedNotifications.count });

    return NextResponse.json(
      {
        message: "Toutes les notifications ont été marquées comme lues.",
        count: updatedNotifications.count,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur dans /api/patient/notifications PUT :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}