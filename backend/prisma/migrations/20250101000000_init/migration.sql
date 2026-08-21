-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'VENDEUR', 'ADMIN');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('BROUILLON', 'EN_ATTENTE_PAIEMENT', 'PUBLIE', 'SUSPENDU');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'SANK_MONEY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('EN_ATTENTE', 'REUSSI', 'ECHOUE');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT,
    "mot_de_passe" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "vendeur_id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "prix" DECIMAL(12,2) NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "categorie_id" TEXT,
    "statut" "ProductStatus" NOT NULL DEFAULT 'BROUILLON',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_images" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "product_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_publication_payments" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "vendeur_id" TEXT NOT NULL,
    "montant" DECIMAL(12,2) NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'XOF',
    "prestataire" "PaymentProvider" NOT NULL,
    "reference_transaction" TEXT NOT NULL,
    "statut" "PaymentStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_confirmation" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "product_publication_payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "statut" "OrderStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "total" DECIMAL(12,2) NOT NULL,
    "adresse_livraison" TEXT NOT NULL,
    "notes" TEXT,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prix_unitaire" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "users_email_idx" ON "users"("email");
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");
CREATE INDEX "refresh_tokens_user_id_idx" ON "refresh_tokens"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE INDEX "products_vendeur_id_idx" ON "products"("vendeur_id");
CREATE INDEX "products_categorie_id_idx" ON "products"("categorie_id");
CREATE INDEX "products_statut_idx" ON "products"("statut");
CREATE INDEX "products_nom_idx" ON "products"("nom");

-- CreateIndex
CREATE INDEX "product_images_product_id_idx" ON "product_images"("product_id");

-- CreateIndex
CREATE UNIQUE INDEX "product_publication_payments_reference_transaction_key" ON "product_publication_payments"("reference_transaction");
CREATE INDEX "product_publication_payments_product_id_idx" ON "product_publication_payments"("product_id");
CREATE INDEX "product_publication_payments_vendeur_id_idx" ON "product_publication_payments"("vendeur_id");
CREATE INDEX "product_publication_payments_statut_idx" ON "product_publication_payments"("statut");
CREATE INDEX "product_publication_payments_reference_transaction_idx" ON "product_publication_payments"("reference_transaction");

-- CreateIndex
CREATE INDEX "orders_client_id_idx" ON "orders"("client_id");
CREATE INDEX "orders_statut_idx" ON "orders"("statut");

-- CreateIndex
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");
CREATE INDEX "order_items_product_id_idx" ON "order_items"("product_id");

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_vendeur_id_fkey" FOREIGN KEY ("vendeur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "products" ADD CONSTRAINT "products_categorie_id_fkey" FOREIGN KEY ("categorie_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_images" ADD CONSTRAINT "product_images_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_publication_payments" ADD CONSTRAINT "product_publication_payments_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "product_publication_payments" ADD CONSTRAINT "product_publication_payments_vendeur_id_fkey" FOREIGN KEY ("vendeur_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
