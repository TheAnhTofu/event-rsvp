#!/usr/bin/env bash
# RDS trên EC2: chạy migration → ghi DATABASE_URL trên host → upsert admin CRM → deploy containers.
# Cần: AWS CLI, web/.env.rds.generated (hoặc DATABASE_URL), tuỳ chọn web/.env.admin.local.
#
#   AWS_PROFILE=newtofu bash web/scripts/ec2-migrate-and-deploy.sh
#
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$WEB_ROOT"

echo ">>> 1/4 db:migrate:ec2 (schema trên RDS)"
npm run db:migrate:ec2

echo ">>> 2/4 set-ec2-database-url-from-rds"
node scripts/set-ec2-database-url-from-rds.mjs

echo ">>> 3/4 create-admin-ec2-ssm (upsert CRM admin trên RDS)"
if [[ -f .env.admin.local ]]; then
  node --env-file=.env.admin.local scripts/create-admin-ec2-ssm.mjs admin@newtofu.com
else
  echo "Warning: web/.env.admin.local missing — skip admin upsert. Run:" >&2
  echo "  node scripts/create-admin-ec2-ssm.mjs admin@you.com 'password'" >&2
fi

echo ">>> 4/4 deploy-ec2.sh"
bash scripts/deploy-ec2.sh

echo "Done. DATABASE_URL on EC2 should be RDS; containers restarted."
