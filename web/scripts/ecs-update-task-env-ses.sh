#!/usr/bin/env bash
# Đăng ký revision task definition ECS mới: thêm/cập nhật biến SES (+ tùy chọn NEXT_PUBLIC_APP_URL).
# Task role (event-rsvp-ecs-task-role) đã có ses:SendEmail — cần AWS_REGION + AWS_SES_FROM_EMAIL trên container.
#
# Bắt buộc: AWS_SES_FROM_EMAIL = địa chỉ (hoặc domain) đã verify trong Amazon SES, cùng region AWS_REGION.
#
# Cách dùng:
#   export AWS_PROFILE=newtofu
#   export AWS_SES_FROM_EMAIL=no-reply@your-verified-domain.com
#   # tùy chọn: export NEXT_PUBLIC_APP_URL=https://your-public-origin
#   ./scripts/ecs-update-task-env-ses.sh
#
# Hoặc đặt trong web/scripts/deploy.env (gitignored) rồi:
#   set -a && source scripts/deploy.env && set -a && ./scripts/ecs-update-task-env-ses.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT/scripts/deploy.env}"
if [[ -f "$DEPLOY_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$DEPLOY_ENV_FILE"
  set +a
fi

REGION="${AWS_REGION:-ap-southeast-1}"
FAMILY="${ECS_TASK_FAMILY:-event-rsvp-task-sg}"
CLUSTER="${ECS_CLUSTER:-event-rsvp-cluster-sg}"
SERVICE="${ECS_SERVICE:-event-rsvp-service-sg}"
FROM="${AWS_SES_FROM_EMAIL:-}"
PUB="${NEXT_PUBLIC_APP_URL:-}"

if [[ -z "$FROM" ]]; then
  echo "Error: set AWS_SES_FROM_EMAIL to a verified SES identity (same region as ${REGION})." >&2
  echo "Example: export AWS_SES_FROM_EMAIL=no-reply@example.com" >&2
  exit 1
fi

if ! command -v aws >/dev/null 2>&1 || ! command -v python3 >/dev/null 2>&1; then
  echo "Error: need aws CLI and python3." >&2
  exit 1
fi

TMP="$(mktemp)"
OUT="$(mktemp)"
trap 'rm -f "$TMP" "$OUT"' EXIT

aws ecs describe-task-definition \
  --region "$REGION" \
  --task-definition "$FAMILY" \
  --query 'taskDefinition' \
  --output json > "$TMP"

export ECS_MERGE_TMP="$TMP"
export ECS_MERGE_OUT="$OUT"
export ECS_MERGE_REGION="$REGION"
export ECS_MERGE_FROM="$FROM"
export ECS_MERGE_PUB="$PUB"
python3 << 'PY'
import json
import os
import sys

tmp = os.environ["ECS_MERGE_TMP"]
out = os.environ["ECS_MERGE_OUT"]
region = os.environ["ECS_MERGE_REGION"]
from_addr = os.environ["ECS_MERGE_FROM"]
pub = os.environ.get("ECS_MERGE_PUB", "").strip()

with open(tmp) as f:
    td = json.load(f)

for k in (
    "taskDefinitionArn", "revision", "status", "requiresAttributes",
    "compatibilities", "registeredAt", "registeredBy", "deregisteredAt",
):
    td.pop(k, None)

containers = td.get("containerDefinitions") or []
if not containers:
    sys.exit("No containerDefinitions")
c = next((x for x in containers if x.get("name") == "web"), containers[0])
env_map = {}
for e in c.get("environment") or []:
    if e.get("name"):
        env_map[e["name"]] = e["value"]

env_map["AWS_REGION"] = region
env_map["AWS_SES_FROM_EMAIL"] = from_addr
if pub:
    env_map["NEXT_PUBLIC_APP_URL"] = pub

c["environment"] = [{"name": k, "value": v} for k, v in sorted(env_map.items())]

with open(out, "w") as f:
    json.dump(td, f)

print("Container:", c.get("name") or "(unknown)")
print("Env count:", len(c["environment"]))
PY

NEW_ARN="$(aws ecs register-task-definition \
  --region "$REGION" \
  --cli-input-json "file://$OUT" \
  --query 'taskDefinition.taskDefinitionArn' \
  --output text)"

echo "Registered: $NEW_ARN"

aws ecs update-service \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --task-definition "$NEW_ARN" \
  --force-new-deployment \
  --query 'service.{taskDefinition:taskDefinition,status:status}' \
  --output json

echo "Done. Tasks will roll out with SES env on container \"web\"."
