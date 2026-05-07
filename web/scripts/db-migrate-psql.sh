#!/usr/bin/env bash
# Chạy toàn bộ migration bằng psql — khi DATABASE_URL tới Postgres **có route**
# (localhost, Docker Compose, RDS public, hoặc tunnel/bastion).
#
# Nạp: env DATABASE_URL hoặc file web/.env.local / web/.env.rds.generated
#
# Usage (từ thư mục web/):
#   export DATABASE_URL='postgresql://...'
#   bash scripts/db-migrate-psql.sh

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  if [[ -f .env.local ]]; then
    set -a
    # shellcheck disable=SC1091
    source .env.local
    set +a
  fi
fi
if [[ -z "${DATABASE_URL:-}" ]] && [[ -f .env.rds.generated ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env.rds.generated
  set +a
fi
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL or create .env.local / .env.rds.generated" >&2
  exit 1
fi

export PGSSLMODE="${PGSSLMODE:-require}"

FILES=(
  db/migrations/001_init.sql
  db/migrations/002_paypal_to_stripe.sql
  db/migrations/003_email_logs.sql
  db/migrations/004_audience_type_and_status.sql
  db/migrations/005_bank_transfer_slips.sql
  db/migrations/006_approval_workflow.sql
  db/migrations/007_email_logs_provider.sql
  db/migrations/007_registration_status_events.sql
  db/migrations/008_admin_users.sql
  db/migrations/009_payment_status_pending.sql
  db/migrations/010_app_runtime_settings.sql
  db/migrations/011_admin_users_profile.sql
  db/migrations/012_discount_codes.sql
  db/migrations/013_early_bird_discount.sql
  db/migrations/014_discount_auto_apply.sql
  db/migrations/016_payment_pending_and_amounts.sql
  db/migrations/017_additional_discount_code.sql
  db/migrations/018_discount10_code.sql
  db/migrations/019_registrations_discount_code.sql
  db/migrations/020_qfpay.sql
  db/migrations/021_paymentasia.sql
  db/migrations/022_paymentasia_merchant_refs.sql
  db/migrations/023_pipeline_stage_column.sql
  db/migrations/024_check_in_logs.sql
  db/migrations/025_registration_member_columns.sql
  db/migrations/026_test_discount_99_9.sql
)

for f in "${FILES[@]}"; do
  echo "=== $f ==="
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"
done
echo "Done."
