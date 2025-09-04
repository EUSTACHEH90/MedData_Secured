/*
  Warnings:

  - A unique constraint covering the columns `[relatedId,type,target]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."Notification_relatedId_key";

-- CreateIndex
CREATE INDEX "Notification_relatedId_idx" ON "public"."Notification"("relatedId");

-- CreateIndex
CREATE INDEX "Notification_patientId_target_read_idx" ON "public"."Notification"("patientId", "target", "read");

-- CreateIndex
CREATE INDEX "Notification_medecinId_target_read_idx" ON "public"."Notification"("medecinId", "target", "read");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_relatedId_type_target_key" ON "public"."Notification"("relatedId", "type", "target");
