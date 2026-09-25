-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN "smsHash" TEXT;

-- CreateIndex
CREATE INDEX "Transaction_userId_smsHash_date_idx" ON "Transaction"("userId", "smsHash", "date");
