#!/usr/bin/env bash
# Chạy TRÊN EC2 (hoặc qua SSM: base64 -d | bash). Refresh secret → /opt/event-rsvp/.env.secrets, recreate source-backend.
set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
SECRET_ID="${EVENT_RSVP_SECRET_ID:-event-rsvp/prod/config}"
OUT="/opt/event-rsvp/.env.secrets"
PUBLIC_ORIGIN="${NEXT_PUBLIC_APP_URL:-https://registration.newtofuevents.com}"
EC2_ENV_FILE_PATH="${EC2_ENV_FILE_PATH:-/opt/event-rsvp/.env}"

aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text |
  python3 -c '
import json, sys, os
raw = sys.stdin.read().strip()
if not raw:
    sys.exit(1)
data = json.loads(raw)
lines = []
for k, v in data.items():
    if v is None:
        continue
    if isinstance(v, (dict, list)):
        continue
    s = str(v).replace("\n", " ")
    if any(c in s for c in "\"$`"):
        print("skip unsafe value for " + k, file=sys.stderr)
        continue
    lines.append(k + "=" + s)
path = "/opt/event-rsvp/.env.secrets"
with open(path, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")
os.chmod(path, 0o600)
print("wrote " + path + " (" + str(len(lines)) + " keys)", file=sys.stderr)
'

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE_API="${REGISTRY}/event-rsvp-api:latest"

if [[ ! -f "$EC2_ENV_FILE_PATH" ]]; then
  echo "Missing $EC2_ENV_FILE_PATH" >&2
  exit 1
fi

docker stop source-backend 2>/dev/null || true
docker rm source-backend 2>/dev/null || true

docker run -d --restart unless-stopped --network event-rsvp-net --name source-backend \
  --env-file "$EC2_ENV_FILE_PATH" --env-file "$OUT" \
  -e "USER_API_ALLOWED_ORIGIN=${PUBLIC_ORIGIN}" -e PORT=4100 \
  "$IMAGE_API"

docker ps --filter name=source-backend --format 'table {{.Names}}\t{{.Status}}'
