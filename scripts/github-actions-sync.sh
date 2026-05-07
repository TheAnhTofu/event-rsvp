#!/usr/bin/env bash
# Sync Actions secrets/variables for .github/workflows/deploy-ec2.yml (gh CLI).
# Requires: gh auth login. Optional: aws CLI for account id discovery.
#
# Examples:
#   ./scripts/github-actions-sync.sh --account-only
#   GITHUB_ACTIONS_AWS_ROLE_ARN="arn:aws:iam::123456789012:role/gh-event-rsvp-deploy" \
#     NEXT_PUBLIC_APP_URL="https://example.com" \
#     ./scripts/github-actions-sync.sh

set -euo pipefail

ACCOUNT_ONLY=false
if [[ "${1:-}" == "--account-only" ]]; then
  ACCOUNT_ONLY=true
fi

REPO="${GH_REPO:-}"
if [[ -z "$REPO" ]]; then
  REPO="$(gh repo view --json nameWithOwner -q .nameWithOwner)"
fi

resolve_account_id() {
  if [[ -n "${GITHUB_ACTIONS_AWS_ACCOUNT_ID:-}" ]]; then
    printf '%s' "$GITHUB_ACTIONS_AWS_ACCOUNT_ID"
    return
  fi
  if [[ -n "${AWS_ACCOUNT_ID:-}" ]]; then
    printf '%s' "$AWS_ACCOUNT_ID"
    return
  fi
  aws sts get-caller-identity --query Account --output text 2>/dev/null || true
}

ACCOUNT_ID="$(resolve_account_id)"
if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "None" ]]; then
  echo "Could not resolve AWS account id. Set AWS_ACCOUNT_ID or run aws configure." >&2
  exit 1
fi

echo "Repository: $REPO"
echo "Setting variable AWS_ACCOUNT_ID"
gh variable set AWS_ACCOUNT_ID --repo "$REPO" --body "$ACCOUNT_ID"

if $ACCOUNT_ONLY; then
  echo "Done (--account-only)."
  exit 0
fi

ROLE_ARN="${GITHUB_ACTIONS_AWS_ROLE_ARN:-}"
if [[ -z "$ROLE_ARN" ]]; then
  echo "Skipping secret AWS_ROLE_TO_ASSUME (set GITHUB_ACTIONS_AWS_ROLE_ARN to create OIDC role ARN)." >&2
  echo "Deploy workflow runs only when this secret and AWS_ACCOUNT_ID are both set."
  exit 0
fi

echo "Setting secret AWS_ROLE_TO_ASSUME"
printf '%s' "$ROLE_ARN" | gh secret set AWS_ROLE_TO_ASSUME --repo "$REPO"

if [[ -n "${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" ]]; then
  echo "Setting variable NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  gh variable set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY --repo "$REPO" --body "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
fi

if [[ -n "${NEXT_PUBLIC_APP_URL:-}" ]]; then
  echo "Setting variable NEXT_PUBLIC_APP_URL"
  gh variable set NEXT_PUBLIC_APP_URL --repo "$REPO" --body "$NEXT_PUBLIC_APP_URL"
fi

echo "Done. Check: gh secret list -R $REPO && gh variable list -R $REPO"
