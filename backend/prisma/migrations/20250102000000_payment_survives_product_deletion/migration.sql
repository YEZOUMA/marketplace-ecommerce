-- Publication payments must survive the deletion of the product they paid
-- to publish (financial/audit record) instead of being cascade-deleted with
-- it. Drop the existing CASCADE foreign key, allow product_id to be NULL,
-- and recreate the foreign key with ON DELETE SET NULL.

-- DropForeignKey
ALTER TABLE "product_publication_payments" DROP CONSTRAINT "product_publication_payments_product_id_fkey";

-- AlterTable
ALTER TABLE "product_publication_payments" ALTER COLUMN "product_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "product_publication_payments" ADD CONSTRAINT "product_publication_payments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
