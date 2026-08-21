#!/usr/bin/env bash
#
# Configure branch protection rules on `main` and `develop` via the GitHub API
# (gh api), matching the GitFlow strategy documented in CONTRIBUTING.md:
#   - PR obligatoire avant fusion
#   - Au moins une revue approuvée requise (CODEOWNERS)
#   - Status checks CI obligatoires (ci, commitlint)
#   - Pas de push direct
#   - Historique linéaire (pas de merge commit sur les branches protégées)
#
# Prérequis :
#   - GitHub CLI installé et authentifié : https://cli.github.com  (gh auth login)
#   - Droits d'administration sur le dépôt
#
# Usage :
#   ./scripts/setup-branch-protection.sh [owner/repo]
#
# Si [owner/repo] est omis, le script le déduit du remote git "origin".

set -euo pipefail

REPO="${1:-}"
if [ -z "$REPO" ]; then
  REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner' 2>/dev/null || true)
fi

if [ -z "$REPO" ]; then
  echo "Impossible de déterminer le dépôt. Usage: $0 owner/repo" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) est requis. Installation: https://cli.github.com" >&2
  exit 1
fi

echo "Configuration de la protection de branches sur $REPO..."

protect_branch() {
  local branch="$1"
  echo "→ Protection de la branche '$branch'..."

  gh api \
    --method PUT \
    -H "Accept: application/vnd.github+json" \
    "repos/$REPO/branches/$branch/protection" \
    -f "required_status_checks[strict]=true" \
    -f "required_status_checks[contexts][]=ci" \
    -f "required_status_checks[contexts][]=commitlint" \
    -F "enforce_admins=true" \
    -f "required_pull_request_reviews[required_approving_review_count]=1" \
    -F "required_pull_request_reviews[require_code_owner_reviews]=true" \
    -F "required_pull_request_reviews[dismiss_stale_reviews]=true" \
    -F "restrictions=null" \
    -F "required_linear_history=true" \
    -F "allow_force_pushes=false" \
    -F "allow_deletions=false" \
    -F "required_conversation_resolution=true"

  echo "✓ Branche '$branch' protégée."
}

protect_branch "main"
protect_branch "develop"

echo ""
echo "Terminé. Vérifiez la configuration sur:"
echo "  https://github.com/$REPO/settings/branches"
