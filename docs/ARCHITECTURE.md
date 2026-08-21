# Architecture technique

## Vue d'ensemble

```
                         ┌───────────────────────────────┐
                         │            Nginx               │
                         │      (reverse proxy, :80)      │
                         └───────────────┬─────────────────┘
                          /            /api, /uploads      \
                         ▼                  ▼                ▼ (mode minio)
              ┌───────────────────┐  ┌───────────────┐  ┌───────────────┐
              │  Frontend (React) │  │ Backend (API) │  │  MinIO (S3)   │
              │  Vite build/nginx │  │  Node/Express │  │ product-images│
              └───────────────────┘  └───────┬───────┘  └───────────────┘
                                              │
                                     ┌────────┴────────┐
                                     │   PostgreSQL     │
                                     │   (Prisma ORM)   │
                                     └──────────────────┘
```

Un unique point d'entrée (Nginx) reçoit tout le trafic navigateur : `/` est
routé vers le frontend statique, `/api` et `/uploads` vers le backend. Le
backend est la seule brique qui parle à PostgreSQL et à MinIO/au stockage
local — le navigateur ne s'adresse jamais directement à la base de données
ou au stockage objet.

## Choix techniques et justifications

| Choix | Justification |
|---|---|
| **Node.js + Express** | Écosystème JS unifié avec le frontend, léger, large communauté, adapté à une API REST CRUD-centrique. |
| **Prisma ORM** | Migrations versionnées, client typé généré depuis le schéma, requêtes transactionnelles (`$transaction`) essentielles pour l'atomicité stock/commande et paiement/publication. |
| **PostgreSQL** | SGBD relationnel robuste, contraintes fortes (FK, CHECK), types `DECIMAL` pour les montants (évite les erreurs d'arrondi des flottants), `JSONB` pour les métadonnées de paiement. |
| **JWT (access + refresh)** | Stateless côté access token (scalable horizontalement), refresh token stocké en base et révocable (rotation à chaque refresh) pour limiter l'impact d'un vol de token. |
| **Pattern Adapter pour les paiements** | Chaque prestataire (Orange Money, Moov Money, Wave, Sank Money) est isolé derrière une interface commune (`BaseAdapter`). Ajouter un 5ᵉ prestataire = une classe de plus, aucun code existant à modifier (principe ouvert/fermé). |
| **Mode mock/sandbox des paiements** | Sans comptes marchands réels, le flux complet (initiation → webhook → publication) reste testable de bout en bout. Le webhook réel utilisera la même vérification de signature HMAC, seule la clé change. |
| **MinIO / volume Docker local** | Le stockage objet est abstrait dans `storage.service.js` : `STORAGE_MODE=local` (volume Docker, simple pour un MVP) ou `STORAGE_MODE=minio` (S3-compatible, scalable) sans changer le reste du code. |
| **React + Vite + Tailwind** | Démarrage rapide, build de production optimisé, Tailwind pour un style utilitaire cohérent sans surcharge CSS custom. |
| **Docker Compose multi-services** | Isolation par responsabilité (frontend, backend, db, stockage, proxy), reproductible en local comme en production, volumes nommés pour la persistance. |
| **GitHub Actions (CI/CD séparées de commitlint)** | `ci.yml` valide code/tests/build sur chaque PR ; `commitlint.yml` valide le format des commits indépendamment ; `cd.yml` ne construit et publie des images que sur `main`/tags — sépare "est-ce que ça marche" de "est-ce que c'est déployable". |

## Flux clés

### Publication d'un produit (payante)

1. Le vendeur crée un produit → statut `BROUILLON` (invisible des clients).
2. Le vendeur choisit un prestataire mobile money et initie le paiement
   (`POST /api/payments/publish/:productId`) → un enregistrement
   `product_publication_payments` est créé (`EN_ATTENTE`), le produit passe
   en `EN_ATTENTE_PAIEMENT`.
3. Le prestataire (ou le simulateur en mode mock) confirme via webhook signé
   (`POST /api/payments/webhook/:prestataire`).
4. Le webhook déclenche une transaction Prisma qui met à jour **ensemble**
   le paiement (`REUSSI`/`ECHOUE`) et le produit (`PUBLIE`/`BROUILLON`) —
   jamais l'un sans l'autre, garantissant qu'un produit `PUBLIE` a toujours
   un paiement `REUSSI` correspondant.

### Commande client (sans paiement intégré)

1. Le client compose son panier côté frontend (état local, `localStorage`).
2. À la commande (`POST /api/orders`), le backend vérifie dans une seule
   transaction Prisma : que chaque produit est `PUBLIE`, que le stock est
   suffisant, décrémente le stock et crée la commande — évitant toute
   survente en cas de commandes concurrentes.
3. Aucune étape de paiement n'existe dans ce flux : le total est indicatif,
   le règlement se fait entre client et vendeur/livreur hors application.

## Sécurité

- Mots de passe hashés avec `bcryptjs` (12 rounds).
- JWT signés avec des secrets distincts pour access et refresh tokens ;
  refresh tokens stockés en base et révoqués/rotés à chaque utilisation.
- `helmet` pour les en-têtes HTTP de sécurité, `cors` restreint à l'origine
  configurée, rate limiting sur `/api`.
- Validation stricte des entrées avec `zod` sur chaque route.
- Vérification de signature HMAC-SHA256 sur les webhooks de paiement avant
  tout traitement (`timingSafeEqual` pour éviter les attaques par timing).
- Contrôle d'accès par rôle (`CLIENT` / `VENDEUR` / `ADMIN`) au niveau
  middleware, et vérification de propriété (un vendeur ne peut modifier que
  ses propres produits, un client ne voit que ses propres commandes).

## Performance et scalabilité

- Pagination sur les listes de produits, utilisateurs, commandes, paiements.
- Index sur les colonnes de recherche fréquente (email, statut, vendeur_id,
  catégorie_id, nom — voir `prisma/schema.prisma` et `prisma/init.sql`).
- Lazy loading des images côté frontend (`loading="lazy"`).
- Stockage objet découplé du serveur applicatif (MinIO), permettant de
  scaler le backend horizontalement sans dupliquer les fichiers.
- Ajout d'un nouveau prestataire de paiement ou d'un nouveau rôle
  n'implique aucune modification du cœur de l'application (adapters,
  enums Prisma extensibles).
