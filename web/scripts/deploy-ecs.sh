#!/usr/bin/env bash
# Build Docker → push ECR → ECS rolling deploy (force new tasks).
#
# Cách nhanh (Newtofu):
#   cp scripts/deploy.env.example scripts/deploy.env
#   cd web && ./scripts/deploy-ecs.sh
#
# Hoặc export tay:
#   export AWS_PROFILE=newtofu
#   export ECS_CLUSTER=event-rsvp-cluster-sg ECS_SERVICE=event-rsvp-service-sg
#   ./scripts/deploy-ecs.sh
#
# Xem: agent/knowledge/04-deployment-aws.md

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

DEPLOY_ENV_FILE="${DEPLOY_ENV_FILE:-$ROOT/scripts/deploy.env}"
if [[ -f "$DEPLOY_ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$DEPLOY_ENV_FILE"
  set +a
fi

REGION="${AWS_REGION:-ap-southeast-1}"
REPO="${ECR_REPOSITORY:-event-rsvp-web}"
TAG="${IMAGE_TAG:-latest}"
CLUSTER="${ECS_CLUSTER:?Set ECS_CLUSTER or add it to scripts/deploy.env}"
SERVICE="${ECS_SERVICE:?Set ECS_SERVICE or add it to scripts/deploy.env}"

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
IMAGE="${REGISTRY}/${REPO}:${TAG}"

echo "Account: ${ACCOUNT}  Region: ${REGION}  Image: ${IMAGE}"
echo "ECS: cluster=${CLUSTER} service=${SERVICE}"
if [[ -n "${AWS_PROFILE:-}" ]]; then
  echo "AWS_PROFILE=${AWS_PROFILE}"
fi

aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "$REGISTRY"

# ECS Fargate mặc định = linux/amd64. Build trên Mac ARM mà không set platform → image arm64 → "exec format error" trên Fargate.
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/amd64}"
echo "docker build --platform ${DOCKER_PLATFORM} (override: DOCKER_PLATFORM=linux/arm64 nếu task dùng Graviton)"
docker build --platform "$DOCKER_PLATFORM" -t "${REPO}:${TAG}" .
docker tag "${REPO}:${TAG}" "$IMAGE"
docker push "$IMAGE"

aws ecs update-service \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --service "$SERVICE" \
  --force-new-deployment \
  --query 'service.{status:status,taskDefinition:taskDefinition,runningCount:runningCount,pendingCount:pendingCount}' \
  --output table

echo "Done. Tasks will roll out; check ECS → service → Deployments."
