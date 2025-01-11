-- AlterTable
ALTER TABLE "images" ADD COLUMN     "public_id" TEXT;

-- AlterTable
ALTER TABLE "tournaments" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
