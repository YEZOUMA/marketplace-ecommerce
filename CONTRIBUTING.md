# Guide de contribution

## Stratégie de branches (GitFlow simplifié)

| Branche | Rôle | Base | Fusionne vers |
|---|---|---|---|
| `main` | Production, protégée, déclenche la CD (build & push images) | — | — |
| `develop` | Intégration continue | `main` | `main` (via release) |
| `feature/<nom>` | Nouvelle fonctionnalité | `develop` | `develop` |
| `fix/<nom>` | Correction de bug non urgente | `develop` | `develop` |
| `hotfix/<nom>` | Correctif urgent en production | `main` | `main` **et** `develop` |

Exemple de cycle :

```bash
git checkout develop
git pull origin develop
git checkout -b feature/paiement-wave

# ... travail, commits ...

git push -u origin feature/paiement-wave
# Ouvrir une Pull Request vers develop sur GitHub
```

## Convention de commits (Conventional Commits)

Chaque commit doit suivre le format :

```
<type>(<scope optionnel>): <description courte>

[corps optionnel]
```

Types autorisés : `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`,
`chore`, `ci`, `build`, `revert`.

Exemples :

```
feat(paiement): ajouter l'adaptateur Sank Money
fix(commandes): corriger la décrémentation du stock en cas d'annulation
docs: mettre à jour la documentation API des paiements
```

Les commits sont validés :

- **Localement** via le hook Husky `commit-msg` (commitlint) — installé
  automatiquement par `npm install` à la racine (`npm run prepare`).
- **Sur le serveur** via le workflow `.github/workflows/commitlint.yml` sur
  chaque Pull Request.

Un hook `pre-push` bloque également tout push direct sur `main`/`develop`
en local, en complément (non en remplacement) de la protection de branche
GitHub.

## Installation des hooks locaux

```bash
npm install       # à la racine du dépôt
npm run prepare   # installe les hooks Husky (.husky/)
```

## Configuration de la protection de branches sur GitHub

### Option A — Interface web (UI)

1. Aller dans **Settings → Branches** du dépôt.
2. Cliquer **Add branch protection rule** pour `main`, répéter pour `develop`.
3. Cocher :
   - **Require a pull request before merging**
     - Require approvals: **1** minimum
     - Require review from Code Owners (utilise `.github/CODEOWNERS`)
     - Dismiss stale pull request approvals when new commits are pushed
   - **Require status checks to pass before merging**
     - Sélectionner les checks `ci` et `commitlint` (apparaissent après une
       première exécution des workflows)
     - Require branches to be up to date before merging
   - **Require conversation resolution before merging**
   - **Require linear history**
   - **Do not allow bypassing the above settings** (inclut les admins)
   - **Restrict who can push to matching branches** → ne laisser personne
     (tout passe par PR)
   - Décocher **Allow force pushes** et **Allow deletions**
4. Sauvegarder pour `main`, répéter pour `develop`.

### Option B — Ligne de commande (GitHub CLI)

Prérequis : [GitHub CLI](https://cli.github.com) installé et authentifié
(`gh auth login`), droits admin sur le dépôt.

```bash
./scripts/setup-branch-protection.sh yezouma/marketplace-ecommerce
```

Le script applique via `gh api` les mêmes règles que l'option UI ci-dessus
sur `main` et `develop`. Il peut être relancé sans risque (idempotent).

## Avant d'ouvrir une Pull Request

- [ ] Les commits suivent Conventional Commits
- [ ] `cd backend && npm run lint && npm test`
- [ ] `cd frontend && npm run lint && npm run build`
- [ ] La PR utilise le template (`.github/pull_request_template.md`)
- [ ] Aucune clé secrète, mot de passe ou fichier `.env` n'est inclus

## Revues de code

Voir `.github/CODEOWNERS` : les zones backend/paiement, frontend et
CI/infra ont chacune leurs relecteurs obligatoires. Une PR ne peut être
fusionnée sans leur approbation (appliqué par la protection de branche).
