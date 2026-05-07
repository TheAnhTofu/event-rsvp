#!/usr/bin/env bash
# On EC2: pull JSON from AWS Secrets Manager and write KEY=value lines for Docker --env-file.
# Requires: aws CLI (instance profile), python3 (Amazon Linux 2023).
#
# One-time on EC2:
#   sudo cp ec2-refresh-env-from-secrets.sh /opt/event-rsvp/ec2-refresh-env-from-secrets.sh
#   sudo chmod 755 /opt/event-rsvp/ec2-refresh-env-from-secrets.sh
# Optional in /opt/event-rsvp/.env:
#   EVENT_RSVP_SECRET_ID=event-rsvp/prod/config
#   AWS_REGION=ap-southeast-1
#
# Create secret (example — replace values in AWS Console or CLI, do not commit):
#   aws secretsmanager create-secret --name event-rsvp/prod/config --secret-string file://secret.json
#
# secret.json keys (plain strings): STRIPE_SECRET_KEY_LIVE, STRIPE_WEBHOOK_SECRET_LIVE,
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, RESEND_API_KEY, DATABASE_URL, ...

set -euo pipefail

REGION="${AWS_REGION:-ap-southeast-1}"
OUT="${EVENT_RSVP_SECRETS_ENV_FILE:-/opt/event-rsvp/.env.secrets}"

if [[ -f /opt/event-rsvp/.env ]]; then
  set -a
  # shellcheck disable=SC1091
  source /opt/event-rsvp/.env
  set +a
fi

SECRET_ID="${EVENT_RSVP_SECRET_ID:-}"
# Repo-root `.env` on EC2 may set EVENT_RSVP_SECRET_ID empty — still refresh prod secret.
if [[ -z "$SECRET_ID" ]]; then
  SECRET_ID="event-rsvp/prod/config"
fi

TMP="$(mktemp)"
aws secretsmanager get-secret-value \
  --secret-id "$SECRET_ID" \
  --region "$REGION" \
  --query SecretString \
  --output text \
  | python3 -c '
import json, sys
raw = sys.stdin.read().strip()
if not raw:
    sys.exit(1)
data = json.loads(raw)
for k, v in data.items():
    if v is None:
        continue
    if isinstance(v, (dict, list)):
        continue
    s = str(v).replace("\n", " ")
    if any(c in s for c in "\"\$`"):
        print(f"ec2-refresh-env-from-secrets: skip unsafe value for {k}", file=sys.stderr)
        continue
    print(f"{k}={s}")
' > "$TMP"

install -m 600 "$TMP" "$OUT"
rm -f "$TMP"
echo "ec2-refresh-env-from-secrets: wrote $OUT"
