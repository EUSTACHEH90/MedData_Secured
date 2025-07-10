-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "gender" TEXT,
    "address" TEXT,
    "phoneNumber" TEXT,
    "socialSecurityNumber" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "bloodType" TEXT,
    "allergies" TEXT,
    "medicalHistory" TEXT,
    "numeroOrdre" TEXT,
    "speciality" TEXT,
    "hospital" TEXT,
    "weight" TEXT,
    "height" TEXT,
    "bloodPressure" JSONB,
    "heartRate" TEXT,
    "oxygen" TEXT,
    "temperature" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "isTeleconsultation" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RendezVous_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consultation" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consultation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'result',
    "relatedId" TEXT,
    "patientId" TEXT,
    "medecinId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Result" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "fileUrl" TEXT,
    "documentHash" TEXT,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "sharedWithId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Result_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccessRequest" (
    "id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'En attente',
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockchainTransaction" (
    "id" TEXT NOT NULL,
    "relatedResultId" TEXT NOT NULL,
    "transactionHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockchainTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_socialSecurityNumber_key" ON "User"("socialSecurityNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_relatedId_key" ON "Notification"("relatedId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockchainTransaction_relatedResultId_key" ON "BlockchainTransaction"("relatedResultId");

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RendezVous" ADD CONSTRAINT "RendezVous_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consultation" ADD CONSTRAINT "Consultation_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_relatedId_fkey" FOREIGN KEY ("relatedId") REFERENCES "AccessRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Result" ADD CONSTRAINT "Result_sharedWithId_fkey" FOREIGN KEY ("sharedWithId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessRequest" ADD CONSTRAINT "AccessRequest_medecinId_fkey" FOREIGN KEY ("medecinId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockchainTransaction" ADD CONSTRAINT "BlockchainTransaction_relatedResultId_fkey" FOREIGN KEY ("relatedResultId") REFERENCES "Result"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
