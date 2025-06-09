// import { NextResponse } from 'next/server';
// import prisma from '@/lib/prisma';
// import { getServerSession } from 'next-auth';
// import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// export async function GET(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session || session.user.role !== 'MEDECIN') {
//       return NextResponse.json(
//         { error: 'Non autorisé' },
//         { status: 401 }
//       );
//     }

//     const patients = await prisma.patient.findMany({
//       select: {
//         id: true,
//         firstName: true,
//         lastName: true,
//         dateOfBirth: true,
//         email: true,
//         lastVisit: true,
//       },
//       orderBy: {
//         lastName: 'asc',
//       },
//     });

//     return NextResponse.json(patients);
//   } catch (error) {
//     console.error('Erreur lors de la récupération des patients:', error);
//     return NextResponse.json(
//       { error: 'Erreur lors de la récupération des patients' },
//       { status: 500 }
//     );
//   }
// }

// export async function POST(request: Request) {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session || session.user.role !== 'MEDECIN') {
//       return NextResponse.json(
//         { error: 'Non autorisé' },
//         { status: 401 }
//       );
//     }

//     const data = await request.json();

//     const patient = await prisma.patient.create({
//       data: {
//         firstName: data.firstName,
//         lastName: data.lastName,
//         dateOfBirth: new Date(data.dateOfBirth),
//         gender: data.gender,
//         address: data.address,
//         phoneNumber: data.phoneNumber,
//         email: data.email,
//         socialSecurityNumber: data.socialSecurityNumber,
//         bloodType: data.bloodType,
//         allergies: data.allergies,
//         medicalHistory: data.medicalHistory,
//         createdBy: session.user.id,
//       },
//     });

//     return NextResponse.json(patient);
//   } catch (error) {
//     console.error('Erreur lors de la création du patient:', error);
//     return NextResponse.json(
//       { error: 'Erreur lors de la création du patient' },
//       { status: 500 }
//     );
//   }
// } 