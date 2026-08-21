-- Reference SQL schema (equivalent to prisma/schema.prisma)
-- Prisma migrations are the source of truth at runtime (see prisma/migrations/).
-- This file is provided for documentation and manual DB review purposes.

CREATE TYPE user_role AS ENUM ('CLIENT', 'VENDEUR', 'ADMIN');
CREATE TYPE product_status AS ENUM ('BROUILLON', 'EN_ATTENTE_PAIEMENT', 'PUBLIE', 'SUSPENDU');
CREATE TYPE payment_provider AS ENUM ('ORANGE_MONEY', 'MOOV_MONEY', 'WAVE', 'SANK_MONEY');
CREATE TYPE payment_status AS ENUM ('EN_ATTENTE', 'REUSSI', 'ECHOUE');
CREATE TYPE order_status AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EXPEDIEE', 'LIVREE', 'ANNULEE');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom             VARCHAR(255) NOT NULL,
    email           VARCHAR(255) UNIQUE NOT NULL,
    telephone       VARCHAR(32),
    mot_de_passe    VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'CLIENT',
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE refresh_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token       VARCHAR(512) UNIQUE NOT NULL,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    revoked     BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);

CREATE TABLE categories (
    id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE products (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendeur_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nom             VARCHAR(255) NOT NULL,
    description     TEXT NOT NULL,
    prix            DECIMAL(12,2) NOT NULL CHECK (prix >= 0),
    stock           INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    categorie_id    UUID REFERENCES categories(id),
    statut          product_status NOT NULL DEFAULT 'BROUILLON',
    date_creation   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_products_vendeur_id ON products(vendeur_id);
CREATE INDEX idx_products_categorie_id ON products(categorie_id);
CREATE INDEX idx_products_statut ON products(statut);
CREATE INDEX idx_products_nom ON products(nom);

CREATE TABLE product_images (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    url         TEXT NOT NULL,
    ordre       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_images_product_id ON product_images(product_id);

CREATE TABLE product_publication_payments (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id              UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendeur_id              UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    montant                 DECIMAL(12,2) NOT NULL CHECK (montant >= 0),
    devise                  VARCHAR(8) NOT NULL DEFAULT 'XOF',
    prestataire             payment_provider NOT NULL,
    reference_transaction   VARCHAR(255) UNIQUE NOT NULL,
    statut                  payment_status NOT NULL DEFAULT 'EN_ATTENTE',
    date_creation           TIMESTAMPTZ NOT NULL DEFAULT now(),
    date_confirmation       TIMESTAMPTZ,
    metadata                JSONB
);
CREATE INDEX idx_ppp_product_id ON product_publication_payments(product_id);
CREATE INDEX idx_ppp_vendeur_id ON product_publication_payments(vendeur_id);
CREATE INDEX idx_ppp_statut ON product_publication_payments(statut);
CREATE INDEX idx_ppp_reference ON product_publication_payments(reference_transaction);

-- No payment table for orders: settlement happens outside the application.
CREATE TABLE orders (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    statut              order_status NOT NULL DEFAULT 'EN_ATTENTE',
    total               DECIMAL(12,2) NOT NULL CHECK (total >= 0),
    adresse_livraison   TEXT NOT NULL,
    notes               TEXT,
    date_creation       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_orders_client_id ON orders(client_id);
CREATE INDEX idx_orders_statut ON orders(statut);

CREATE TABLE order_items (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id      UUID NOT NULL REFERENCES products(id),
    quantite        INTEGER NOT NULL CHECK (quantite > 0),
    prix_unitaire   DECIMAL(12,2) NOT NULL CHECK (prix_unitaire >= 0)
);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
