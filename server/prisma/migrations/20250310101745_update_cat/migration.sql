/*
  Warnings:

  - You are about to drop the column `categoryId` on the `tenders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "tenders" DROP CONSTRAINT "tenders_categoryId_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parent_id" INTEGER;

-- AlterTable
ALTER TABLE "tenders" DROP COLUMN "categoryId";

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
