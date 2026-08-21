# Documentation API

Base URL locale : `http://localhost:4000/api` (ou `http://localhost/api` derrière Nginx).

Authentification : `Authorization: Bearer <accessToken>` sauf mention contraire.
Toutes les réponses sont en JSON. Les erreurs suivent le format :

```json
{ "error": "Message d'erreur", "details": [] }
```

---

## Auth (`/api/auth`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | Non | Inscription (`nom`, `email`, `telephone?`, `motDePasse`, `role`: `CLIENT`\|`VENDEUR`) |
| POST | `/auth/login` | Non | Connexion (`email`, `motDePasse`) |
| POST | `/auth/refresh` | Non | Rafraîchit les tokens (`refreshToken`) — rotation du refresh token |
| POST | `/auth/logout` | Non | Révoque le refresh token fourni |
| GET | `/auth/me` | Oui | Profil de l'utilisateur courant |

Réponse type (register/login/refresh) :

```json
{
  "user": { "id": "...", "nom": "...", "email": "...", "role": "CLIENT", "dateCreation": "..." },
  "accessToken": "...",
  "refreshToken": "..."
}
```

---

## Produits (`/api/products`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/products` | Optionnelle | Liste paginée. Public: uniquement `PUBLIE`. Vendeur: peut filtrer ses propres produits par statut via `vendeurId` + `statut`. Admin: filtre libre. Query: `page, pageSize, categorieId, vendeurId, prixMin, prixMax, q, statut` |
| GET | `/products/:id` | Optionnelle | Fiche produit (404 si non publié et non propriétaire/admin) |
| GET | `/products/vendeur/stats` | VENDEUR | Statistiques du tableau de bord vendeur |
| POST | `/products` | VENDEUR | Crée un produit (statut initial `BROUILLON`). Body: `nom, description, prix, stock, categorieId?, images[]` |
| PATCH | `/products/:id` | VENDEUR (propriétaire) | Met à jour un produit |
| DELETE | `/products/:id` | VENDEUR (propriétaire) | Supprime un produit et ses images |

---

## Catégories (`/api/categories`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/categories` | Non | Liste toutes les catégories |
| POST | `/categories` | ADMIN | Crée une catégorie (`nom`) |
| PATCH | `/categories/:id` | ADMIN | Renomme une catégorie |
| DELETE | `/categories/:id` | ADMIN | Supprime une catégorie (refusé si utilisée par des produits) |

---

## Upload d'images (`/api/uploads`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/uploads/images` | VENDEUR, ADMIN | `multipart/form-data`, champ `images` (jusqu'à 8 fichiers, jpeg/png/webp, 5 Mo max/fichier). Retourne `{ urls: string[] }` à inclure dans `POST/PATCH /products` |

---

## Paiement de publication (`/api/payments`)

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/payments/providers` | Non | Liste des prestataires supportés + montant des frais de publication |
| POST | `/payments/publish/:productId` | VENDEUR (propriétaire) | Initie le paiement. Body: `{ prestataire: "ORANGE_MONEY"\|"MOOV_MONEY"\|"WAVE"\|"SANK_MONEY", numeroTelephone }`. Le produit passe en `EN_ATTENTE_PAIEMENT`. Retourne `{ payment, redirectUrl }` |
| GET | `/payments/mine` | VENDEUR | Historique des paiements de publication du vendeur |
| POST | `/payments/webhook/:prestataire` | Signature HMAC (pas de JWT) | Appelé par le prestataire pour confirmer/infirmer un paiement. Voir ci-dessous |
| POST | `/payments/mock/simulate` | VENDEUR | **Mode sandbox uniquement** (`PAYMENTS_MOCK_MODE=true`) : simule la confirmation d'un paiement sans prestataire réel. Body: `{ reference, resultat: "REUSSI"\|"ECHOUE" }` |

### Webhook — vérification de signature

Chaque requête webhook doit porter un en-tête `X-Signature` (ou
`X-Webhook-Signature`) contenant `HMAC-SHA256(corps_brut, secret)` en
hexadécimal. En mode mock, `secret = PAYMENTS_WEBHOOK_SECRET`. En
production, `secret = <apiSecret du prestataire>` (voir
`backend/src/payments/adapters/`). Une signature absente ou invalide
retourne `401` sans aucun traitement.

Corps attendu : `{ "reference": "...", "status": "REUSSI"|"ECHOUE", "providerTransactionId": "..." }`.

---

## Commandes (`/api/orders`) — sans paiement intégré

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/orders` | CLIENT | Crée une commande. Body: `{ items: [{ productId, quantite }], adresseLivraison, notes? }`. Vérifie que chaque produit est `PUBLIE`, décrémente le stock de façon transactionnelle. **Aucun champ de paiement.** |
| GET | `/orders/mine` | CLIENT | Historique des commandes du client |
| GET | `/orders/:id` | CLIENT (propriétaire) | Détail d'une commande |
| GET | `/orders/received` | VENDEUR | Commandes contenant au moins un produit du vendeur |
| PATCH | `/orders/:id/statut` | VENDEUR (concerné) | Met à jour le statut logistique (`EN_ATTENTE, CONFIRMEE, EXPEDIEE, LIVREE, ANNULEE`) |

---

## Admin (`/api/admin`) — rôle ADMIN requis sur toutes les routes

| Méthode | Route | Description |
|---|---|---|
| GET | `/admin/users?role=&page=&pageSize=` | Liste paginée des utilisateurs |
| PATCH | `/admin/products/:id/statut` | Modère un produit (`BROUILLON, EN_ATTENTE_PAIEMENT, PUBLIE, SUSPENDU`) |
| GET | `/admin/orders?page=&pageSize=` | Vue globale des commandes |
| GET | `/admin/payments?statut=&page=&pageSize=` | Vue globale des paiements de publication vendeur |
| GET | `/admin/stats` | Statistiques globales (utilisateurs, produits, commandes, revenu des frais de publication) |

---

## Codes d'erreur HTTP

| Code | Signification |
|---|---|
| 400 | Requête invalide (validation Zod échouée) |
| 401 | Non authentifié / token invalide / signature webhook invalide |
| 403 | Authentifié mais rôle ou propriété insuffisants |
| 404 | Ressource introuvable (ou invisible pour ce rôle, ex: produit non publié) |
| 409 | Conflit (email déjà utilisé, stock insuffisant, produit déjà publié) |
| 500 | Erreur interne |
