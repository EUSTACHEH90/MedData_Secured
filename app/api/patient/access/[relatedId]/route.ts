

// // import { NextRequest, NextResponse } from "next/server";
// // import { getServerSession } from "next-auth";
// // import prisma from "@/lib/prisma";

// // export async function POST(req: NextRequest, { params }: { params: { relatedId: string } }) {
// //   const session = await getServerSession();
// //   if (!session || !session.user?.id) {
// //     return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
// //   }

// //   const { approve } = await req.json();
// //   const patientId = session.user.id; // Now TypeScript recognizes id
// //   const doctorId = params.relatedId;

// //   try {
// //     if (approve) {
// //       await prisma.patient.update({
// //         where: { id: patientId },
// //         data: {
// //           authorizedDoctors: {
// //             connect: { id: doctorId },
// //           },
// //         },
// //       });

// //       await prisma.notification.update({
// //         where: { id: doctorId }, // Adjust based on your schema
// //         data: { read: true },
// //       });

// //       return NextResponse.json({ success: true, message: "Accès approuvé" }, { status: 200 });
// //     } else {
// //       await prisma.notification.update({
// //         where: { id: doctorId },
// //         data: { read: true },
// //       });
// //       return NextResponse.json({ success: false, message: "Accès refusé" }, { status: 200 });
// //     }
// //   } catch (error) {
// //     console.error("Erreur dans /api/patient/access:", error);
// //     return NextResponse.json(
// //       { error: "Erreur lors de la mise à jour de l'accès", details: error instanceof Error ? error.message : "Erreur inconnue" },
// //       { status: 500 }
// //     );
// //   }
// // }


// import { NextRequest, NextResponse } from "next/server";
// import { getServerSession } from "next-auth";
// import prisma from "@/lib/prisma";

// export async function POST(req: NextRequest, { params }: { params: { relatedId: string } }) {
//   const session = await getServerSession();
//   if (!session || !session.user?.id) {
//     return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
//   }

//   const { approve } = await req.json();
//   const patientId = session.user.id;
//   const accessRequestId = params.relatedId;

//   try {
//     // Vérifier si la demande d'accès existe et appartient au patient
//     const accessRequest = await prisma.accessRequest.findUnique({
//       where: { id: accessRequestId, patientId },
//     });

//     if (!accessRequest) {
//       return NextResponse.json({ error: "Demande d'accès non trouvée ou non autorisée" }, { status: 404 });
//     }

//     if (approve) {
//       // Mettre à jour la demande d'accès comme acceptée
//       await prisma.accessRequest.update({
//         where: { id: accessRequestId },
//         data: { status: "Accepté", updatedAt: new Date() },
//       });

//       // Mettre à jour la notification associée
//       const notification = await prisma.notification.findFirst({
//         where: { relatedId: accessRequestId, patientId },
//       });

//       if (notification) {
//         await prisma.notification.update({
//           where: { id: notification.id },
//           data: { read: true, message: `${notification.message || "Demande"} (Accepté)` },
//         });
//       }

//       // Optionnel : Connecter le médecin (si schéma modifié pour authorizedDoctors)
//       // await prisma.user.update({
//       //   where: { id: patientId },
//       //   data: { authorizedDoctors: { connect: { id: accessRequest.medecinId } } },
//       // });

//       return NextResponse.json({ success: true, message: "Accès approuvé" }, { status: 200 });
//     } else {
//       await prisma.accessRequest.update({
//         where: { id: accessRequestId },
//         data: { status: "Refusé", updatedAt: new Date() },
//       });

//       const notification = await prisma.notification.findFirst({
//         where: { relatedId: accessRequestId, patientId },
//       });

//       if (notification) {
//         await prisma.notification.update({
//           where: { id: notification.id },
//           data: { read: true, message: `${notification.message || "Demande"} (Refusé)` },
//         });
//       }

//       return NextResponse.json({ success: false, message: "Accès refusé" }, { status: 200 });
//     }
//   } catch (error) {
//     console.error("Erreur dans /api/patient/access:", error);
//     return NextResponse.json(
//       { error: "Erreur lors de la mise à jour de l'accès", details: error instanceof Error ? error.message : "Erreur inconnue" },
//       { status: 500 }
//     );
//   }
// }


import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { relatedId: string } }) {
  const session = await getServerSession();
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { approve } = await req.json();
  const patientId = session.user.id;
  const accessRequestId = params.relatedId;

  try {
    // Vérifier si la demande d'accès existe et appartient au patient
    const accessRequest = await prisma.accessRequest.findUnique({
      where: { id: accessRequestId, patientId },
      include: { medecin: true }, // Inclure les détails du médecin
    });

    if (!accessRequest) {
      return NextResponse.json({ error: "Demande d'accès non trouvée ou non autorisée" }, { status: 404 });
    }

    if (approve) {
      // Mettre à jour la demande d'accès comme acceptée
      await prisma.accessRequest.update({
        where: { id: accessRequestId },
        data: { status: "Accepté", updatedAt: new Date() },
      });

      // Mettre à jour la notification associée
      const notification = await prisma.notification.findFirst({
        where: { relatedId: accessRequestId, patientId },
      });

      if (notification) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { read: true, message: `${notification.message || "Demande"} (Accepté)` },
        });
      }

      // Accorder l'accès en partageant les résultats avec le médecin
      await prisma.result.updateMany({
        where: { patientId },
        data: { isShared: true, sharedWithId: accessRequest.medecinId },
      });

      // Envoyer une notification au médecin
      const token = req.headers.get("authorization")?.split(" ")[1]; // Extraire le token si disponible
      if (token) {
        await fetch(`${process.env.API_URL}/api/medecin/notifications/${accessRequest.medecinId}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: `${session.user.name || "Patient"} a approuvé votre demande d'accès. Vous pouvez maintenant consulter les dossiers médicaux.`,
            patientId,
            accessGranted: true,
          }),
        });
      }

      return NextResponse.json({ success: true, message: "Accès approuvé" }, { status: 200 });
    } else {
      await prisma.accessRequest.update({
        where: { id: accessRequestId },
        data: { status: "Refusé", updatedAt: new Date() },
      });

      const notification = await prisma.notification.findFirst({
        where: { relatedId: accessRequestId, patientId },
      });

      if (notification) {
        await prisma.notification.update({
          where: { id: notification.id },
          data: { read: true, message: `${notification.message || "Demande"} (Refusé)` },
        });
      }

      return NextResponse.json({ success: false, message: "Accès refusé" }, { status: 200 });
    }
  } catch (error) {
    console.error("Erreur dans /api/patient/access:", error);
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'accès", details: error instanceof Error ? error.message : "Erreur inconnue" },
      { status: 500 }
    );
  }
}