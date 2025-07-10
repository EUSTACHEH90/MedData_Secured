// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";

// const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// export async function GET(req: Request) {
//   try {
//     const token = req.headers.get("authorization")?.replace("Bearer ", "");
//     if (!token) {
//       return NextResponse.json({ message: "Token manquant." }, { status: 401 });
//     }

//     const { payload } = await jwtVerify(token, JWT_SECRET);
//     if (payload.role !== "Patient") {
//       return NextResponse.json({ message: "Accès interdit." }, { status: 403 });
//     }

//     const results = await prisma.result.findMany({
//       where: { patientId: payload.id as string },
//       select: {
//         id: true,
//         type: true,
//         date: true,
//         description: true,
//         fileUrl: true,
//         isShared: true,
//         sharedWith: { select: { id: true, firstName: true, lastName: true } },
//         createdBy: { select: { id: true, firstName: true, lastName: true } }, // Ajout du médecin créateur
//       },
//       orderBy: { date: "desc" },
//     });

//     return NextResponse.json(results);
//   } catch (err) {
//     console.error("Erreur lors de la récupération des résultats :", err);
//     return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
//   }
// }

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
  try {
    const token = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      console.log("Token manquant à 06:47 PM GMT, 08/07/2025");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "Patient") {
      console.log("Rôle invalide pour userId:", payload.id, "à 06:47 PM GMT, 08/07/2025");
      return NextResponse.json({ message: "Accès interdit." }, { status: 403 });
    }

    const patientId = payload.id as string;
    console.log("Recherche de résultats pour patientId:", patientId, "à 06:47 PM GMT, 08/07/2025");

    const results = await prisma.result.findMany({
      where: { patientId },
      select: {
        id: true,
        type: true,
        date: true,
        description: true,
        fileUrl: true,
        isShared: true,
        sharedWith: { select: { id: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { date: "desc" },
    });

    console.log("Résultats trouvés:", results, "à 06:47 PM GMT, 08/07/2025");
    if (!results || results.length === 0) {
      console.log("Aucun résultat trouvé pour patientId:", patientId, "à 06:47 PM GMT, 08/07/2025");
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error("Erreur lors de la récupération des résultats à 06:47 PM GMT, 08/07/2025 :", err);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}