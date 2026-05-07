#!/usr/bin/env bash
# Gắn quyền Amazon SES SendEmail vào IAM role mà ECS task đang dùng (task role).
#
# Yêu cầu: aws CLI, quyền iam:PutRolePolicy (và ecs:Describe*) trên account.
#
# Cách dùng (Newtofu):
#   cd web
#   export AWS_PROFILE=newtofu
#   ./scripts/ecs-attach-ses-task-role.sh
#
# Hoặc nạp deploy.env:
#   set -a && source scripts/deploy.env && set +a && ./scripts/ecs-attach-ses-task-role.sh
#
# Biến tùy chọn:
#   ECS_CLUSTER, ECS_SERVICE — mặc định như deploy.env.example
#   SES_POLICY_NAME — tên inline policy (mặc định: EventRsvpSesSendEmail)
#   AWS_REGION — mặc định ap-southeast-1

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
CLUSTER="${ECS_CLUSTER:-event-rsvp-cluster-sg}"
SERVICE="${ECS_SERVICE:-event-rsvp-service-sg}"
POLICY_NAME="${SES_POLICY_NAME:-EventRsvpSesSendEmail}"

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI not found." >&2
  exit 1
fi

TASK_DEF_ARN="$(aws ecs describe-services \
  --region "$REGION" \
  --cluster "$CLUSTER" \
  --services "$SERVICE" \
  --query 'services[0].taskDefinition' \
  --output text)"

if [[ -z "$TASK_DEF_ARN" || "$TASK_DEF_ARN" == "None" ]]; then
  echo "Error: could not read taskDefinition for cluster=${CLUSTER} service=${SERVICE}" >&2
  exit 1
fi

TASK_ROLE_ARN="$(aws ecs describe-task-definition \
  --region "$REGION" \
  --task-definition "$TASK_DEF_ARN" \
  --query 'taskDefinition.taskRoleArn' \
  --output text)"

if [[ -z "$TASK_ROLE_ARN" || "$TASK_ROLE_ARN" == "None" ]]; then
  echo "Error: task definition has no taskRoleArn." >&2
  echo "Add a task IAM role to the ECS task definition (khác execution role), rồi chạy lại." >&2
  exit 1
fi

# arn:aws:iam::ACCOUNT:role/NAME hoặc role/path/NAME
ROLE_NAME="${TASK_ROLE_ARN#*role/}"

POLICY_FILE="$(mktemp)"
trap 'rm -f "$POLICY_FILE"' EXIT
cat > "$POLICY_FILE" <<'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "SesSendEmailForApp",
      "Effect": "Allow",
      "Action": ["ses:SendEmail"],
      "Resource": "*"
    }
  ]
}
EOF

echo "Cluster:     $CLUSTER"
echo "Service:     $SERVICE"
echo "Task def:    $TASK_DEF_ARN"
echo "Task role:   $TASK_ROLE_ARN"
echo "Role name:   $ROLE_NAME"
echo "Policy name: $POLICY_NAME"
echo ""

aws iam put-role-policy \
  --role-name "$ROLE_NAME" \
  --policy-name "$POLICY_NAME" \
  --policy-document "file://$POLICY_FILE"

echo "Done: inline policy ${POLICY_NAME} attached to role ${ROLE_NAME}."
echo "Deploy lại task hoặc đợi task mới nếu role đã đúng trước đó — credential lấy từ task role ngay khi container start."
