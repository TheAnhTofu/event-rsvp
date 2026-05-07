#!/usr/bin/env bash
# Build Docker (web + source-backend) → push ECR → EC2 (SSM RunCommand).
#
# Dùng cho account Newtofu (427901343757), EC2 i-01b8a235413c6061a.
# Stack: mạng Docker `event-rsvp-net`, container `source-backend` (:4100 nội bộ),
#        container `event-rsvp-web` (port 80→3000), NEXT rewrite `/api` → BACKEND_URL.
#
# Chuẩn bị một lần trên EC2:
#   - File env secrets: /opt/event-rsvp/.env (chmod 600)
#   - Không cần BACKEND_URL trong file — script gán `-e BACKEND_URL=http://source-backend:4100` cho web.
#   - Nên thêm vào .env (cho CORS / API users nếu cần): USER_API_ALLOWED_ORIGIN khớp domain public
#     (script cũng gán `-e USER_API_ALLOWED_ORIGIN` từ NEXT_PUBLIC_APP_URL).
#
# Chạy local (từ repo, khuyên dùng):
#   AWS_PROFILE=newtofu bash web/scripts/deploy-ec2.sh
#
# Xem thêm: agent/knowledge/04-deployment-aws.md

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$WEB_ROOT"

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$WEB_ROOT/scripts/deploy.env}"
if [[ -f "$DEPLOY_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$DEPLOY_ENV_FILE"
  set +a
fi

REGION="${AWS_REGION:-ap-southeast-1}"
REPO_WEB="${ECR_REPOSITORY:-event-rsvp-web}"
REPO_API="${ECR_API_REPOSITORY:-event-rsvp-api}"
TAG="${IMAGE_TAG:-latest}"
EC2_INSTANCE_ID="${EC2_INSTANCE_ID:-i-01b8a235413c6061a}"
EC2_ENV_FILE_PATH="${EC2_ENV_FILE_PATH:-/opt/event-rsvp/.env}"
EC2_SECRETS_ENV_FILE="${EC2_SECRETS_ENV_FILE:-/opt/event-rsvp/.env.secrets}"
PUBLIC_ORIGIN="${NEXT_PUBLIC_APP_URL:-https://registration.newtofuevents.com}"

if ! command -v docker >/dev/null 2>&1; then
  echo "Error: docker not found." >&2
  exit 1
fi
if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI not found." >&2
  exit 1
fi

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
REGISTRY="${ACCOUNT}.dkr.ecr.${REGION}.amazonaws.com"
IMAGE_WEB="${REGISTRY}/${REPO_WEB}:${TAG}"
IMAGE_API="${REGISTRY}/${REPO_API}:${TAG}"

echo "Account: ${ACCOUNT}  Region: ${REGION}"
echo "Images:  ${IMAGE_WEB}"
echo "         ${IMAGE_API}"
echo "EC2:     instance=${EC2_INSTANCE_ID}, env-file=${EC2_ENV_FILE_PATH}"
echo "         optional secrets env: ${EC2_SECRETS_ENV_FILE} (if present + refresh script on host)"
echo "Public origin (CORS): ${PUBLIC_ORIGIN}"
if [[ -n "${AWS_PROFILE:-}" ]]; then
  echo "AWS_PROFILE=${AWS_PROFILE}"
fi

# Embedded for SSM: always refresh /opt/event-rsvp/.env.secrets from Secrets Manager (no dependency on EC2 copy of ec2-refresh-env-from-secrets.sh).
REFRESH_SCRIPT_B64="$(base64 < "$SCRIPT_DIR/ssm-refresh-prod-secrets.sh" | tr -d '\n')"

aws ecr describe-repositories --repository-names "$REPO_WEB" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO_WEB" --region "$REGION" >/dev/null
aws ecr describe-repositories --repository-names "$REPO_API" --region "$REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name "$REPO_API" --region "$REGION" >/dev/null

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"

echo "docker build API (${DOCKER_PLATFORM}) — context ${REPO_ROOT}"
docker build --platform "$DOCKER_PLATFORM" \
  -f "$REPO_ROOT/source-backend/Dockerfile" \
  -t "${REPO_API}:${TAG}" \
  "$REPO_ROOT"
docker tag "${REPO_API}:${TAG}" "$IMAGE_API"
docker push "$IMAGE_API"

echo "docker build web (${DOCKER_PLATFORM})"
docker build --platform "$DOCKER_PLATFORM" \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:-}" \
  --build-arg NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-https://registration.newtofuevents.com}" \
  --build-arg BACKEND_URL="http://source-backend:4100" \
  --build-arg EVENT_RSVP_DOCKER_BACKEND_URL="http://source-backend:4100" \
  -t "${REPO_WEB}:${TAG}" \
  .
docker tag "${REPO_WEB}:${TAG}" "$IMAGE_WEB"
docker push "$IMAGE_WEB"

echo "Triggering deploy via SSM RunCommand..."

# shellcheck disable=SC2016
COMMAND_ID="$(
  aws ssm send-command \
    --instance-ids "$EC2_INSTANCE_ID" \
    --document-name "AWS-RunShellScript" \
    --comment "Deploy event-rsvp web+api ${TAG}" \
    --parameters "commands=[
      \"docker network create event-rsvp-net 2>/dev/null || true\",
      \"aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${REGISTRY}\",
      \"docker pull ${IMAGE_API}\",
      \"docker pull ${IMAGE_WEB}\",
      \"docker stop event-rsvp-web source-backend 2>/dev/null || true\",
      \"docker rm event-rsvp-web source-backend 2>/dev/null || true\",
      \"if [[ ! -f ${EC2_ENV_FILE_PATH} ]]; then echo 'Env file ${EC2_ENV_FILE_PATH} missing' >&2; exit 1; fi\",
      \"echo '${REFRESH_SCRIPT_B64}' | base64 -d | bash\",
      \"if [[ -f ${EC2_SECRETS_ENV_FILE} ]]; then docker run -d --restart unless-stopped --network event-rsvp-net --name source-backend --env-file ${EC2_ENV_FILE_PATH} --env-file ${EC2_SECRETS_ENV_FILE} -e USER_API_ALLOWED_ORIGIN=${PUBLIC_ORIGIN} -e PORT=4100 ${IMAGE_API}; else docker run -d --restart unless-stopped --network event-rsvp-net --name source-backend --env-file ${EC2_ENV_FILE_PATH} -e USER_API_ALLOWED_ORIGIN=${PUBLIC_ORIGIN} -e PORT=4100 ${IMAGE_API}; fi\",
      \"if [[ -f ${EC2_SECRETS_ENV_FILE} ]]; then docker run -d --restart unless-stopped --network event-rsvp-net -p 80:3000 --name event-rsvp-web --env-file ${EC2_ENV_FILE_PATH} --env-file ${EC2_SECRETS_ENV_FILE} -e BACKEND_URL=http://source-backend:4100 -e PORT=3000 ${IMAGE_WEB}; else docker run -d --restart unless-stopped --network event-rsvp-net -p 80:3000 --name event-rsvp-web --env-file ${EC2_ENV_FILE_PATH} -e BACKEND_URL=http://source-backend:4100 -e PORT=3000 ${IMAGE_WEB}; fi\",
      \"docker ps --filter name=source-backend --filter name=event-rsvp-web --format 'table {{.Names}}\\t{{.Status}}'\"
    ]" \
    --region "$REGION" \
    --query "Command.CommandId" \
    --output text
)"

echo "SSM CommandId: ${COMMAND_ID}"
echo "Waiting for command to finish..."

aws ssm wait command-executed \
  --command-id "$COMMAND_ID" \
  --instance-id "$EC2_INSTANCE_ID" \
  --region "$REGION"

aws ssm get-command-invocation \
  --command-id "$COMMAND_ID" \
  --instance-id "$EC2_INSTANCE_ID" \
  --region "$REGION" \
  --query "{Status:Status,Output:StandardOutputContent,Error:StandardErrorContent}" \
  --output json

echo "Done."
