-- CreateEnum
CREATE TYPE "public"."Scope" AS ENUM ('RESULTS', 'ORDONNANCES', 'TESTS', 'ALL');

-- AlterTable
ALTER TABLE "public"."AccessRequest" ADD COLUMN     "motif" TEXT;

-- CreateTable
CREATE TABLE "public"."AccessGrant" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "medecinId" TEXT NOT NULL,
    "scope" "public"."Scope" NOT NULL,
    "resourceIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "reasonHash" TEXT,
    "onChainKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccessGrant_pkey" PRIMARY KEY ("id")
);
