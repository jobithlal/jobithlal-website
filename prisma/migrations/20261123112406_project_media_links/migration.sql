-- AlterTable
ALTER TABLE "ProjectMedia" ADD COLUMN     "externalThumb" TEXT,
ADD COLUMN     "externalUrl" TEXT,
ALTER COLUMN "assetId" DROP NOT NULL;
