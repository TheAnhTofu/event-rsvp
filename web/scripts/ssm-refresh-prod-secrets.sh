#!/usr/bin/env bash
# Run on EC2 during deploy: pull event-rsvp/prod/config → /opt/event-rsvp/.env.secrets
set -euo pipefail
REGION="${AWS_REGION:-ap-southeast-1}"
aws secretsmanager get-secret-value \
  --secret-id event-rsvp/prod/config \
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
