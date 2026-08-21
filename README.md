# Marketplace — Vente de produits divers (multi-vendeurs)

Plateforme e-commerce multi-vendeurs : les vendeurs publient des produits
(publication payante via mobile money), les clients consultent et
commandent (règlement entièrement hors application), un espace admin
supervise l'ensemble.

Voir aussi : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) ·
[docs/API.md](docs/API.md) · [CONTRIBUTING.md](CONTRIBUTING.md)

## Modèle économique

- **Inscription vendeur : gratuite.**
- **Publication d'un produit : payante**, via mobile money (Orange Money,
  Moov Money, Wave, Sank Money). Le produit reste invisible des clients
  (`BROUILLON` / `EN_ATTENTE_PAIEMENT`) tant que le paiement n'est pas
  confirmé par webhook.
- **Paiement des commandes clients : entièrement hors application.** Le
  règlement se fait directement entre client et vendeur/livreur ; l'app se
  limite à capturer articles, quantités et adresse de livraison.

## Stack technique

| Composant | Technologie |
|---|---|
| Frontend | React 18 (Vite) + TailwindCSS |
| Backend | Node.js + Express |
| Base de données | PostgreSQL 16 |
| ORM | Prisma |
| Stockage images | Volume Docker local (défaut) ou MinIO (S3-compatible) |
| Authentification | JWT (access + refresh, rotation) |
| Paiement vendeur | Adapters Orange Money / Moov Money / Wave / Sank Money (mode mock/sandbox par défaut) |
| Conteneurisation | Docker + Docker Compose |
| Reverse proxy | Nginx |
| Tests | Jest + Supertest |
| CI/CD | GitHub Actions (`ci.yml`, `commitlint.yml`, `cd.yml` → GHCR) |

## Démarrage rapide (local, avec Docker)

Prérequis : Docker et Docker Compose.

```bash
git clone https://github.com/yezouma/marketplace-ecommerce.git
cd marketplace-ecommerce
cp .env.example .env
# Éditez .env : changez au minimum les secrets JWT, le mot de passe
# Postgres/MinIO et le mot de passe admin de seed.

docker compose up --build
```

L'application est disponible sur **http://localhost** (Nginx expose le
port `80` par défaut, configurable via `HTTP_PORT` dans `.env`).

- Frontend : http://localhost
- API : http://localhost/api
- Console MinIO (si `STORAGE_MODE=minio`) : http://localhost:9001

Un compte administrateur est créé automatiquement au premier démarrage
(`RUN_SEED_ON_START=true`) avec les identifiants `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` définis dans `.env` — **changez le mot de passe
immédiatement après la première connexion.**

### Paiement mobile money en local

Par défaut, `PAYMENTS_MOCK_MODE=true` : aucune clé API réelle n'est
nécessaire. Le parcours vendeur "publier → payer → webhook → produit
publié" est entièrement testable via un écran de simulation
(`/vendeur/paiement/simuler`). Pour brancher un vrai prestataire,
renseignez ses clés dans `.env` et passez `PAYMENTS_MOCK_MODE=false`
(voir `backend/src/payments/adapters/`).

## Développement local (sans Docker)

```bash
# Base de données : un Postgres local ou via `docker compose up db`

# Backend
cd backend
cp .env.example .env   # ajustez DATABASE_URL si besoin
npm install
npx prisma migrate deploy
node prisma/seed.js     # optionnel : catégories + compte admin
npm run dev              # http://localhost:4000

# Frontend (autre terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

### Tests backend

```bash
cd backend
# Nécessite un Postgres accessible via DATABASE_URL (ex: docker compose up db)
npm test
```

## Déploiement en production

1. Sur le serveur cible : installer Docker + Docker Compose.
2. Cloner le dépôt, créer `.env` à partir de `.env.example` avec des
   secrets forts (`JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`,
   `PAYMENTS_WEBHOOK_SECRET`, mots de passe Postgres/MinIO) et les vraies
   clés API mobile money (`PAYMENTS_MOCK_MODE=false`).
3. `docker compose up -d --build` (ou utiliser directement les images
   publiées par la CD — voir ci-dessous).
4. Mettre Nginx derrière un certificat TLS (Let's Encrypt/Certbot ou un
   load balancer géré) — le `nginx/default.conf` fourni est HTTP simple,
   à adapter pour HTTPS en production.
5. Configurer les webhooks des prestataires mobile money pour pointer vers
   `https://votre-domaine/api/payments/webhook/<PRESTATAIRE>`.

### Déploiement via les images GHCR (CD)

Chaque fusion sur `main` (ou tag `vX.Y.Z`) déclenche `.github/workflows/cd.yml`
qui construit et publie :

- `ghcr.io/<owner>/<repo>-backend:latest` (et `:sha-xxxxxxx`, `:vX.Y.Z`)
- `ghcr.io/<owner>/<repo>-frontend:latest` (idem)

Un serveur de production peut alors simplement faire :

```bash
docker pull ghcr.io/<owner>/<repo>-backend:latest
docker pull ghcr.io/<owner>/<repo>-frontend:latest
docker compose up -d
```

L'étape de déploiement automatique (SSH/Kubernetes) est présente dans
`cd.yml` mais désactivée (`if: false`) tant qu'un serveur cible et ses
secrets ne sont pas définis — voir les commentaires dans le fichier.

## Mise en place du dépôt Git et du pipeline CI/CD

```bash
# Initialiser et pousser (si le dépôt n'existe pas encore côté GitHub)
git init
git add .
git commit -m "chore: initialisation du projet"
git branch -M main
git remote add origin https://github.com/yezouma/marketplace-ecommerce.git
git push -u origin main

# Créer develop
git checkout -b develop
git push -u origin develop
```

Puis configurer la protection de branches (`main`, `develop`) via
`./scripts/setup-branch-protection.sh` ou l'UI GitHub — voir
[CONTRIBUTING.md](CONTRIBUTING.md#configuration-de-la-protection-de-branches-sur-github).

## Critères d'acceptation couverts

- [x] `docker compose up` démarre l'ensemble (frontend, backend, db,
      storage, nginx) et applique les migrations automatiquement.
- [x] Un vendeur crée un produit avec images puis le publie après paiement
      confirmé (mobile money réel ou simulé en sandbox).
- [x] Un client commande un produit publié de bout en bout sans aucune
      étape de paiement dans l'application.
- [x] Les données persistent après redémarrage des conteneurs (volumes
      nommés `postgres-data`, `minio-data`, `uploads-data`).
- [x] `main`/`develop` + PR déclenchant `ci`/`commitlint`, fusion sur
      `main` déclenchant `cd` (publication GHCR).

## Structure du dépôt

```
backend/            API Node.js/Express + Prisma
  src/
    payments/        Adapters mobile money (pattern Adapter)
    controllers/ routes/ services/ middleware/ validators/
  prisma/            schema.prisma, migrations/, seed.js, init.sql
  tests/             Jest + Supertest
frontend/           React + Vite + Tailwind
  src/
    pages/{auth,client,vendor,admin}/
    api/ context/ components/
nginx/              Reverse proxy (point d'entrée unique)
scripts/            setup-branch-protection.sh
docs/               ARCHITECTURE.md, API.md
.github/            workflows CI/CD, CODEOWNERS, templates PR/issues
.husky/             Hooks Git locaux (commit-msg, pre-push)
```
