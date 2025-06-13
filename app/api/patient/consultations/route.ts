// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";

// const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// export async function GET(req: Request) {
//   try {
//     const authHeader = req.headers.get("authorization");
//     const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

//     if (!token) {
//       console.log("Aucun token fourni dans Authorization pour /consultations.");
//       return NextResponse.json({ message: "Token manquant." }, { status: 401 });
//     }

//     let payload;
//     try {
//       const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//       payload = result.payload;
//     } catch (err) {
//       console.log("Token invalide ou expiré pour /consultations :", err);
//       return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
//     }

//     const userId = payload.id as string;
//     const role = payload.role as string;

//     if (!userId || !role || role !== "Patient") {
//       console.log("Rôle non autorisé ou payload invalide pour /consultations :", role);
//       return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
//     }

//     const consultations = await prisma.medicalRecord.findMany({
//       where: { patientId: userId, type: "CONSULTATION" },
//       select: {
//         id: true,
//         createdAt: true,
//         title: true,
//         content: true,
//         doctor: {
//           select: { firstName: true, lastName: true },
//         },
//       },
//     });

//     // Formater les données pour correspondre à l'interface Consultation
//     const formattedConsultations = consultations.map((c) => ({
//       id: c.id,
//       date: c.createdAt.toISOString().split("T")[0],
//       doctorName: `${c.doctor.firstName} ${c.doctor.lastName || ""}`.trim(),
//       summary: c.content,
//       documentHash: null, // À implémenter si hachage Blockchain est ajouté
//     }));

//     console.log("Consultations renvoyées pour userId :", userId, formattedConsultations);
//     return NextResponse.json(formattedConsultations);
//   } catch (error) {
//     console.error("Erreur /api/patient/consultations :", error);
//     return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
//   }
// }


import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

interface ConsultationRecord {
  id: string;
  createdAt: Date;
  title: string | null;
  content: string;
  doctor: {
    firstName: string;
    lastName: string | null;
  };
}

interface Consultation {
  id: string;
  date: string;
  doctorName: string;
  summary: string;
  documentHash: string | null;
}

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      console.log("Aucun token fourni dans Authorization pour /consultations.");
      return NextResponse.json({ message: "Token manquant." }, { status: 401 });
    }

    let payload;
    try {
      const result = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = result.payload;
    } catch (err) {
      console.log("Token invalide ou expiré pour /consultations :", err);
      return NextResponse.json({ message: "Token invalide ou expiré." }, { status: 401 });
    }

    const userId = payload.id as string;
    const role = payload.role as string;

    if (!userId || !role || role !== "Patient") {
      console.log("Rôle non autorisé ou payload invalide pour /consultations :", role);
      return NextResponse.json({ message: "Accès non autorisé." }, { status: 403 });
    }

    const consultations = await prisma.medicalRecord.findMany({
      where: { patientId: userId, type: "CONSULTATION" },
      select: {
        id: true,
        createdAt: true,
        title: true,
        content: true,
        doctor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    // Formater les données pour correspondre à l'interface Consultation
    const formattedConsultations: Consultation[] = consultations.map((c: ConsultationRecord) => ({
      id: c.id,
      date: c.createdAt.toISOString().split("T")[0],
      doctorName: `${c.doctor.firstName} ${c.doctor.lastName || ""}`.trim(),
      summary: c.content,
      documentHash: null, // À implémenter si hachage Blockchain est ajouté
    }));

    console.log("Consultations renvoyées pour userId :", userId, formattedConsultations);
    return NextResponse.json(formattedConsultations);
  } catch (error) {
    console.error("Erreur /api/patient/consultations :", error);
    return NextResponse.json({ message: "Erreur serveur." }, { status: 500 });
  }
}