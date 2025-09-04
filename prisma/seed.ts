import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Hash des mots de passe
  const passwordMedecin = await bcrypt.hash("MedecinPass123!", 10);
  const passwordJean = await bcrypt.hash("JeanPass123!", 10);
  const passwordMarie = await bcrypt.hash("MariePass123!", 10);
  const passwordAdmin = await bcrypt.hash("AdminPass123!", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@meddata.com" },
    update: {},
    create: {
      id: "111e4567-e89b-12d3-a456-426614174000",
      email: "admin@meddata.com",
      password: passwordAdmin,
      role: "Admin",
      firstName: "Admin",
      lastName: "System",
    },
  });

  // Médecin
  await prisma.user.upsert({
    where: { email: "aa@gmail.com" },
    update: {},
    create: {
      id: "9848c962-f6e4-416c-aa32-158e7427e429",
      email: "aa@gmail.com",
      password: passwordMedecin,
      role: "Medecin",
      firstName: "Pierre",
      lastName: "Martin",
      gender: "Homme",
      speciality: "Généraliste",
      hospital: "Yalgado",
      phoneNumber: "+33123456789",
      socialSecurityNumber: "123456789012300",
      address: "123 Rue de la Santé, 75001 Paris",
      numeroOrdre: "ORD123456",
    },
  });

  // Patient Jean
  await prisma.user.upsert({
    where: { email: "jean.dupont@gmail.com" },
    update: {},
    create: {
      id: "123e4567-e89b-12d3-a456-426614174000",
      email: "jean.dupont@gmail.com",
      password: passwordJean,
      role: "Patient",
      firstName: "Jean",
      lastName: "Dupont",
      dateOfBirth: new Date("1990-01-01T00:00:00Z"),
      gender: "Homme",
      address: "45 Avenue des Lilas, 75020 Paris",
      phoneNumber: "+33612345678",
      socialSecurityNumber: "123456789012345",
      bloodType: "A+",
      allergies: "Pollen, pénicilline",
      medicalHistory: "Hypertension diagnostiquée en 2020",
      weight: "80kg",
      height: "175cm",
      bloodPressure: { systolic: "130", diastolic: "85" },
      heartRate: "72",
      oxygen: "98%",
      temperature: "36.6°C",
    },
  });

  // Patient Marie
  await prisma.user.upsert({
    where: { email: "marie.leclerc@gmail.com" },
    update: {},
    create: {
      id: "223e4567-e89b-12d3-a456-426614174001",
      email: "marie.leclerc@gmail.com",
      password: passwordMarie,
      role: "Patient",
      firstName: "Marie",
      lastName: "Leclerc",
      dateOfBirth: new Date("1985-03-15T00:00:00Z"),
      gender: "Femme",
      address: "12 Rue des Roses, 69001 Lyon",
      phoneNumber: "+33698765432",
      socialSecurityNumber: "987654321098765",
      bloodType: "O-",
      allergies: "Aucune",
      medicalHistory: "Diabète type 2",
      weight: "65kg",
      height: "160cm",
      bloodPressure: { systolic: "120", diastolic: "80" },
      heartRate: "68",
      oxygen: "97%",
      temperature: "36.8°C",
    },
  });

  // Rendez-vous
  await prisma.rendezVous.createMany({
    data: [
      {
        id: "323e4567-e89b-12d3-a456-426614174002",
        patientId: "123e4567-e89b-12d3-a456-426614174000",
        medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
        date: new Date("2025-06-20T10:00:00Z"),
        location: "Cabinet Médical, 123 Rue de la Santé, 75001 Paris",
        status: "En attente",
        isTeleconsultation: false,
      },
      {
        id: "423e4567-e89b-12d3-a456-426614174003",
        patientId: "223e4567-e89b-12d3-a456-426614174001",
        medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
        date: new Date("2025-06-21T14:30:00Z"),
        location: "Téléconsultation",
        status: "Confirmé",
        isTeleconsultation: true,
      },
    ],
  });

  // Consultations
  await prisma.consultation.createMany({
    data: [
      {
        id: "523e4567-e89b-12d3-a456-426614174004",
        patientId: "123e4567-e89b-12d3-a456-426614174000",
        medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
        date: new Date("2025-06-15T14:00:00Z"),
        summary: "Consultation pour douleur thoracique. Prescription d'examens.",
      },
      {
        id: "623e4567-e89b-12d3-a456-426614174005",
        patientId: "223e4567-e89b-12d3-a456-426614174001",
        medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
        date: new Date("2025-06-16T09:00:00Z"),
        summary: "Suivi diabète type 2. Ajustement du traitement.",
      },
    ],
  });

  // Résultat + Blockchain
  await prisma.result.create({
    data: {
      id: "723e4567-e89b-12d3-a456-426614174006",
      patientId: "123e4567-e89b-12d3-a456-426614174000",
      createdById: "9848c962-f6e4-416c-aa32-158e7427e429",
      type: "Analyse sanguine",
      date: new Date("2025-06-16T09:00:00Z"),
      description: "Résultats normaux, légère anémie.",
      fileUrl: "https://example.com/result_jean.pdf",
      isShared: false,
      blockchainTransactions: {
        create: {
          transactionHash: "0xabc123456789abcdef",
        },
      },
    },
  });

  await prisma.result.create({
    data: {
      id: "823e4567-e89b-12d3-a456-426614174007",
      patientId: "223e4567-e89b-12d3-a456-426614174001",
      createdById: "9848c962-f6e4-416c-aa32-158e7427e429",
      type: "Échographie",
      date: new Date("2025-06-17T11:00:00Z"),
      description: "Échographie normale.",
      fileUrl: "https://example.com/result_marie.pdf",
      isShared: true,
      sharedWithId: "9848c962-f6e4-416c-aa32-158e7427e429",
    },
  });

   // Demandes d’accès (AccessRequest)

  await prisma.accessRequest.createMany({
    data: [
      {
        id: "b23e4567-e89b-12d3-a456-426614174010",
        patientId: "123e4567-e89b-12d3-a456-426614174000",
        medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
        status: "En attente",
      },
      {
        id: "c23e4567-e89b-12d3-a456-426614174011",
        patientId: "223e4567-e89b-12d3-a456-426614174001",
        medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
        status: "Accepté",
      },
    ],
  });

  // Notifications
await prisma.notification.createMany({
  data: [
    {
      id: "923e4567-e89b-12d3-a456-426614174008",
      message: "Rappel : Rendez-vous le 20 juin à 10h.",
      date: new Date("2025-06-18T12:00:00Z"),
      read: false,
      patientId: "123e4567-e89b-12d3-a456-426614174000",
      medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
      type: "appointment",
      target: "Patient", // Le patient reçoit un rappel
    },
    {
      id: "a23e4567-e89b-12d3-a456-426614174009",
      message: "Résultats d'échographie disponibles.",
      date: new Date("2025-06-18T15:00:00Z"),
      read: false,
      patientId: "223e4567-e89b-12d3-a456-426614174001",
      medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
      type: "resultAvailable",
      target: "Patient", // La patiente est notifiée que ses résultats sont disponibles
    },
    {
      id: "b23e4567-e89b-12d3-a456-426614174012",
      message: "Nouvelle demande d'accès au dossier médical.",
      date: new Date("2025-06-18T16:00:00Z"),
      read: false,
      patientId: "123e4567-e89b-12d3-a456-426614174000",
      medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
      relatedId: "b23e4567-e89b-12d3-a456-426614174010",
      type: "accessRequest",
      target: "Patient", // Le patient reçoit une demande d’accès
    },
    {
      id: "c23e4567-e89b-12d3-a456-426614174013",
      message: "Le patient Marie Leclerc a accepté votre demande d'accès.",
      date: new Date("2025-06-18T17:00:00Z"),
      read: false,
      patientId: "223e4567-e89b-12d3-a456-426614174001",
      medecinId: "9848c962-f6e4-416c-aa32-158e7427e429",
      relatedId: "c23e4567-e89b-12d3-a456-426614174011",
      type: "accessResponse",
      target: "Medecin", // Le médecin est notifié que sa demande a été acceptée
    }
  ],
});



}

main()
  .then(() => {
    console.log("✅ Seed terminé avec succès !");
  })
  .catch((e) => {
    console.error("❌ Erreur dans le seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
