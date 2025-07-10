// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";

// const JWT_SECRET = process.env.JWT_SECRET
//   ? new TextEncoder().encode(process.env.JWT_SECRET)
//   : null;

// export async function GET(req: Request) {
//   try {
//     // Vérifier JWT_SECRET
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     // Extraire et valider le token
//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/medecin/results.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     // Vérifier le token
//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/medecin/results :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     // Valider le payload
//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Medecin") {
//       console.log("Rôle non autorisé pour /api/medecin/results :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
//     }

//     // Vérifier l'utilisateur
//     const user = await prisma.user.findUnique({
//       where: { id: userId, role: "Medecin" },
//     });
//     if (!user) {
//       console.log("Médecin non trouvé pour userId :", userId);
//       return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
//     }

//     // Récupérer les résultats partagés avec le médecin
//     const results = await prisma.result.findMany({
//       where: {
//         sharedWithId: userId,
//         isShared: true,
//       },
//       include: {
//         patient: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     console.log("Résultats renvoyés pour medecinId :", userId, { count: results.length });

//     return NextResponse.json(results, { status: 200 });
//   } catch (error) {
//     console.error("Erreur dans /api/medecin/results GET :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la récupération des résultats.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }


import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET
  ? new TextEncoder().encode(process.env.JWT_SECRET)
  : null;

export async function GET(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/medecin/results.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/medecin/results :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      console.log("Rôle non autorisé pour /api/medecin/results :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId, role: "Medecin" },
    });
    if (!user) {
      console.log("Médecin non trouvé pour userId :", userId);
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const results = await prisma.result.findMany({
      where: {
        sharedWithId: userId,
        isShared: true,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    

    console.log("Résultats renvoyés pour medecinId :", userId, { count: results.length });

    return NextResponse.json(results, { status: 200 });
  } catch (error) {
    console.error("Erreur dans /api/medecin/results GET :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la récupération des résultats.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}

// export async function POST(req: Request) {
//   try {
//     if (!JWT_SECRET) {
//       console.error("JWT_SECRET non défini.");
//       return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
//     }

//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
//     if (!token) {
//       console.log("Aucun token fourni pour /api/medecin/results POST.");
//       return NextResponse.json({ error: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = verifiedPayload;
//     } catch (err) {
//       console.error("Erreur de vérification du token pour /api/medecin/results POST :", err);
//       return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = typeof payload.id === "string" ? payload.id : undefined;
//     const role = typeof payload.role === "string" ? payload.role : undefined;
//     if (!userId || !role || role !== "Medecin") {
//       console.log("Rôle non autorisé pour /api/medecin/results POST :", { userId, role });
//       return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
//     }

//     const medecin = await prisma.user.findUnique({
//       where: { id: userId, role: "Medecin" },
//     });
//     if (!medecin) {
//       console.log("Médecin non trouvé pour userId :", userId);
//       return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
//     }

//     const { patientId, type, date, description, fileUrl } = await req.json();
//     if (!patientId || !type || !date) {
//       return NextResponse.json({ error: "patientId, type et date sont requis." }, { status: 400 });
//     }

//     const patient = await prisma.user.findUnique({
//       where: { id: patientId, role: "Patient" },
//     });
//     if (!patient) {
//       return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
//     }

//     const result = await prisma.result.create({
//       data: {
//         patientId,
//         createdById: userId,
//         type,
//         date: new Date(date),
//         description,
//         fileUrl,
//         isShared: false,
//       },
//       include: {
//         patient: {
//           select: {
//             id: true,
//             firstName: true,
//             lastName: true,
//           },
//         },
//       },
//     });

//     await prisma.notification.create({
//       data: {
//         patientId,
//         medecinId: userId,
//         message: `Nouveau résultat disponible (${type}) le ${new Date(date).toLocaleDateString()}`,
//         date: new Date(),
//         read: false,
//         type: "result",
//       },
//     });

//     return NextResponse.json(result, { status: 201 });
//   } catch (error) {
//     console.error("Erreur dans /api/medecin/results POST :", {
//       message: error instanceof Error ? error.message : "Erreur inconnue",
//       stack: error instanceof Error ? error.stack : undefined,
//     });
//     return NextResponse.json(
//       { error: "Erreur lors de la création du résultat.", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET non défini.");
      return NextResponse.json({ error: "Configuration serveur incorrecte." }, { status: 500 });
    }

    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      console.log("Aucun token fourni pour /api/medecin/results POST.");
      return NextResponse.json({ error: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const { payload: verifiedPayload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verifiedPayload;
    } catch (err) {
      console.error("Erreur de vérification du token pour /api/medecin/results POST :", err);
      return NextResponse.json({ error: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = typeof payload.id === "string" ? payload.id : undefined;
    const role = typeof payload.role === "string" ? payload.role : undefined;
    if (!userId || !role || role !== "Medecin") {
      console.log("Rôle non autorisé pour /api/medecin/results POST :", { userId, role });
      return NextResponse.json({ error: "Accès non autorisé." }, { status: 403 });
    }

    const medecin = await prisma.user.findUnique({
      where: { id: userId, role: "Medecin" },
    });
    if (!medecin) {
      console.log("Médecin non trouvé pour userId :", userId);
      return NextResponse.json({ error: "Médecin non trouvé." }, { status: 404 });
    }

    const { patientId, type, date, description, fileUrl } = await req.json();
    if (!patientId || !type || !date) {
      return NextResponse.json({ error: "patientId, type et date sont requis." }, { status: 400 });
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: "Patient" },
    });
    if (!patient) {
      return NextResponse.json({ error: "Patient non trouvé." }, { status: 404 });
    }

    const result = await prisma.result.create({
      data: {
        patientId,
        createdById: userId,
        type,
        date: new Date(date),
        description,
        fileUrl,
        isShared: false,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        patientId,
        medecinId: userId,
        message: `Nouveau résultat disponible (${type}) le ${new Date(date).toLocaleDateString()} par Dr. ${result.createdBy.firstName} ${result.createdBy.lastName}`,
        date: new Date(),
        read: false,
        type: "result",
        relatedId: result.id,
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Erreur dans /api/medecin/results POST :", {
      message: error instanceof Error ? error.message : "Erreur inconnue",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Erreur lors de la création du résultat.", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}