
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
//   type: "appointment" | "consultation" | "result" | "accessRequest" ;
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
//   accessRequest: {
//     id: string;
//     medecinId: string;
//     // Ajoute d'autres champs si nécessaires (ex: patientId, status, etc.)
//   } | null;
// }

// interface PostRequestBody {
//   patientId: string;
//   message: string;
//   type?: string;
//   relatedId?: string;
//   target?: string;
// }

// interface NotificationCreateInput {
//   patientId: string;
//   medecinId: string;
//   message: string;
//   date: Date;
//   read: boolean;
//   type: "appointment" | "consultation" | "result" | "accessRequest" | "accessResponse";
//   relatedId?: string | null;
//   target: string;
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

//     const where = { patientId: userId, target: "Patient",...(unreadOnly && { read: false }) };
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
//       relatedId: n.relatedId,
//       medecinId: n.accessRequest?.medecinId || null,
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

//     const { patientId, message, type, relatedId, target }: PostRequestBody = await req.json();
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

//     // Validation stricte du type
//     const validTypes = ["appointment", "consultation", "result", "accessRequest", "accessResponse"] as const;
//     type ValidType = typeof validTypes[number];

//     let validatedType: ValidType;
//     if (type && validTypes.includes(type as ValidType)) {
//       validatedType = type as ValidType;
//     } else {
//       // Lancer une erreur si le type est manquant ou invalide
//       console.error("Erreur : le champ 'type' est requis et doit être l'un de : appointment, consultation, result, accessRequest, accessResponse", { patientId, message });
//       return NextResponse.json(
//         { error: "Le champ 'type' est requis et doit être l'un de : appointment, consultation, result, accessRequest, accessResponse" },
//         { status: 400 }
//       );
//     }

//     let notificationData: NotificationCreateInput = {
//       patientId,
//       medecinId: userId,
//       message,
//       date: new Date(),
//       read: false,
//       type: validatedType,
//       relatedId,
//       target: target || "Patient", // Utilise la valeur fournie ou "Patient" par défaut
//     };

//     let accessRequest = null;
//     if (validatedType === "accessRequest" && !relatedId) {
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
//     } else if (validatedType === "accessRequest" && !relatedId) {
//       return NextResponse.json({ error: "relatedId est requis pour une notification de type accessRequest si non généré." }, { status: 400 });
//     }

//     const notification = await prisma.notification.create({
//       data: notificationData,
//     });

//     console.log("Notification créée :", { id: notification.id, message: notification.message, type: notification.type, relatedId: notification.relatedId, target: notification.target });

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
//       include: { accessRequest: true }, // Inclure accessRequest pour validation
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

// //         if (notification.medecinId) {
// //   await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/medecin/notifications`, {
// //     method: "POST",
// //     headers: {
// //       "Content-Type": "application/json",
// //     },
// //     body: JSON.stringify({
// //       medecinId: notification.medecinId,
// //       message: `Le patient a ${responseMessage.toLowerCase()} votre demande d'accès.`,
// //       type: "accessResponse",
// //       target: "Medecin",
// //     }),
// //   });
// // }
//           // ✅ À AJOUTER À LA PLACE
// if (notification.medecinId) {
//   // (optionnel) récupérer le nom du patient pour le message
//   const p = await prisma.user.findUnique({
//     where: { id: userId },
//     select: { firstName: true, lastName: true },
//   });

//   await prisma.notification.create({
//     data: {
//       medecinId: notification.medecinId,        // ← le destinataire
//       patientId: userId,                         // ← le patient qui répond
//       message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a ${responseMessage.toLowerCase()} votre demande d'accès.`,
//       date: new Date(),
//       read: false,
//       type: "accessResponse",                    // ← réponse d’accès
//       target: "Medecin",                         // ← IMPORTANT: côté médecin
//       relatedId: notification.relatedId,         // ← FK vers AccessRequest.id
//     },
//   });
// }
  

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


// import { NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import prisma from "@/lib/prisma";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// // ----- Types -----
// type AllowedPatientType = "appointment" | "consultation" | "result" | "accessRequest" | "accessResponse";

// interface NotificationDTO {
//   id: string;
//   message: string;
//   date: string;
//   read: boolean;
//   type: AllowedPatientType;
//   createdAt: string;
//   updatedAt: string;
//   relatedId: string | null;
//   medecinId: string | null;
// }

// interface NotificationFromPrisma {
//   id: string;
//   message: string | null;
//   date: Date;
//   read: boolean;
//   type: string;
//   relatedId: string | null;
//   createdAt: Date;
//   updatedAt: Date;
//   patientId: string | null;
//   medecinId: string | null;
//   accessRequest: {
//     id: string;
//     medecinId: string | null;
//   } | null;
// }

// interface PostRequestBody {
//   patientId: string;
//   message: string;
//   type: AllowedPatientType;
//   relatedId?: string | null;
//   target?: "Patient" | "Medecin";
// }

// interface NotificationCreateInput {
//   patientId: string;
//   medecinId: string;
//   message: string;
//   date: Date;
//   read: boolean;
//   type: AllowedPatientType;
//   relatedId?: string | null;
//   target: "Patient" | "Medecin";
// }

// // ----- GET -----
// export async function GET(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload: any;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch {
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || role !== "Patient") {
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
//     }

//     const url = new URL(req.url);
//     const page = parseInt(url.searchParams.get("page") || "1", 10);
//     const limit = parseInt(url.searchParams.get("limit") || "10", 10);
//     const unreadOnly = url.searchParams.get("unreadOnly") === "true";
//     const skip = (page - 1) * limit;

//     const where = { patientId: userId, target: "Patient", ...(unreadOnly ? { read: false } : {}) };

//     const notifications = (await prisma.notification.findMany({
//       where,
//       orderBy: { date: "desc" },
//       skip,
//       take: limit,
//       include: { accessRequest: { select: { id: true, medecinId: true } } },
//     })) as unknown as NotificationFromPrisma[];

//     const [totalNotifications, unreadCount] = await Promise.all([
//       prisma.notification.count({ where }),
//       prisma.notification.count({ where: { patientId: userId, target: "Patient", read: false } }),
//     ]);

//     const formatted: NotificationDTO[] = notifications.map((n) => ({
//       id: n.id,
//       message: n.message || `Notification ${n.type} sans message`,
//       date: n.date.toISOString(),
//       read: n.read,
//       type: (n.type as AllowedPatientType) ?? "result",
//       relatedId: n.relatedId,
//       medecinId: n.medecinId ?? n.accessRequest?.medecinId ?? null,
//       createdAt: n.createdAt.toISOString(),
//       updatedAt: n.updatedAt.toISOString(),
//     }));

//     return NextResponse.json(
//       {
//         notifications: formatted,
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
//     console.error("Erreur GET /api/patient/notifications :", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération des notifications." },
//       { status: 500 }
//     );
//   }
// }

// // ----- POST (médecin → patient) -----
// export async function POST(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload: any;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch {
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const medecinId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!medecinId || role !== "Medecin") {
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
//     }

//     const { patientId, message, type, relatedId, target }: PostRequestBody = await req.json();
//     if (!patientId || !message || !type) {
//       return NextResponse.json({ error: "patientId, message et type sont requis." }, { status: 400 });
//     }

//     if (!["appointment", "consultation", "result", "accessRequest", "accessResponse"].includes(type)) {
//       return NextResponse.json(
//         { error: "type invalide. Autorisés: appointment, consultation, result, accessRequest, accessResponse" },
//         { status: 400 }
//       );
//     }

//     const patient = await prisma.user.findUnique({ where: { id: patientId, role: "Patient" } });
//     if (!patient) {
//       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
//     }

//     const data: NotificationCreateInput = {
//       patientId,
//       medecinId,
//       message,
//       date: new Date(),
//       read: false,
//       type: type as AllowedPatientType,
//       relatedId: relatedId ?? null,
//       target: target === "Medecin" ? "Medecin" : "Patient",
//     };

//     // AccessRequest: créer si pas fourni, ou valider s'il est fourni
//     if (data.type === "accessRequest") {
//       if (data.relatedId) {
//         const ar = await prisma.accessRequest.findUnique({ where: { id: data.relatedId } });
//         if (!ar) {
//           return NextResponse.json({ error: "AccessRequest inexistant pour relatedId fourni." }, { status: 404 });
//         }
//       } else {
//         const ar = await prisma.accessRequest.create({
//           data: {
//             medecinId,
//             patientId,
//             status: "En attente",
//             createdAt: new Date(),
//             updatedAt: new Date(),
//           },
//         });
//         data.relatedId = ar.id;
//       }
//     }

//     const notification = await prisma.notification.create({ data });
//     return NextResponse.json(notification, { status: 201 });
//   } catch (error) {
//     console.error("Erreur POST /api/patient/notifications :", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la création de la notification." },
//       { status: 500 }
//     );
//   }
// }

// // ----- PATCH (patient répond à une accessRequest) -----
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

//     let payload: any;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/patient/notifications PATCH :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || role !== "Patient") {
//       console.log("Rôle non autorisé pour /api/patient/notifications PATCH :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent mettre à jour leurs notifications." }, { status: 403 });
//     }

//     const { notificationId, action } = (await req.json()) as { notificationId: string; action: "accept" | "decline" };
//     if (!notificationId || !action) {
//       return NextResponse.json({ error: "notificationId et action sont requis." }, { status: 400 });
//     }

//     // ✅ findFirst (et pas findUnique avec champs non-uniques)
//     const notif = await prisma.notification.findFirst({
//       where: { id: notificationId, patientId: userId, target: "Patient" },
//       include: { accessRequest: true },
//     });
//     if (!notif) {
//       return NextResponse.json({ error: "Notification non trouvée." }, { status: 404 });
//     }
//     if (notif.type !== "accessRequest") {
//       return NextResponse.json({ error: "Cette notification n'est pas une demande d'accès." }, { status: 422 });
//     }
//     if (!notif.relatedId || !notif.accessRequest) {
//       return NextResponse.json({ error: "La notification n'est pas liée à une AccessRequest valide." }, { status: 422 });
//     }

//     // Détermine le statut & message
//     const responseLabel = action === "accept" ? "Accepté" : "Refusé";

//     // On récupère (ou vérifie) le medecinId : priorité à la notif, sinon l'AccessRequest
//     const medecinId = notif.medecinId ?? notif.accessRequest.medecinId;
//     if (!medecinId) {
//       return NextResponse.json({ error: "Médecin introuvable pour cette demande d'accès." }, { status: 422 });
//     }

//     // (optionnel) nom du patient pour personnaliser le message
//     const p = await prisma.user.findUnique({
//       where: { id: userId },
//       select: { firstName: true, lastName: true },
//     });

//     // 🔒 Tout faire en transaction pour éviter les états partiels
//     await prisma.$transaction([
//       // 1) Mettre à jour le statut de la demande d'accès
//       prisma.accessRequest.update({
//         where: { id: notif.relatedId },
//         data: { status: responseLabel, updatedAt: new Date() },
//       }),

//       // 2) Notifier le médecin — **idempotent** grâce à l'UPsert sur (relatedId, type, target)
//       prisma.notification.upsert({
//         where: {
//           // nécessite: @@unique([relatedId, type, target], name: "relatedId_type_target")
//           relatedId_type_target: {
//             relatedId: notif.relatedId,
//             type: "accessResponse",
//             target: "Medecin",
//           },
//         },
//         create: {
//           medecinId,
//           patientId: userId,
//           message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a ${responseLabel.toLowerCase()} votre demande d'accès.`,
//           date: new Date(),
//           read: false,
//           type: "accessResponse",
//           target: "Medecin",
//           relatedId: notif.relatedId,
//         },
//         update: {
//           message: `Le patient ${p?.firstName || "Inconnu"} ${p?.lastName || ""} a ${responseLabel.toLowerCase()} votre demande d'accès.`,
//           read: false,
//           date: new Date(),
//           // on peut aussi réaffecter medecinId au cas où
//           medecinId,
//         },
//       }),

//       // 3) Marquer la notification du patient comme lue et annotée (Accepté/Refusé)
//       prisma.notification.update({
//         where: { id: notif.id },
//         data: {
//           read: true,
//           message: `${notif.message || `Notification ${notif.type}`} (${responseLabel})`,
//         },
//       }),
//     ]);

//     console.log("PATCH /api/patient/notifications OK", { notificationId, userId, action, relatedId: notif.relatedId });

//     return NextResponse.json({ message: `Demande ${responseLabel}.` }, { status: 200 });
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


// // ----- PUT (tout marquer comme lu côté patient) -----
// export async function PUT(req: Request) {
//   try {
//     if (!JWT_SECRET) {
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
//     if (!userId || role !== "Patient") {
//       return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
//     }

//     const updated = await prisma.notification.updateMany({
//       where: { patientId: userId, target: "Patient", read: false },
//       data: { read: true },
//     });

//     return NextResponse.json(
//       { message: "Toutes les notifications ont été marquées comme lues.", count: updated.count },
//       { status: 200 }
//     );
//   } catch (error) {
//     console.error("Erreur PUT /api/patient/notifications :", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour des notifications." },
//       { status: 500 }
//     );
//   }
// }


// app/api/patient/notifications/route.ts
// This is the static route for GET (list), POST (create), PUT (bulk read).
// No changes needed here, as it's correct. The 404 was on [notificationId], so see below.

import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import prisma from "@/lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

// ----- Types -----
// (unchanged, kept for completeness)
type AllowedPatientType = "appointment" | "consultation" | "result" | "accessRequest" | "accessResponse";

interface NotificationDTO {
  id: string;
  message: string;
  date: string;
  read: boolean;
  type: AllowedPatientType;
  createdAt: string;
  updatedAt: string;
  relatedId: string | null;
  medecinId: string | null;
}

interface NotificationFromPrisma {
  id: string;
  message: string | null;
  date: Date;
  read: boolean;
  type: string;
  relatedId: string | null;
  createdAt: Date;
  updatedAt: Date;
  patientId: string | null;
  medecinId: string | null;
  accessRequest: {
    id: string;
    medecinId: string | null;
  } | null;
}

interface PostRequestBody {
  patientId: string;
  message: string;
  type: AllowedPatientType;
  relatedId?: string | null;
  target?: "Patient" | "Medecin";
}

interface NotificationCreateInput {
  patientId: string;
  medecinId: string;
  message: string;
  date: Date;
  read: boolean;
  type: AllowedPatientType;
  relatedId?: string | null;
  target: "Patient" | "Medecin";
}

// ----- GET -----
// (unchanged)

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
    if (!userId || role !== "Patient") {
      return NextResponse.json({ error: "Accès non autorisé. Seuls les patients peuvent voir leurs notifications." }, { status: 403 });
    }

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") || "1", 10);
    const limit = parseInt(url.searchParams.get("limit") || "10", 10);
    const unreadOnly = url.searchParams.get("unreadOnly") === "true";
    const skip = (page - 1) * limit;

    const where = { patientId: userId, target: "Patient", ...(unreadOnly ? { read: false } : {}) };

    const notifications = (await prisma.notification.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { accessRequest: { select: { id: true, medecinId: true } } },
    })) as unknown as NotificationFromPrisma[];

    const [totalNotifications, unreadCount] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { patientId: userId, target: "Patient", read: false } }),
    ]);

    const formatted: NotificationDTO[] = notifications.map((n) => ({
      id: n.id,
      message: n.message || `Notification ${n.type} sans message`,
      date: n.date.toISOString(),
      read: n.read,
      type: (n.type as AllowedPatientType) ?? "result",
      relatedId: n.relatedId,
      medecinId: n.medecinId ?? n.accessRequest?.medecinId ?? null,
      createdAt: n.createdAt.toISOString(),
      updatedAt: n.updatedAt.toISOString(),
    }));

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
    console.error("Erreur GET /api/patient/notifications :", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des notifications." },
      { status: 500 }
    );
  }
}

// ----- POST -----
// (unchanged, but added validation for type and target)

export async function POST(req: Request) {
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

    const medecinId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!medecinId || role !== "Medecin") {
      return NextResponse.json({ error: "Accès non autorisé. Seuls les médecins peuvent envoyer des notifications." }, { status: 403 });
    }

    const { patientId, message, type, relatedId, target }: PostRequestBody = await req.json();
    if (!patientId || !message || !type) {
      return NextResponse.json({ error: "patientId, message et type sont requis." }, { status: 400 });
    }

    if (!["appointment", "consultation", "result", "accessRequest", "accessResponse"].includes(type)) {
      return NextResponse.json(
        { error: "type invalide. Autorisés: appointment, consultation, result, accessRequest, accessResponse" },
        { status: 400 }
      );
    }

    const patient = await prisma.user.findUnique({ where: { id: patientId, role: "Patient" } });
    if (!patient) {
      return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
    }

    const data: NotificationCreateInput = {
      patientId,
      medecinId,
      message,
      date: new Date(),
      read: false,
      type: type as AllowedPatientType,
      relatedId: relatedId ?? null,
      target: target === "Medecin" ? "Medecin" : "Patient",
    };

    // AccessRequest: créer si pas fourni, ou valider s'il est fourni
    if (data.type === "accessRequest") {
      if (data.relatedId) {
        const ar = await prisma.accessRequest.findUnique({ where: { id: data.relatedId } });
        if (!ar) {
          return NextResponse.json({ error: "AccessRequest inexistant pour relatedId fourni." }, { status: 404 });
        }
      } else {
        const ar = await prisma.accessRequest.create({
          data: {
            medecinId,
            patientId,
            status: "En attente",
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        data.relatedId = ar.id;
      }
    }

    const notification = await prisma.notification.create({ data });
    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/patient/notifications :", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de la notification." },
      { status: 500 }
    );
  }
}

// ----- PUT -----
// (unchanged)

export async function PUT(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || role !== "Patient") {
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const updated = await prisma.notification.updateMany({
      where: { patientId: userId, target: "Patient", read: false },
      data: { read: true },
    });

    return NextResponse.json(
      { message: "Toutes les notifications ont été marquées comme lues.", count: updated.count },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur PUT /api/patient/notifications :", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des notifications." },
      { status: 500 }
    );
  }
}