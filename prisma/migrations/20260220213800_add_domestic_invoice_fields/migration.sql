-- AlterTable
ALTER TABLE "Client" ADD COLUMN "drugLicense" TEXT;
ALTER TABLE "Client" ADD COLUMN "otherLicense" TEXT;

-- AlterTable
ALTER TABLE "Company" ADD COLUMN "fssaiLicense" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN "lrNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "paymentTerms" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "poNumber" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "termsAndConditions" TEXT;
ALTER TABLE "Invoice" ADD COLUMN "transport" TEXT;

-- AlterTable
ALTER TABLE "InvoiceItem" ADD COLUMN "batchNo" TEXT;
ALTER TABLE "InvoiceItem" ADD COLUMN "expDate" DATETIME;
ALTER TABLE "InvoiceItem" ADD COLUMN "mfgDate" DATETIME;
