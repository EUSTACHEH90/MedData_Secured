import { NextResponse } from "next/server";
import { prisma } from '@/lib/prisma';

import { jwtVerify, JWTPayload } from "jose";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("Aucun en-tête Authorization ou format invalide");
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    console.log("Token reçu:", token);

    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
      payload = verified.payload;
      console.log("Payload décodé:", payload);
    } catch (err) {
      console.log("Erreur lors de la vérification du token:", err);
      return NextResponse.json({ message: "Token invalide" }, { status: 401 });
    }

    const id = payload.id as string | undefined;
    const role = payload.role as string | undefined;

    if (!id || !role) {
      console.log("Payload JWT incomplet");
      return NextResponse.json({ message: "Token invalide" }, { status: 401 });
    }

    console.log("ID extrait:", id, "Rôle extrait:", role);

    if (role !== "Medecin") {
      console.log("Rôle invalide:", role);
      return NextResponse.json({ message: "Accès réservé aux médecins" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        gender: true,
        address: true,
        phoneNumber: true,
        socialSecurityNumber: true,
        numeroOrdre: true,
        speciality: true,
        hospital: true,
        createdAt: true,
      },
    });

    if (!user) {
      console.log("Utilisateur non trouvé pour l'ID:", id);
      return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
    }

    console.log("Utilisateur trouvé:", user);
    return NextResponse.json(user);
  } catch (error) {
    console.error("Erreur interne:", error);
    return NextResponse.json({ message: "Erreur interne serveur" }, { status: 500 });
  }
}



// import { NextResponse } from "next/server";
// import prisma from "@/lib/prisma";
// import { jwtVerify } from "jose";
// import { MedicalRecord, AccessRequest } from "@prisma/client";

// const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

// export async function GET(req: Request) {
//   try {
//     const authHeader = req.headers.get("authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
//     }

//     const token = authHeader.split(" ")[1];
//     const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] });
//     const { id, role } = payload as { id: string; role: string };

//     if (role !== "Medecin") {
//       return NextResponse.json({ message: "Accès réservé aux médecins" }, { status: 403 });
//     }

//     const user = await prisma.user.findUnique({
//       where: { id },
//       include: {
//         medicalRecords: { take: 10 },
//         authoredRecords: { take: 10 },
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ message: "Utilisateur introuvable" }, { status: 404 });
//     }

//     const patients = await Promise.all(
//       user.medicalRecords.map(async (record: MedicalRecord) => {
//         const patient = await prisma.user.findUnique({
//           where: { id: record.patientId },
//           select: { firstName: true, lastName: true, dateOfBirth: true },
//         });
//         return {
//           id: record.patientId,
//           firstName: patient?.firstName || "",
//           lastName: patient?.lastName || "",
//           birthDate: patient?.dateOfBirth ? patient.dateOfBirth.toISOString().split("T")[0] : "",
//           dossier: record.content || "",
//         };
//       })
//     );

//     const accessRequests = await prisma.accessRequest.findMany({
//       where: { grantedToId: id, status: "PENDING" },
//       select: { id: true, createdAt: true, status: true, requestedById: true },
//     });

//     const notifications = accessRequests.map((request: AccessRequest) => ({
//       id: request.id,
//       message: `Nouvelle demande d'accès de ${request.requestedById}`,
//       date: request.createdAt.toISOString(),
//       read: false,
//     }));

//     return NextResponse.json({ ...user, patients, notifications });
//   } catch (error) {
//     console.error("Erreur interne:", error);
//     return NextResponse.json({ message: "Erreur interne serveur" }, { status: 500 });
//   }
// }
