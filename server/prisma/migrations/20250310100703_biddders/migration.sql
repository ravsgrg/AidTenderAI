/*
  Warnings:

  - Added the required column `status` to the `bidders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "bidders" ADD COLUMN     "status" TEXT NOT NULL;
