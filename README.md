# Marketplace — Vente de produits divers (multi-vendeurs)

Plateforme e-commerce multi-vendeurs : les vendeurs publient des produits
(publication payante via mobile money), les clients consultent et
commandent (règlement entièrement hors application), un espace admin
supervise l'ensemble.

Ce README est écrit pour permettre de **déployer le projet en production
sans expérience préalable en développement ou en DevOps** : chaque étape
donne la commande exacte à copier-coller. Prenez le temps de les suivre
dans l'ordre la première fois.

Documentation complémentaire : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
(comment le système est construit et pourquoi) ·
[docs/API.md](docs/API.md) (référence technique de l'API) ·
[CONTRIBUTING.md](CONTRIBUTING.md) (si vous voulez faire évoluer le code)

## Sommaire

1. [Modèle économique](#modèle-économique)
2. [Stack technique](#stack-technique)
3. [Essayer le projet en local (5 minutes)](#essayer-le-projet-en-local-5-minutes)
4. [Déployer en production, étape par étape](#déployer-en-production-étape-par-étape)
5. [Utilisation courante (jour 2)](#utilisation-courante-jour-2)
6. [Dépannage](#dépannage)
7. [Critères d'acceptation](#critères-dacceptation-couverts)
8. [Structure du dépôt](#structure-du-dépôt)

---

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
| Stockage images | Volume Docker local (défaut) ou MinIO (S3-compatible, optionnel) |
| Authentification | JWT (access + refresh, rotation) |
| Paiement vendeur | Adapters Orange Money / Moov Money / Wave / Sank Money (mode mock/sandbox par défaut) |
| Conteneurisation | Docker + Docker Compose |
| Reverse proxy + HTTPS | **Caddy** (certificats Let's Encrypt automatiques, sans configuration manuelle) |
| Tests | Jest + Supertest |
| CI/CD | GitHub Actions (`ci.yml`, `commitlint.yml`, `cd.yml` → GHCR) |

---

## Essayer le projet en local (5 minutes)

Avant de déployer sur un vrai serveur, testez sur votre propre ordinateur.

**Prérequis** : [Docker Desktop](https://www.docker.com/products/docker-desktop/)
installé (Windows, Mac ou Linux) et démarré.

```bash
git clone https://github.com/yezouma/marketplace-ecommerce.git
cd marketplace-ecommerce
cp .env.example .env
```

Ouvrez le fichier `.env` créé et remplacez les valeurs marquées
`change-me...` par des valeurs générées — copiez-collez ces commandes dans
votre terminal et reportez chaque résultat dans `.env` :

```bash
openssl rand -hex 32   # -> collez le résultat dans JWT_ACCESS_SECRET
openssl rand -hex 32   # -> collez le résultat (différent !) dans JWT_REFRESH_SECRET
openssl rand -hex 32   # -> collez le résultat dans PAYMENTS_WEBHOOK_SECRET
openssl rand -hex 16   # -> collez le résultat dans POSTGRES_PASSWORD
```

> Pourquoi c'est obligatoire même en local : l'application refuse de
> démarrer si l'un de ces secrets contient encore une valeur d'exemple —
> c'est volontaire (voir [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#sécurité)).
> Windows sans `openssl` ? Utilisez [Git Bash](https://git-scm.com/downloads)
> (fourni avec Git for Windows, qui inclut `openssl`), ou générez les
> valeurs sur <https://www.uuidgenerator.net/> (prenez 2-3 UUID concaténés).

Démarrez tout :

```bash
docker compose up --build
```

Patientez que les lignes de logs se calment (la première fois, la
construction des images prend quelques minutes), puis ouvrez
**http://localhost** dans votre navigateur. C'est tout : frontend,
backend, base de données sont démarrés et connectés entre eux.

Pour arrêter : <kbd>Ctrl</kbd>+<kbd>C</kbd> puis `docker compose down`
(ajoutez `-v` pour aussi supprimer les données et repartir de zéro).

Un compte administrateur est créé automatiquement avec les identifiants
`SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` de votre `.env` (par défaut
`admin@marketplace.local` / le mot de passe que vous avez mis dans
`.env`) — connectez-vous puis explorez les 3 espaces (créez aussi un
compte vendeur et un compte client pour tester le parcours complet).

Le paiement mobile money est en **mode simulation** par défaut
(`PAYMENTS_MOCK_MODE=true`) : en tant que vendeur, publiez un produit, choisissez
un prestataire, puis un écran de simulation vous permet de déclarer le
paiement "réussi" ou "échoué" sans compte marchand réel — voir
[section dédiée plus bas](#brancher-un-vrai-prestataire-mobile-money).

---

## Déployer en production, étape par étape

Cette section suppose que vous n'avez **jamais** administré de serveur.
Chaque commande est à copier-coller telle quelle (en adaptant les valeurs
en `MAJUSCULES_ENTRE_CHEVRONS`).

### Étape 1 — Louer un serveur (VPS)

Un VPS ("Virtual Private Server") est un ordinateur distant loué à l'heure
ou au mois, accessible par Internet. N'importe quel fournisseur convient
(OVH, Hetzner, DigitalOcean, Scaleway, Contabo, etc.) — choisissez celui
que vous préférez. Caractéristiques minimales recommandées :

- Système : **Ubuntu 22.04 ou 24.04 LTS**
- Mémoire : **2 Go de RAM minimum** (1 Go fonctionne mais est juste)
- 1 CPU, 20 Go de disque suffisent pour démarrer
- Une **adresse IP publique** (fournie automatiquement par le VPS)

Une fois la commande passée, le fournisseur vous donne : une adresse IP
(ex: `203.0.113.42`) et un mot de passe root, ou une clé SSH.

### Étape 2 — Pointer votre nom de domaine vers le serveur

Optionnel mais fortement recommandé (nécessaire pour avoir du HTTPS
automatique). Si vous n'avez pas encore de nom de domaine, achetez-en un
chez n'importe quel registraire (Namecheap, OVH, Google Domains...).

Dans l'interface de gestion DNS de votre domaine, créez un enregistrement :

| Type | Nom | Valeur |
|---|---|---|
| A | `@` (ou votre sous-domaine, ex: `boutique`) | l'adresse IP de votre VPS |

La propagation DNS peut prendre de quelques minutes à quelques heures.
Vérifiez qu'elle est effective avec :

```bash
ping votre-domaine.com
# Doit répondre avec l'IP de votre VPS
```

Pas de domaine pour l'instant ? Vous pouvez déployer avec juste l'adresse
IP (sans HTTPS) et brancher un domaine plus tard — voir la note à l'étape 6.

### Étape 3 — Se connecter au serveur en SSH

Depuis votre ordinateur (Terminal sur Mac/Linux, ou
[PowerShell](https://learn.microsoft.com/fr-fr/windows/terminal/) /
[Git Bash](https://git-scm.com/downloads) sur Windows) :

```bash
ssh root@203.0.113.42
```

(remplacez par l'IP de votre serveur). Répondez `yes` à la première
question, puis entrez le mot de passe fourni par votre hébergeur.

### Étape 4 — Installer Docker

Une fois connecté au serveur, copiez-collez ces commandes une par une
(script officiel Docker) :

```bash
curl -fsSL https://get.docker.com | sh
```

Vérifiez l'installation :

```bash
docker --version
docker compose version
```

Les deux commandes doivent afficher un numéro de version sans erreur.

### Étape 5 — Récupérer le code du projet

```bash
apt-get install -y git   # si git n'est pas déjà installé
git clone https://github.com/yezouma/marketplace-ecommerce.git
cd marketplace-ecommerce
```

### Étape 6 — Configurer `.env`

```bash
cp .env.example .env
```

Éditez le fichier avec un éditeur en ligne de commande simple :

```bash
nano .env
```

(flèches pour naviguer, <kbd>Ctrl</kbd>+<kbd>O</kbd> puis <kbd>Entrée</kbd>
pour sauvegarder, <kbd>Ctrl</kbd>+<kbd>X</kbd> pour quitter)

Renseignez **au minimum** ces valeurs (le fichier `.env.example` explique
chacune en détail) :

| Variable | Quoi mettre |
|---|---|
| `SITE_ADDRESS` | Votre nom de domaine **sans** `http://`, ex: `boutique.exemple.com`. Pas de domaine ? Laissez `http://localhost` pour l'instant (voir note ci-dessous). |
| `CORS_ORIGIN` | La même adresse que `SITE_ADDRESS`, avec le schéma : `https://boutique.exemple.com` (ou `http://` si pas de domaine) |
| `POSTGRES_PASSWORD` | Généré avec `openssl rand -hex 16` |
| `JWT_ACCESS_SECRET` | Généré avec `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | Généré avec `openssl rand -hex 32` (différent du précédent) |
| `PAYMENTS_WEBHOOK_SECRET` | Généré avec `openssl rand -hex 32` |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Votre email et un mot de passe fort pour le compte admin initial |

> **Pas de domaine pour l'instant ?** Laissez `SITE_ADDRESS=http://localhost`
> et `CORS_ORIGIN=http://localhost` : le site sera accessible via
> `http://<IP_DE_VOTRE_SERVEUR>` en HTTP simple (pas de HTTPS). Dès que
> vous aurez un domaine pointé dessus (étape 2), revenez modifier ces deux
> valeurs avec votre domaine et relancez l'étape 8 — Caddy activera alors
> automatiquement le HTTPS, sans rien réinstaller.

### Étape 7 — Ouvrir les ports du pare-feu

Si votre VPS a un pare-feu actif (souvent le cas par défaut avec `ufw`) :

```bash
ufw allow 22/tcp    # SSH — ne l'oubliez pas, sinon vous perdez l'accès au serveur !
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw enable
```

Si votre hébergeur a aussi un pare-feu réseau séparé (panneau de
contrôle), ouvrez-y également les ports 80 et 443.

### Étape 8 — Démarrer l'application

```bash
docker compose up -d --build
```

Le `-d` lance en arrière-plan. La première fois, comptez quelques minutes
(construction des images + téléchargement de PostgreSQL/Caddy). Suivez la
progression avec :

```bash
docker compose logs -f
```

(<kbd>Ctrl</kbd>+<kbd>C</kbd> pour quitter l'affichage des logs — cela
n'arrête pas l'application, qui continue de tourner en arrière-plan)

### Étape 9 — Vérifier que tout fonctionne

```bash
docker compose ps
```

Toutes les lignes doivent afficher `running` (ou `healthy` pour `db` et
`backend`). Puis, depuis votre navigateur, ouvrez :

- `https://votre-domaine.com` (ou `http://<IP_DU_SERVEUR>` si pas de
  domaine) — le catalogue doit s'afficher.
- Si vous avez configuré un domaine, vérifiez que le cadenas HTTPS est
  bien présent (cela peut prendre 10-30 secondes la toute première fois,
  le temps que Caddy obtienne le certificat).

### Étape 10 — Se connecter en admin et sécuriser le compte

Allez sur `/connexion`, connectez-vous avec `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. Le projet n'a pas encore d'écran "changer mon mot
de passe" en admin — si vous voulez le changer immédiatement, le plus
simple est de modifier `SEED_ADMIN_PASSWORD` dans `.env` puis de recréer
le conteneur backend (le compte existant n'est pas touché par le seed,
donc supprimez d'abord l'utilisateur existant) :

```bash
docker compose exec db psql -U marketplace -d marketplace -c \
  "DELETE FROM users WHERE email = 'admin@marketplace.local';"
docker compose restart backend
```

(remplacez l'email par celui de votre `SEED_ADMIN_EMAIL`, et
`marketplace`/`marketplace` par vos `POSTGRES_USER`/`POSTGRES_DB` si vous
les avez changés)

### Brancher un vrai prestataire mobile money

Tant que `PAYMENTS_MOCK_MODE=true` (valeur par défaut), la publication de
produits fonctionne en mode simulation — utile pour démontrer le site
avant d'avoir vos comptes marchands. Pour accepter de vrais paiements :

1. Ouvrez un **compte marchand/API** auprès du ou des prestataires
   souhaités : Orange Money, Moov Money, Wave, Sank Money. C'est une
   démarche commerciale propre à chaque prestataire (contactez leur
   service entreprise/développeur) — ce dépôt ne peut pas le faire à
   votre place.
2. Le prestataire vous remettra une clé API, un secret, et une URL de
   base d'API. Renseignez-les dans `.env` (ex. pour Orange Money :
   `ORANGE_MONEY_API_KEY`, `ORANGE_MONEY_API_SECRET`,
   `ORANGE_MONEY_BASE_URL`).
3. Passez `PAYMENTS_MOCK_MODE=false`.
4. Redémarrez : `docker compose up -d --build`.
5. **Développement requis avant mise en prod réelle** : les fichiers
   `backend/src/payments/adapters/*.js` contiennent la structure prête
   (authentification, calcul de signature, endpoints) mais l'appel HTTP
   réel vers l'API du prestataire (méthode `callProviderApi`) doit être
   implémenté selon la documentation technique que le prestataire vous
   remettra — chaque prestataire a son propre format de requête/réponse.
   Si vous n'êtes pas développeur, c'est le moment de faire appel à un
   développeur freelance pour cette étape précise (quelques heures de
   travail par prestataire, le reste de l'application n'a pas besoin d'être
   retouché).
6. Configurez, côté tableau de bord du prestataire, l'URL de webhook :
   `https://votre-domaine.com/api/payments/webhook/<PRESTATAIRE>`
   (ex: `ORANGE_MONEY`, `MOOV_MONEY`, `WAVE`, `SANK_MONEY`).

---

## Utilisation courante (jour 2)

### Voir les logs

```bash
docker compose logs -f              # tous les services
docker compose logs -f backend      # un seul service
```

### Mettre à jour l'application (nouvelle version du code)

```bash
cd marketplace-ecommerce
git pull origin main
docker compose up -d --build
```

Les migrations de base de données s'appliquent automatiquement au
redémarrage du backend (voir `backend/docker-entrypoint.sh`) — vous n'avez
rien d'autre à faire.

### Sauvegarder la base de données

À faire **régulièrement** (c'est la seule donnée qu'il serait douloureux
de perdre) :

```bash
docker compose exec db pg_dump -U marketplace marketplace > sauvegarde_$(date +%Y%m%d).sql
```

(remplacez `marketplace marketplace` par vos `POSTGRES_USER`/`POSTGRES_DB`
si vous les avez changés). Copiez ensuite ce fichier hors du serveur
(ex: `scp` vers votre ordinateur) — une sauvegarde qui reste sur le
serveur qu'elle est censée protéger n'en est pas vraiment une.

Pour automatiser quotidiennement, ajoutez une tâche planifiée :

```bash
crontab -e
# Ajoutez cette ligne (sauvegarde tous les jours à 3h du matin) :
0 3 * * * cd /root/marketplace-ecommerce && docker compose exec -T db pg_dump -U marketplace marketplace > /root/backups/backup_$(date +\%Y\%m\%d).sql
```

(créez le dossier `mkdir -p /root/backups` avant, et pensez à copier
périodiquement ce dossier ailleurs — un disque externe, un autre serveur,
un espace de stockage cloud)

### Restaurer une sauvegarde

```bash
cat sauvegarde_20260101.sql | docker compose exec -T db psql -U marketplace -d marketplace
```

### Arrêter / redémarrer

```bash
docker compose stop                 # arrête sans supprimer les données
docker compose start                # redémarre
docker compose restart backend      # redémarre un seul service
docker compose down                 # arrête et supprime les conteneurs (les volumes/données restent)
```

**Ne jamais utiliser `docker compose down -v` en production** — le `-v`
supprime aussi les volumes, donc toutes les données (base de données,
images uploadées).

---

## Dépannage

| Symptôme | Cause probable | Solution |
|---|---|---|
| `docker compose up` échoue avec un message citant `JWT_ACCESS_SECRET` ou une autre variable | Un secret dans `.env` est vide ou contient encore `change-me...` | Relisez l'étape 6, générez les secrets manquants avec `openssl rand -hex 32` |
| Le site affiche une erreur de certificat / "non sécurisé" | DNS pas encore propagé, ou `SITE_ADDRESS` ne correspond pas exactement au domaine utilisé dans le navigateur | Vérifiez `ping votre-domaine.com` renvoie bien l'IP du serveur ; attendez quelques minutes ; vérifiez qu'il n'y a pas de faute de frappe dans `SITE_ADDRESS` |
| `docker compose ps` montre `backend` qui redémarre en boucle | Erreur de connexion à la base de données, ou secret invalide | `docker compose logs backend` pour voir le message d'erreur exact |
| Erreur "port is already allocated" au démarrage | Un autre programme utilise déjà le port 80 ou 443 (souvent un Apache/Nginx déjà installé sur le serveur) | `systemctl stop apache2` ou `systemctl stop nginx` (puis `systemctl disable` pour que ça ne revienne pas au redémarrage) |
| Impossible de se connecter en SSH après avoir activé `ufw` | Le port 22 n'a pas été autorisé avant d'activer le pare-feu | Utilisez la console web de votre hébergeur (VNC/console de secours) pour lancer `ufw allow 22/tcp` |
| Les images de produits ne s'affichent plus après un redémarrage | Le volume `uploads-data` a été supprimé (`docker compose down -v` a été utilisé par erreur) | Restaurez depuis une sauvegarde si vous en avez une ; sinon, ne relancez jamais `down -v` en production |
| Le paiement mobile money "ne se passe rien" en production | `PAYMENTS_MOCK_MODE=false` mais l'appel réel au prestataire (`callProviderApi`) n'a pas encore été implémenté dans l'adaptateur correspondant | Voir [Brancher un vrai prestataire mobile money](#brancher-un-vrai-prestataire-mobile-money) — cette étape nécessite un développeur |
| `docker: command not found` | Docker mal installé ou session SSH pas relancée après installation | Refaites l'étape 4 ; déconnectez-vous (`exit`) et reconnectez-vous en SSH |

Toujours bloqué ? `docker compose logs -f` affiche le message d'erreur
exact du service en cause — c'est la première chose à regarder.

---

## Déploiement via les images publiées automatiquement (CD)

Chaque fusion sur `main` (ou tag `vX.Y.Z`) déclenche `.github/workflows/cd.yml`
qui construit et publie sur GitHub Container Registry :

- `ghcr.io/<owner>/<repo>-backend:latest` (et `:sha-xxxxxxx`, `:vX.Y.Z`)
- `ghcr.io/<owner>/<repo>-frontend:latest` (idem)

Ceci est surtout utile pour une équipe qui automatise ses mises à jour ;
pour un usage simple, la méthode `git pull` + `docker compose up -d --build`
décrite plus haut suffit amplement et reste plus simple à comprendre.

---

## Critères d'acceptation couverts

- [x] `docker compose up` démarre l'ensemble (frontend, backend, db,
      reverse-proxy) et applique les migrations automatiquement.
- [x] Un vendeur crée un produit avec images puis le publie après paiement
      confirmé (mobile money réel ou simulé en sandbox).
- [x] Un client commande un produit publié de bout en bout sans aucune
      étape de paiement dans l'application.
- [x] Les données persistent après redémarrage des conteneurs (volumes
      nommés `postgres-data`, `uploads-data`, `caddy-data`).
- [x] `main`/`develop` + PR déclenchant `ci`/`commitlint`, fusion sur
      `main` déclenchant `cd` (publication GHCR).
- [x] HTTPS automatique en production dès qu'un nom de domaine est
      configuré, sans intervention manuelle sur les certificats.

## Structure du dépôt

```
backend/            API Node.js/Express + Prisma
  src/
    payments/         Adapters mobile money (pattern Adapter)
    controllers/ routes/ services/ middleware/ validators/
  prisma/            schema.prisma, migrations/, seed.js, init.sql
  tests/             Jest + Supertest
frontend/           React + Vite + Tailwind
  src/
    pages/{auth,client,vendor,admin}/
    api/ context/ components/
Caddyfile           Reverse proxy + HTTPS automatique (point d'entrée unique)
scripts/            setup-branch-protection.sh
docs/               ARCHITECTURE.md, API.md
.github/            workflows CI/CD, CODEOWNERS, templates PR/issues
.husky/             Hooks Git locaux (commit-msg, pre-push)
```
