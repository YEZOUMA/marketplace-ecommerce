# Guide de contribution

Ce guide explique comment modifier le code du projet, même si vous n'avez
jamais utilisé Git ou GitHub auparavant. Si vous voulez seulement
**déployer** l'application sans toucher au code, allez plutôt dans
[README.md](README.md#déployer-en-production-étape-par-étape).

## Sommaire

1. [Mettre en place son environnement de développement](#1-mettre-en-place-son-environnement-de-développement)
2. [Comprendre l'organisation des branches](#2-comprendre-lorganisation-des-branches)
3. [Faire une modification, pas à pas](#3-faire-une-modification-pas-à-pas)
4. [Convention de commits](#4-convention-de-commits)
5. [Avant d'ouvrir une Pull Request](#5-avant-douvrir-une-pull-request)
6. [Configurer la protection des branches sur GitHub](#6-configurer-la-protection-des-branches-sur-github)

---

## 1. Mettre en place son environnement de développement

### 1.1 Outils à installer

| Outil | Pourquoi | Lien |
|---|---|---|
| Git | Suivre l'historique des modifications | https://git-scm.com/downloads |
| Node.js 20+ | Exécuter le backend et le frontend | https://nodejs.org (choisissez la version "LTS") |
| Docker Desktop | Lancer PostgreSQL facilement sans l'installer directement | https://www.docker.com/products/docker-desktop/ |
| Un éditeur de code | Écrire le code | [VS Code](https://code.visualstudio.com/) est un bon choix par défaut |

Vérifiez les installations dans un terminal :

```bash
git --version
node --version
docker --version
```

### 1.2 Récupérer le code

```bash
git clone https://github.com/yezouma/marketplace-ecommerce.git
cd marketplace-ecommerce
```

### 1.3 Démarrer une base de données locale

Pour développer en dehors de Docker (backend et frontend lancés
directement avec `npm run dev`), utilisez un conteneur PostgreSQL
autonome et jetable, séparé de la pile `docker-compose.yml` du projet
(qui, elle, sert au déploiement — voir README) :

```bash
docker run -d --name marketplace-dev-db \
  -e POSTGRES_USER=marketplace \
  -e POSTGRES_PASSWORD=marketplace \
  -e POSTGRES_DB=marketplace \
  -p 5432:5432 \
  postgres:16-alpine
```

Ces identifiants correspondent exactement à ceux déjà présents dans
`backend/.env.example` (section 1.4) — aucune valeur à changer. Pour
vérifier qu'il tourne : `docker ps`. Pour l'arrêter/supprimer plus tard :
`docker rm -f marketplace-dev-db`.

### 1.4 Démarrer le backend

```bash
cd backend
cp .env.example .env
```

Le fichier `backend/.env.example` contient déjà des valeurs de
développement prêtes à l'emploi, y compris `DATABASE_URL` qui pointe vers
le conteneur créé à l'étape 1.3 — rien à modifier pour démarrer
(`NODE_ENV=development` n'active pas les contrôles stricts réservés à la
production, donc ces valeurs d'exemple fonctionnent telles quelles).

```bash
npm install
npx prisma migrate deploy   # crée les tables dans la base
node prisma/seed.js         # optionnel : ajoute des catégories + un compte admin
npm run dev
```

Le backend tourne maintenant sur **http://localhost:4000**. Laissez ce
terminal ouvert.

### 1.5 Démarrer le frontend

Dans un **nouveau** terminal :

```bash
cd marketplace-ecommerce/frontend
cp .env.example .env
npm install
npm run dev
```

Le frontend tourne sur **http://localhost:5173** et appelle automatiquement
le backend sur `http://localhost:4000` (voir `frontend/.env.example`).
Ouvrez cette adresse dans votre navigateur — vous développez maintenant en
conditions réelles, avec rechargement automatique à chaque modification de
fichier.

### 1.6 Lancer les tests du backend

```bash
cd backend
npm test
```

(nécessite que PostgreSQL tourne — voir 1.3)

---

## 2. Comprendre l'organisation des branches

Le projet suit une version simplifiée de **GitFlow**. Une "branche" est une
ligne de développement indépendante — le principe est de ne jamais
modifier directement le code qui tourne en production.

| Branche | Rôle |
|---|---|
| `main` | Le code en production. Protégée : on ne peut y écrire que via une Pull Request approuvée. |
| `develop` | Le code en cours d'intégration, juste avant la prochaine mise en production. |
| `feature/<nom>` | Une nouvelle fonctionnalité, créée à partir de `develop`. |
| `fix/<nom>` | Une correction de bug non urgente, créée à partir de `develop`. |
| `hotfix/<nom>` | Une correction urgente en production, créée à partir de `main`, puis reportée dans `develop`. |

**Règle simple à retenir : je pars toujours de `develop` (sauf urgence en
production), je travaille sur ma propre branche, et je propose mon
changement via une Pull Request — jamais de modification directe sur
`main` ou `develop`.**

---

## 3. Faire une modification, pas à pas

Exemple concret : vous voulez corriger une faute de frappe dans le
frontend.

```bash
# 1. Se placer sur develop et récupérer la dernière version
git checkout develop
git pull origin develop

# 2. Créer sa propre branche de travail
git checkout -b fix/faute-de-frappe-accueil

# 3. Faire la modification avec votre éditeur de code...
#    (exemple : corriger un texte dans frontend/src/pages/client/CatalogPage.jsx)

# 4. Vérifier ce qui a changé
git status
git diff

# 5. Ajouter et enregistrer la modification (un "commit")
git add frontend/src/pages/client/CatalogPage.jsx
git commit -m "fix(frontend): corriger une faute de frappe sur la page d'accueil"

# 6. Envoyer sa branche sur GitHub
git push -u origin fix/faute-de-frappe-accueil
```

Terminal affiche alors un lien du type
`https://github.com/.../pull/new/fix/faute-de-frappe-accueil` — ouvrez-le
dans votre navigateur (ou allez sur la page GitHub du dépôt : un bandeau
"Compare & pull request" apparaît automatiquement).

Remplissez le formulaire (le gabarit est déjà pré-rempli, voir
`.github/pull_request_template.md`), choisissez `develop` comme branche de
destination, et cliquez "Create pull request".

À partir de là :
- Les vérifications automatiques (`ci`, `commitlint`) se lancent seules —
  regardez l'onglet "Checks" de la Pull Request.
- Un relecteur doit approuver avant de pouvoir fusionner (voir
  `.github/CODEOWNERS`).
- Une fois approuvée et les vérifications au vert, cliquez "Merge pull
  request" sur GitHub.

## 4. Convention de commits

Chaque message de commit doit suivre le format **Conventional Commits** :

```
<type>(<zone optionnelle>): <description courte au présent>
```

Types disponibles : `feat` (nouvelle fonctionnalité), `fix` (correction de
bug), `docs` (documentation), `style` (mise en forme sans effet
fonctionnel), `refactor` (réécriture sans changement de comportement),
`perf` (amélioration de performance), `test`, `chore` (tâche
d'outillage), `ci`, `build`, `revert`.

Exemples :

```
feat(paiement): ajouter l'adaptateur Sank Money
fix(commandes): corriger la décrémentation du stock en cas d'annulation
docs: mettre à jour la documentation API des paiements
```

### Pourquoi ce format est imposé automatiquement

Deux garde-fous vérifient ce format :

- **En local**, un hook Git bloque un commit mal formé avant même qu'il
  ne soit enregistré. Pour l'activer une fois après avoir cloné le dépôt :

  ```bash
  npm install    # à la racine du dépôt (pas backend/ ni frontend/)
  npm run prepare
  ```

- **Sur GitHub**, le workflow `.github/workflows/commitlint.yml` refait la
  même vérification sur chaque Pull Request, au cas où quelqu'un aurait
  contourné le hook local (ex: commit fait depuis un autre outil).

Un second hook (`pre-push`) bloque aussi tout push direct depuis votre
machine vers `main` ou `develop` — en complément (pas en remplacement) de
la protection de branche configurée côté GitHub (section 6).

## 5. Avant d'ouvrir une Pull Request

Cochez cette liste avant de proposer votre changement :

- [ ] Les commits suivent la convention (section 4)
- [ ] `cd backend && npm run lint && npm test` passe sans erreur
- [ ] `cd frontend && npm run lint && npm run build` passe sans erreur
- [ ] La Pull Request utilise le gabarit fourni et explique clairement
      "comment tester" votre changement
- [ ] Aucune clé secrète, mot de passe ou fichier `.env` n'apparaît dans
      votre diff (vérifiez avec `git status` puis `git diff --cached`
      avant de committer)

## 6. Configurer la protection des branches sur GitHub

Cette section s'adresse à la personne administrant le dépôt GitHub (pas à
chaque contributeur). Deux façons équivalentes de faire la même chose.

### Option A — Interface web (la plus simple si vous découvrez GitHub)

1. Sur la page du dépôt GitHub, cliquez **Settings** (icône d'engrenage).
2. Dans le menu de gauche, cliquez **Branches**.
3. Cliquez **Add branch protection rule**, tapez `main` dans "Branch name
   pattern".
4. Cochez :
   - **Require a pull request before merging**
     - Require approvals: **1**
     - Require review from Code Owners
     - Dismiss stale pull request approvals when new commits are pushed
   - **Require status checks to pass before merging**
     - Cochez `ci` et `commitlint` dans la liste (elles n'apparaissent
       qu'après leur première exécution — faites une première Pull
       Request test si besoin)
     - Require branches to be up to date before merging
   - **Require conversation resolution before merging**
   - **Require linear history**
   - **Do not allow bypassing the above settings**
   - Décochez **Allow force pushes** et **Allow deletions**
5. Cliquez **Create** en bas de page.
6. Répétez exactement les mêmes étapes pour la branche `develop`.

### Option B — Ligne de commande, avec le script fourni

Prérequis : installer [GitHub CLI](https://cli.github.com) puis vous
authentifier :

```bash
gh auth login
```

(suivez les instructions à l'écran — choisissez GitHub.com, HTTPS, puis
authentification via le navigateur)

Une fois authentifié, lancez :

```bash
./scripts/setup-branch-protection.sh yezouma/marketplace-ecommerce
```

Ce script applique exactement les mêmes règles que l'option A ci-dessus,
sur `main` et `develop`, en une seule commande. Vous pouvez le relancer
sans risque si besoin (il ne fait que réappliquer la configuration).

Vérifiez le résultat sur
`https://github.com/yezouma/marketplace-ecommerce/settings/branches`.
