-- AlterTable
ALTER TABLE "PiggyBank" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "PiggyBank" ADD CONSTRAINT "PiggyBank_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "PiggyBank"("id") ON DELETE SET NULL ON UPDATE CASCADE;
