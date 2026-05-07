# Deployment – AWS (ECR + EC2) & Cloudflare DNS

Tài liệu cho agent và dev: cách đóng gói app `web/` và triển khai production trên **AWS** (team **Newtofu**).

## Stack triển khai (production)

| Thành phần | Chi tiết |
|------------|----------|
| App | Next.js 16, `output: "standalone"` trong `web/next.config.ts` |
| Container | `web/Dockerfile` — Node Alpine, port **3000**, `CMD ["node","server.js"]` |
| Registry | **Amazon ECR** — `event-rsvp-web` (Next.js), `event-rsvp-api` (`source-backend` Express) |
| Runtime | **Amazon EC2** (`t3.small`, Docker, Elastic IP cố định) |
| Database (production) | **Amazon RDS** PostgreSQL — instance `event-rsvp-pg` (xem mục RDS). `DATABASE_URL` trên EC2 (`/opt/event-rsvp/.env`) trỏ RDS; full pipeline: `npm run deploy:ec2:migrate` (migrate + cập nhật env + admin + deploy). |
| DNS/CDN | **Cloudflare** proxy (SSL Flexible) |

### CPU / Docker (quan trọng)

- EC2 instance dùng **x86_64** (Amazon Linux 2023): image phải là **`linux/amd64`**.
- Build trên Mac Apple Silicon (ARM) phải chỉ định `--platform linux/amd64`, nếu không → `exec format error`.
- Script `deploy-ecs.sh` dùng `docker build --platform linux/amd64` (override bằng **`DOCKER_PLATFORM`**).

## Account & tài nguyên production (Newtofu)

- **AWS account:** `427901343757` (CLI profile **`newtofu`**).
- **Region:** `ap-southeast-1` (Singapore).
- **ECR URI (image):**
  `427901343757.dkr.ecr.ap-southeast-1.amazonaws.com/event-rsvp-web`
  Tag mặc định: `latest` (hoặc `IMAGE_TAG` tùy chỉnh).

### EC2 (production — thay thế ECS Fargate)

| Tài nguyên | Giá trị |
|------------|---------|
| Instance ID | `i-01b8a235413c6061a` |
| Instance type | `t3.small` |
| AMI | `ami-0edcb6af303da036a` (Amazon Linux 2023 x86_64) |
| Key pair | `ingestion-private-key` |
| Security Group | `sg-0e0d93e91c1a253cc` (`event-rsvp-ec2-sg`) — ports 22/80/443/3000 |
| Subnet | `subnet-0ddf392e5c686c9f9` (ap-southeast-1a, public) |
| **Elastic IP** | **`18.143.210.189`** (`eipalloc-0e657173ee7000e01`) — **cố định**, không đổi khi restart |
| Docker mapping | `-p 80:3000` (Cloudflare kết nối origin port 80) |

| **IAM Instance Profile** | `event-rsvp-ec2-profile` (role `event-rsvp-ec2-role`, policy `AmazonEC2ContainerRegistryReadOnly`) |

**Production (hiện tại):** hai container trên cùng EC2, mạng Docker `event-rsvp-net`:
- **`source-backend`** — image `event-rsvp-api`, lắng nghe **4100** (chỉ nội bộ mạng).
- **`event-rsvp-web`** — image `event-rsvp-web`, **80→3000**; **`BACKEND_URL=http://source-backend:4100`** (server-side rewrite `/api/*` tới Express).

Env file trên EC2 (ví dụ `/opt/event-rsvp/.env`) dùng chung cho cả hai; script deploy gán thêm `-e BACKEND_URL=...` và `-e USER_API_ALLOWED_ORIGIN=<NEXT_PUBLIC_APP_URL>` cho API.

Triển khai: `bash web/scripts/deploy-ec2.sh` (build `linux/amd64`, push ECR, SSM pull + `docker run`). Trước đó: `docker build` cần **context repo** cho API (`source-backend/Dockerfile` dùng `web/src`).

EC2 tự động lấy credentials ECR qua instance profile — không cần chạy `aws ecr get-login-password` thủ công.

### RDS PostgreSQL (production — Newtofu)

| Tài nguyên | Giá trị |
|------------|--------|
| Instance identifier | `event-rsvp-pg` |
| Engine | PostgreSQL **16.13** |
| Class | `db.t4g.micro` |
| Storage | 20 GB gp3, encrypted |
| **Endpoint** (port 5432) | `event-rsvp-pg.cig2egsbafa6.ap-southeast-1.rds.amazonaws.com` |
| DB name (initial) | `eventrsvp` |
| Master user | `eventrsvp` |
| VPC | `vpc-0833ffd2c1c803f40` |
| DB subnet group | `event-rsvp-db-subnet` — `subnet-0ddf392e5c686c9f9` (1a), `subnet-031f9e40ba26948ac` (1b) |
| SG RDS | `event-rsvp-rds-sg` (`sg-00977a1c96721026a`) — **inbound 5432:** từ `event-rsvp-ec2-sg` (`sg-0e0d93e91c1a253cc`) **và** rule `0.0.0.0/0` (dev/local — nên thu hẹp IP khi không cần). |
| Public access | **Có** (`PubliclyAccessible`) — endpoint DNS trùng; kết nối từ local cần TLS (`ssl` / `DATABASE_SSL=require` trong app). |

**App:** driver DB là **`postgres`** (postgres.js) trong `web/src/db/postgres.ts` — không dùng `@neondatabase/serverless`.

**Credentials:** không commit. Bản ghi cục bộ sau khi provision (gitignored): `web/.env.rds.generated`. Trên EC2: đặt `DATABASE_URL` trong `/opt/event-rsvp/.env` (hoặc tương đương) cùng các biến app khác. **Migration:** `npm run db:migrate` (khi có route) hoặc `npm run db:migrate:ec2` qua SSM.

Quyết định chi tiết: `agent/memory/decisions.md` (2026-04-02 – RDS PostgreSQL 16).

### ECS Fargate (đã xóa hoàn toàn — 2026-03-31)

- Cluster `event-rsvp-cluster-sg`, Service `event-rsvp-service-sg`, Task definitions `event-rsvp-task-sg:1-4` — **đã xóa**.
- IP cũ `54.169.74.22` — không còn tồn tại.

## Cloudflare DNS & Redirect

| Record | Type | Target | Proxied |
|--------|------|--------|---------|
| `registration.newtofuevents.com` | A | `18.143.210.189` (EC2 Elastic IP) | Yes |
| `www.newtofuevents.com` | AAAA | `100::` (dummy, Cloudflare xử lý redirect) | Yes |

| Rule | Expression | Action |
|------|-----------|--------|
| www redirect | `http.host eq "www.newtofuevents.com"` | 301 → `https://newtofu.com` |

- **SSL mode:** Flexible (Cloudflare → origin HTTP port 80).
- **Zone ID:** `75010ef7139428cce747e0f017cab172`.
- **Public URL:** `https://registration.newtofuevents.com`

## Deploy flow (EC2)

1. Một lần: tạo file env trên EC2 `/opt/event-rsvp/.env` (chmod 600), chứa `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `STRIPE_*`, `AWS_*`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, v.v. — **không** cần ghi `BACKEND_URL` (script gán khi chạy web).
2. Local (profile `newtofu`): từ root repo chạy  
   `AWS_PROFILE=newtofu bash web/scripts/deploy-ec2.sh`  
   Script: tạo repo ECR nếu thiếu → build **API** (`docker build -f source-backend/Dockerfile .` từ **root repo**) → build **web** (`web/`) → push hai tag → SSM trên EC2: `docker network create event-rsvp-net`, pull hai image, `docker run` **source-backend** rồi **event-rsvp-web**.
3. SSH tay (nếu không dùng script): pull cả `…/event-rsvp-web:latest` và `…/event-rsvp-api:latest`, cùng lệnh `docker run` như trên (xem `web/scripts/deploy-ec2.sh`).

### Biến môi trường script

| Biến | Mặc định | Mô tả |
|------|-----------|--------|
| `AWS_PROFILE` | *(không set)* | Bắt buộc dùng `newtofu` nếu default account không phải Newtofu |
| `AWS_REGION` | `ap-southeast-1` | Region ECR/ECS |
| `ECR_REPOSITORY` | `event-rsvp-web` | Repo ECR — image Next.js |
| `ECR_API_REPOSITORY` | `event-rsvp-api` | Repo ECR — image `source-backend` |
| `IMAGE_TAG` | `latest` | Tag image push lên ECR |
| `DOCKER_PLATFORM` | `linux/amd64` | Phải khớp kiến trúc EC2 (x86) |

## Biến runtime trên EC2 (file env + override từ deploy)

Không commit giá trị thật. File `/opt/event-rsvp/.env` nạp cho **cả hai** container; script deploy **ghi đè** thêm:

- Web: `BACKEND_URL=http://source-backend:4100`
- API: `USER_API_ALLOWED_ORIGIN=<NEXT_PUBLIC_APP_URL>`, `PORT=4100`

Biến chung (ví dụ):

- `DATABASE_URL` (Postgres — **RDS**; xem mục RDS)
- `NEXT_PUBLIC_APP_URL` (`https://registration.newtofuevents.com`)
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `BACKEND_URL` — không bắt buộc trong file (web nhận từ `docker run -e`)
- `AWS_REGION`, `AWS_SES_FROM_EMAIL`, `BANK_SLIP_BUCKET`, …
- `SLACK_WEBHOOK_URL`
- API nội bộ: `CRM_API_BASE_URL` (proxy CRM tới crm-api), `INTERNAL_QUEUE_PROCESS_TOKEN`, v.v.

Cập nhật file này khi đổi instance/IP/domain hoặc quy trình deploy.

### Runtime config (admin UI)

- Trang **`/admin/config`**: chọn **Stripe live vs test**, **PaymentAsia sandbox vs production** (URL hosted `payment-sandbox.pa-sys.com` vs `payment.pa-sys.com`; credential vẫn từ env `PAYMENTASIA_MERCHANT_TOKEN` / `PAYMENTASIA_SECRET_CODE`), **email provider** (`auto` / SES / Resend), **Resend trước** trong chế độ auto. Lưu trong Postgres bảng `app_runtime_settings` (migration **`010_app_runtime_settings.sql`**); ghi đè biến môi trường cho đến khi **Use env only**. Chạy migration: `cd web && npm run db:migrate` (hoặc `db:migrate:ec2`).

### AWS Secrets Manager — tích hợp deploy EC2

1. Tạo secret dạng JSON (ví dụ tên `event-rsvp/prod/config`). Key là tên biến env **một dòng**: `STRIPE_SECRET_KEY_LIVE`, `STRIPE_WEBHOOK_SECRET_LIVE`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `PAYMENTASIA_MERCHANT_TOKEN`, `PAYMENTASIA_SECRET_CODE`, `PAYMENTASIA_USE_SANDBOX`, `PAYMENTASIA_API_KEY` (tuỳ chọn — gateway REST), `RESEND_API_KEY`, `DATABASE_URL`, … — **không** commit file này vào git. PaymentAsia live: `PAYMENTASIA_USE_SANDBOX=false` (hoặc tắt sandbox trên `/admin/config` khi DB override bật).
2. IAM **instance profile** của EC2: `secretsmanager:GetSecretValue` (+ `kms:Decrypt` nếu secret dùng KMS CMK). `SecretsManagerReadWrite` dùng được để tạo/sửa secret; runtime chỉ cần **Get** trên ARN cụ thể.
3. Trên EC2: copy `web/scripts/ec2-refresh-env-from-secrets.sh` → `/opt/event-rsvp/ec2-refresh-env-from-secrets.sh`, `chmod 755`.
4. Trong `/opt/event-rsvp/.env` thêm `EVENT_RSVP_SECRET_ID=event-rsvp/prod/config` (và `AWS_REGION` nếu chưa có). Script ghi `/opt/event-rsvp/.env.secrets` (chmod 600).
5. `deploy-ec2.sh`: trước mỗi deploy gọi refresh script nếu tồn tại; `docker run` nạp `--env-file /opt/event-rsvp/.env` và, **nếu file tồn tại**, thêm `--env-file /opt/event-rsvp/.env.secrets`. Biến `EC2_SECRETS_ENV_FILE` (mặc định `/opt/event-rsvp/.env.secrets`) khớp đường dẫn file.

**Lưu ý Next.js:** `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` được bake vào bundle lúc **`docker build`** (build-arg trong `deploy-ec2.sh` / `deploy.env` local). Không thể chỉ đổi publishable key trên EC2 bằng file secrets mà không rebuild image — giữ publishable test/live trong môi trường build hoặc rebuild sau khi đổi key.

## Dozzle (giám sát log Docker, có đăng nhập)

- Cấu hình: `docker-compose.yml` service **`dozzle`**, UI **`http://localhost:8888`** (compose bind **`127.0.0.1:8888`** — chỉ máy host).
- **Auth bắt buộc:** `DOZZLE_AUTH_PROVIDER=simple`, user/password trong **`ops/dozzle/data/users.yml`** (bcrypt). Mặc định dev: **`admin` / `changeme`** — đổi trước khi expose mạng; tạo lại file:  
  `docker run --rm amir20/dozzle:latest generate admin --password '...' --name "Admin" --email you@example.com`
- Phiên đăng nhập: **`DOZZLE_AUTH_TTL=8h`** (hết hạn phải đăng nhập lại).
- **EC2 / production:** không publish Dozzle ra internet thẳng; ưu tiên SSH tunnel tới `127.0.0.1:8888`, **Cloudflare Zero Trust**, hoặc security group chỉ IP quản trị. Nếu sửa compose thành `8888:8080` (mọi interface), bắt buộc firewall + đổi password mạnh.

## S3 — public read cho prefix receipt (admin dashboard)

**Production (Newtofu):** bucket **`event-rsvp-bank-slips-prod`** — upload bank slip vào prefix **`bank-slips/`** (`BANK_SLIP_BUCKET`). Policy gộp public read cho **`email-assets/*`** và **`bank-slips/*`** đã áp dụng; file tham chiếu: `web/scripts/s3-bank-slips-public-policy.json` (chỉnh ARN nếu đổi bucket).

Nếu bucket chặn public và dashboard cần URL HTTPS trực tiếp (không qua proxy `/api/admin/bank-slips/...`), có thể **chỉ** mở prefix ví dụ `receipts/*` hoặc `bank-slips/*`:

```bash
# Thay BUCKET và PREFIX; profile newtofu, region ap-southeast-1
aws s3api put-bucket-policy --bucket BUCKET --policy file://policy.json
```

`policy.json` (ví dụ read-only list + get cho prefix):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadReceiptPrefix",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::BUCKET/PREFIX*"
    }
  ]
}
```

Hoặc bật **Object Ownership** + **Block Public Access** từng mức phù hợp; ưu tiên **CloudFront OAC** nếu chỉ cần CDN đọc object — không bắt buộc public toàn bucket.

## AWS Secrets Manager — quyền IAM gợi ý

Để app (EC2 instance role hoặc task role) đọc secret và inject env:

- `secretsmanager:GetSecretValue` trên `arn:aws:secretsmanager:region:account:secret:event-rsvp/*`
- Tuỳ chọn: `secretsmanager:DescribeSecret`, `kms:Decrypt` nếu secret dùng KMS customer-managed key.

Managed policy **`SecretsManagerReadWrite`** quá rộng cho runtime — nên policy tùy biến chỉ Get trên ARN cụ thể.

**Quyền “tối đa” trên Secrets Manager (AWS managed, không khuyến nghị gán cho app):** **`SecretsManagerFullAccess`** — toàn quyền CRUD + rotation metadata trên mọi secret trong account (trừ khi bị SCP giới hạn). **`SecretsManagerReadWrite`** hẹp hơn một chút nhưng vẫn quá mạnh cho chỉ đọc secret lúc boot. **Chỉ nên gán `SecretsManagerFullAccess` / `ReadWrite` cho role admin** hoặc pipeline tạo secret; **EC2 app** dùng policy tùy chỉnh: `secretsmanager:GetSecretValue` (+ `kms:Decrypt` nếu secret dùng KMS CMK) trên ARN secret cụ thể.

Luồng: tạo secret (JSON key/value) → SSM/UserData hoặc **entrypoint** gọi `aws secretsmanager get-secret-value` → export env trước `node server.js` — hoặc dùng **Parameter Store** (`ssm:GetParameters`) cho flag nhẹ (Stripe live, Resend primary).

## Terraform

Có ích khi team cần **state** cho EC2, SG, RDS, ECR, IAM, Secrets — tránh drift. Không bắt buộc nếu hiện chỉ 1 EC2 + RDS + deploy script: có thể bổ sung Terraform dần (module VPC → RDS → EC2). Trade-off: overhead học curve vs lợi reproduce môi trường.

## Xem thêm

- Bài học tổng hợp (521, SES, IAM, migration): `05-aws-cloudflare-ses-lesson.md`
- Skill Cursor (quy trình): `.cursor/skills/aws-cloudflare-ses-setup/SKILL.md`
