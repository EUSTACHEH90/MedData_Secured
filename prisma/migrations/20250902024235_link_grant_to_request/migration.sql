/*
  Warnings:

  - A unique constraint covering the columns `[accessRequestId]` on the table `AccessGrant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."AccessGrant" ADD COLUMN     "accessRequestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "AccessGrant_accessRequestId_key" ON "public"."AccessGrant"("accessRequestId");
