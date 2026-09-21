-- AlterTable
ALTER TABLE "User" ADD COLUMN "smsTokenHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_smsTokenHash_key" ON "User"("smsTokenHash");
