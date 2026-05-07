# Decisions (ADR-style)

Quyết định kỹ thuật và kiến trúc – cập nhật khi có thay đổi.

---

## 2026-04-03 – Một file env ở root repo (`.env.local`)

- **Context:** Nhiều file `.env*` rải ở `web/` và `source-backend/` khó đồng bộ.
- **Decision:** Template gộp tại `/.env.example`; dev copy thành `/.env.local`. Next (`web/next.config.ts`) gọi `loadEnvConfig(repoRoot)`; Express nạp qua `loadRootEnv()` trong `config.ts` (`source-backend/src/load-root-env.ts`). Docker Compose `env_file: .env.local`. Script `npm run db:seed` / `db:create-admin` dùng `node --env-file=../.env.local`.
- **Consequences:** Gộp tay các biến từ file cũ vào root `.env.local`; không commit file đó (đã có trong `/.gitignore`).

## 2026-04-03 – Runtime config admin + Secrets Manager trên EC2

- **Context:** Cần đổi Stripe live/test và email provider không qua SSH; đưa secret keys lên AWS Secrets Manager thay vì chỉ file `.env`.
- **Decision:** Bảng Postgres `app_runtime_settings` (migration `010`) + cache `app-runtime-settings-cache.ts` — ghi đè env cho `stripeUseLiveMode`, `EMAIL_PROVIDER`, Resend-first. API `GET/PATCH /api/admin/runtime-config` (Express); UI `/admin/config`. Deploy: script `ec2-refresh-env-from-secrets.sh` + `EVENT_RSVP_SECRET_ID`; `deploy-ec2.sh` nạp thêm `--env-file .env.secrets` nếu file tồn tại.
- **Consequences:** Chạy migration production; gắn quyền `GetSecretValue` cho instance profile; không commit secret JSON.

## 2026-05-06 – Đồng bộ committee meeting IDs với event week 9–13 Nov

- **Context:** Figma `2:824` + tất cả message strings (`"9-13 November 2026"`) đã shift event week từ 11–15 Nov sang 9–13 Nov. Frontend JSON `committeeMeetingDayGroups` đã sửa label nhưng giữ ID cũ `nov11_*/nov12_*/nov13_*` (mismatch cosmetic). Backend `source-backend/src/lib/committee-meetings.ts` còn nguyên cả label cũ ("Mon 11 Nov", v.v.) lẫn ID cũ — email/PDF backend in sai ngày họp.
- **Decision:** Rename committee IDs theo ngày thật: `nov11_*→nov9_*` (Mon ARC/SF/PDC), `nov12_*→nov10_*` (Tue MPC/SWG/IAC), `nov13_*→nov11_*` (Wed ExCo/AGM/Post-AGM ExCo). Sync 3 file: `web/src/content/registration-event-content.json`, `web/src/lib/committee-meetings.ts`, `source-backend/src/lib/committee-meetings.ts` (và sửa luôn day labels backend về Mon 9 / Tue 10 / Wed 11). Schema Zod tự cập nhật vì import `committeeMeetingValues`.
- **Consequences:** Registrations cũ trong DB dùng ID `nov11_arc` v.v. sẽ **fail Zod validation khi đọc lại** (user đã đồng ý xóa data cũ). Cần chạy `DELETE FROM registrations` (hoặc UPDATE migrate IDs) trước khi promote build mới lên prod. `industryEventDayValues = nov9..nov13` đã đúng từ trước, không thay đổi.

## 2026-05-04 – Gỡ QFPay; chỉ PaymentAsia / PA-SYS cho ví Alipay & WeChat

- **Context:** QFPay OpenAPI không còn dùng; merchant dùng PA-SYS hosted page (`payment.pa-sys.com/app/page/{token}`) + data-feed.
- **Decision:** Xóa type `qfpay` khỏi `PaymentMethodRow` và luồng ứng dụng; cột DB `qfpay_syssn` / enum legacy giữ cho dữ liệu cũ. Email/Slack: hàng `payment_method = qfpay` hiển thị như PaymentAsia (copy) hoặc “legacy”. Runtime: `paymentasia_use_sandbox` trong `app_runtime_settings` (không còn `qfpay_live_mode`). Biến env `QFPAY_*` và file `aws-secrets-qfpay-keys.env` bỏ.
- **Consequences:** Secrets Manager / `.env.prod` chỉ cần `PAYMENTASIA_*` cho ví; xem `agent/knowledge/06-paymentasia-pa-sys-integration.md`.

## 2026-03-26 – Cấu trúc agent/ cho repo event-rsvp

- **Context:** Cần bộ rule, convention và knowledge cho AI agent (tham chiếu cấu trúc EventConnect).
- **Decision:** Tạo `agent/` gồm `knowledge/`, `memory/`, `rules/`; root `AGENTS.md` trỏ vào các file này.
- **Consequences:** Agent và dev dùng chung nguồn; khi đổi product hoặc stack, cập nhật `agent/knowledge/` và `agent/memory/decisions.md`.

---

## 2026-03-26 – Product spec tại docs/PRODUCT-SPEC.md

- **Context:** Cần một spec thống nhất cho demo IAIS-style registration (Web & Email), tham chiếu Figma/FigJam đã phân tích.
- **Decision:** Thêm `docs/PRODUCT-SPEC.md` v1.0; `00-project-overview.md` và `AGENTS.md` trỏ về spec làm nguồn yêu cầu chính.
- **Consequences:** Implement và review ưu tiên theo spec; `02-schema-and-data.md` cần đồng bộ với mục 8 spec khi có ORM/migration.

---

## 2026-03-26 – Design DNA + Next.js app trong `web/`

- **Context:** Cần UI demo theo Figma IAIS Registration; token từ variables + inspect frame `2:824`.
- **Decision:** `.design/DNA.md` mô tả màu/typography; app Next.js 16 + Tailwind 4 trong `web/` với wizard `/register` (RHF + Zod), landing `/`, thank-you dynamic.
- **Consequences:** Chạy demo: `cd web && npm run dev`; thanh toán và email là mock cho tới khi nối API.

---

---

## 2026-03-30 – Email giao dịch qua Amazon SES + template theo Figma DNA

- **Context:** MVP cần gửi email xác nhận sau thanh toán; spec (`docs/PRODUCT-SPEC.md`) mô tả EmailLog và HTML cùng brand với web (Figma / `.design/DNA.md`).
- **Decision:** Gửi qua **Amazon SES** (`@aws-sdk/client-sesv2`), HTML + plain text; template inline CSS dùng màu/token DNA (`#001742`, `#00318D`, `#6989FE`, nền `#F7F8FA`, v.v.). Biến môi trường `AWS_SES_FROM_EMAIL`, `AWS_REGION`; tùy chọn `EMAIL_EVENT_TITLE`, `AWS_SES_CONFIGURATION_SET`. Bảng `email_logs` (migration `003_email_logs.sql`) ghi `sent` / `failed` + message id / lỗi.
- **Consequences:** Không gửi nếu SES chưa cấu hình (log info); cần verify domain/email trong SES và chạy migration để log đầy đủ. Slack queue giữ nguyên song song.

---

## 2026-03-30 – Triển khai container AWS (ECR + ECS Fargate / App Runner)

- **Context:** App Next.js 16 trong `web/` đã bật `output: "standalone"`; cần đường deploy chuẩn lên AWS (không ràng buộc một dịch vụ duy nhất).
- **Decision:** Thêm `web/Dockerfile` multi-stage build ra image Node Alpine chạy `node server.js` (port 3000). Build/push image lên **Amazon ECR**, chạy bằng **ECS Fargate** hoặc **App Runner** (hoặc Amplify nếu ưu tiên Git-based, không dùng Dockerfile repo).
- **Consequences:** Trên AWS cần cấu hình biến môi trường giống production: `DATABASE_URL`, `STRIPE_*`, `NEXT_PUBLIC_APP_URL`, `AWS_REGION`, quyền SES/SQS/Stripe webhook URL public. Không commit secret; dùng Secrets Manager hoặc env của dịch vụ.

---

## 2026-03-30 – Production Newtofu: account ECS/ECR + script deploy

- **Context:** Môi trường thật nằm ở AWS account **Newtofu** (`427901343757`), không trùng account AWS CLI mặc định khác; cần tài liệu và script tái sử dụng.
- **Decision:** Chi tiết cluster/service/region/profile ghi trong `agent/knowledge/04-deployment-aws.md`. Script `web/scripts/deploy-ecs.sh` nạp tùy chọn `web/scripts/deploy.env` (từ `deploy.env.example`); `npm run deploy:ecs` trong `web/`. ECR repo `event-rsvp-web`; ECS cluster `event-rsvp-cluster-sg`, service `event-rsvp-service-sg` tại `ap-southeast-1`; CLI thường dùng **`AWS_PROFILE=newtofu`**.
- **Consequences:** Agent/dev luôn kiểm tra `aws sts get-caller-identity` trước khi push image; cập nhật `04-deployment-aws.md` khi đổi tài nguyên AWS.

## 2026-03-30 – Backend CRM riêng (`crm-api/`) — Node.js + Express

- **Context:** Cần hệ thống CRM (danh sách đăng ký, lọc, export CSV) tách khỏi Next.js; `docs/PRODUCT-SPEC.md` mô tả admin/export là backlog MVP tùy chọn.
- **Decision:** Thêm service **`crm-api/`**: Node.js 20+, TypeScript, Express, `pg` (cùng `DATABASE_URL` với `web/`), auth **`X-API-Key`** hoặc **`Authorization: Bearer`** khớp `CRM_API_KEY`. API: `GET /health`, `GET /api/v1/registrations` (phân trang + lọc email/payment_method/from/to), `GET /api/v1/registrations/export.csv`, `GET /api/v1/registrations/:reference` (chi tiết + full `payload`). Trường **`crmPaymentStatus`** suy ra từ `payment_method` + `webhook_verified_at` (chưa thêm cột status trong DB).
- **Consequences:** Chạy riêng port (mặc định 4000); không commit `CRM_API_KEY`. UI admin (có thể bám Figma) gọi API này hoặc tích hợp sau.

## 2026-03-31 – Chuyển từ ECS Fargate sang EC2 + Elastic IP + Cloudflare DNS

- **Context:** ECS Fargate không cố định public IP; mỗi lần deploy/restart IP đổi → DNS record cũ hỏng. Cần IP cố định cho Cloudflare A record.
- **Decision:** Tạo EC2 `t3.small` (`i-01b8a235413c6061a`) với Elastic IP **`18.143.210.189`** (`eipalloc-0e657173ee7000e01`). Docker container map port 80:3000. Cloudflare DNS: `registration.newtofuevents.com` → A `18.143.210.189` (proxied), `www.newtofuevents.com` → AAAA `100::` (proxied, redirect 301 → `https://newtofu.com`). SSL mode: Flexible. ECS Fargate service scale về 0.
- **Consequences:** IP cố định không đổi khi restart. Deploy flow: build+push ECR → SSH vào EC2 pull+restart container. IAM instance profile `event-rsvp-ec2-profile` (role `event-rsvp-ec2-role`, policy `AmazonEC2ContainerRegistryReadOnly`) đã gắn — EC2 tự pull ECR không cần token thủ công.

## 2026-03-31 – IAM Instance Profile cho EC2 pull ECR

- **Context:** EC2 cần pull Docker image từ ECR; trước đó thiếu instance profile, phải dùng embedded token.
- **Decision:** Tạo IAM role `event-rsvp-ec2-role` (trust EC2, policy `AmazonEC2ContainerRegistryReadOnly`), instance profile `event-rsvp-ec2-profile`, gắn vào EC2 `i-01b8a235413c6061a`. Thực hiện trên account **`427901343757`** (profile `newtofu`, user `anh.huynh@newtofu.com`).
- **Consequences:** EC2 tự lấy credentials ECR qua instance metadata; deploy script không cần hardcode token. Lưu ý: profile `newtofu` (account `427901343757`) chứa EC2/ECR; profile `default` (account `767397883673`, user `theanh`) là account khác.

## 2026-03-31 – SES domain identity, DKIM, MAIL FROM và đồng bộ IAM với FROM

- **Context:** Email xác nhận không đến hoặc SES `AccessDenied`; FROM trỏ domain/email chưa verify; thiếu DKIM/SPF khiến deliverability kém.
- **Decision:** Verify **domain** `newtofuevents.com` trong SES; bật **DKIM** (3 CNAME tới `*.dkim.amazonses.com`); **custom MAIL FROM** subdomain (ví dụ `bounce.newtofuevents.com`) với MX + SPF; SPF root + DMARC trên Cloudflare; `AWS_SES_FROM_EMAIL` production dùng **`noreply@newtofuevents.com`**. IAM (instance profile `event-rsvp-ec2-role`) policy `ses:SendEmail`/`ses:SendRawEmail` trên **ARN identity** domain/email phù hợp (không chỉ địa chỉ cũ ở domain khác).
- **Consequences:** Gửi mail phải cùng **region** SES với identity; sandbox vẫn giới hạn đích — cần **production access** (`aws sesv2 put-account-details` / console) và chờ AWS approve. Bài học vận hành ghi tại `agent/knowledge/05-aws-cloudflare-ses-lesson.md`. Skill Cursor: `.cursor/skills/aws-cloudflare-ses-setup/SKILL.md`.

## 2026-03-31 – Cloudflare 521: DNS A phải khớp EC2 origin và port 80

- **Context:** `registration.newtofuevents.com` trả **521** — edge không kết nối được origin; có thể do A record trỏ IP instance khác (không listen :80) hoặc sai zone.
- **Decision:** A record proxied trỏ **Elastic IP** của instance production có Docker **`0.0.0.0:80->3000`**; xác nhận **zone ID** đúng domain `newtofuevents.com`. SSL **Flexible** giữ nguyên nếu origin chỉ HTTP:80.
- **Consequences:** Mỗi khi đổi instance hoặc Elastic IP, cập nhật A record và tài liệu trong `04-deployment-aws.md`; tránh hai EC2 cùng stack nhưng chỉ một máy là origin — ghi rõ instance ID + IP.

## 2026-04-01 – Repo backend liên quan: `user-admin`, ~~`user-api`~~ → `source-backend`

- **Context:** Có backend/services đặt tên riêng, tách khỏi app đăng ký (`web/`) trong repo này.
- **Decision:** Ghi nhận **`user-admin`** là repo backend riêng (ngoài monorepo) khi được clone/ghi rõ. Trong monorepo, **`user-api`** đã đổi tên thành **`source-backend/`** (Express, xem ADR 2026-04-02 tách API).
- **Consequences:** API đăng ký không còn trong `web/src/app/api`; dùng `source-backend` + rewrite Next.

## 2026-04-02 – Resend fallback + cột `provider` trên `email_logs`

- **Context:** SES production access có thể bị AWS trì hoãn / từ chối; cần đường gửi mail dự phòng.
- **Decision:** Thêm gửi qua **Resend** (`resend` npm), orchestrator `sendTransactionalEmail`: mặc định `EMAIL_PROVIDER=auto` thử SES trước, lỗi thì Resend; `EMAIL_PROVIDER=resend|ses` để ép provider. Migration `007_email_logs_provider.sql` thêm cột `provider` (`ses` / `resend`).
- **Consequences:** Chạy migration trên mọi DB; cấu hình `RESEND_API_KEY`, `RESEND_FROM_EMAIL` (domain verified trên Resend).

## 2026-04-02 – Admin auth (JWT cookie) + RBAC tối thiểu

- **Context:** Trang `/admin` và `/api/admin/*` trước đó không có auth.
- **Decision (cập nhật):** Cookie `admin_session` = JWT HS256 (`jose`), payload `{ sub, email, role }`, ký bằng `ADMIN_SESSION_SECRET` (≥32 ký tự). **Đăng nhập:** `POST /api/admin/auth/login` với `{ email, password }`; mật khẩu lưu **bcrypt** trong bảng `admin_users` (migration `008_admin_users.sql`). Không còn `ADMIN_PASSWORD` env cho login. Nếu secret chưa cấu hình → tương thích ngược (coi như đã auth). `ADMIN_AUTH_DISABLED=true` bypass có chủ đích. Middleware redirect `/admin/login` khi secret đã set và chưa có cookie hợp lệ. Tạo user: `node --env-file=.env.local scripts/create-admin-user.mjs <email> <password> [admin|viewer]`.
- **Consequences:** Cần migration + ít nhất một row `admin_users`; viewer chỉ GET (không bulk send / verify).

## 2026-04-02 – Pipeline timeline CRM + hướng tách FE/BE & RDS

- **Context:** Figma mô tả timeline nhiều bước; roadmap cần tách FE/BE và Postgres trên AWS thay Neon.
- **Decision:** Timeline suy luận từ `registrations` + `email_logs` (`buildRegistrationPipelineTimeline`); chi tiết đăng ký ưu tiên snapshot DB, fallback CRM. **Hướng kiến trúc (chưa migrate):** Next.js (hoặc static) tách khỏi API service; **Amazon RDS PostgreSQL** thay Neon cho production; connection string qua env/Secrets Manager — chi tiết triển khai ghi `docs/TODO-BACKLOG.md` và cập nhật `agent/knowledge/04-deployment-aws.md` khi thực hiện.
- **Consequences:** Docker Compose local dùng Postgres image + `web` (xem `docker-compose.yml`); healthcheck gọi `GET /api/health`.

## 2026-04-02 – Tách API: `source-backend` (Express) + queue email/payment

- **Context:** Cần FE/BE tách rõ; API trước đây nằm trong Next `app/api` khó scale worker và hàng đợi.
- **Decision:** Đổi tên **`user-api/` → `source-backend/`**; toàn bộ HTTP API đăng ký/admin/Stripe/internal/CRM proxy chuyển sang **Express** trong `source-backend/`, bundle **esbuild** với alias `@` → `web/src` (logic DB/email/Stripe tái sử dụng `web/src/lib`, `web/src/db`). **`web`:** xóa `src/app/api/**`; **`next.config.ts`** `rewrites` `/api/:path*` → `BACKEND_URL` (mặc định `http://127.0.0.1:4100`). **`localizedHref` trong Stripe checkout** nhân bản tại backend để không bundle `next-intl`. Hàng đợi: giữ **SQS** `SQS_NOTIFICATION_QUEUE_URL` (Slack payment); thêm **`SQS_EMAIL_QUEUE_URL`** + `enqueueBulkEmailJob` / `processEmailQueueBatch` (`web/src/lib/email-job-queue.ts`); endpoint nội bộ **`POST /api/internal/email-queue/process`** (cùng header `x-queue-token` như notification queue). Worker: EventBridge/cron gọi HTTP hoặc chạy script tích hợp sau.
- **Consequences:** Local cần **hai process**: `cd source-backend && npm run dev` và `cd web && npm run dev`. Production: image/container riêng cho `source-backend` hoặc cùng host với reverse proxy; env secrets trùng `DATABASE_URL`, `STRIPE_*`, `AWS_*`, v.v. Document `BACKEND_URL` trong `web/.env`.

## 2026-04-02 – EC2: hai container (web + source-backend) + ECR `event-rsvp-api`

- **Context:** Next rewrite `/api` → `BACKEND_URL`; production EC2 chỉ chạy một container `event-rsvp-web` → API không có backend riêng.
- **Decision:** **`source-backend/Dockerfile`** (context **root repo**, copy `web/src` + esbuild bundle). ECR thêm repo **`event-rsvp-api`**. **`web/scripts/deploy-ec2.sh`** build/push cả hai image, SSM: mạng `event-rsvp-net`, `docker run source-backend` (port 4100 nội bộ), sau đó `event-rsvp-web` với `-e BACKEND_URL=http://source-backend:4100` và API `-e USER_API_ALLOWED_ORIGIN` từ `NEXT_PUBLIC_APP_URL`. **`.dockerignore`** ở root để không copy `node_modules` vào build API.
- **Consequences:** Deploy từ **root** hoặc gọi `bash web/scripts/deploy-ec2.sh`; không chỉ `cd web` build API được nếu thiếu context repo.

## 2026-04-02 – Dozzle trong Docker Compose (auth simple)

- **Context:** Cần xem log container khi chạy stack local/staging; không để Dozzle mở không auth.
- **Decision:** Thêm service **`dozzle`** (`amir20/dozzle:latest`) trong `docker-compose.yml`, mount `docker.sock` + `./ops/dozzle/data:/data`, **`DOZZLE_AUTH_PROVIDER=simple`** với **`ops/dozzle/data/users.yml`** (bcrypt). Port **`127.0.0.1:8888:8080`**; **`DOZZLE_AUTH_TTL=8h`**. Mặc định dev `admin` / `changeme` — đổi trước khi expose mạng.
- **Consequences:** Truy cập UI `http://localhost:8888` sau `docker compose up`. Production: tunnel / Cloudflare Access / SG — không public Dozzle trần.

## 2026-04-02 – CRM qua `source-backend` + ảnh email trên S3

- **Context:** Next.js không nên gọi trực tiếp `crm-api` với `CRM_API_KEY`; ảnh HTML email không nên hotlink Figma MCP lâu dài.
- **Decision:** **`source-backend`** proxy đủ `GET /api/crm/registrations` (list), `GET /api/crm/registrations/:reference` (detail), `GET /api/crm/registrations/export` (CSV), thứ tự route: `export` trước `:reference`. **`web/src/lib/crm-server.ts`** chỉ `fetch(BACKEND_URL + /api/crm/...)` — không gửi API key từ Next; key chỉ trên backend (`CRM_API_KEY`, `CRM_API_BASE_URL`). Ảnh transactional: `EMAIL_HEADER_IMAGE_URL`, `EMAIL_ASSET_FORUM_*`, `EMAIL_ASSET_QR_PLACEHOLDER_URL` trong `email-assets.ts`; script `web/scripts/sync-figma-email-assets-to-s3.mjs` tải asset Figma mặc định và `PutObject` lên S3, in dòng env.
- **Consequences:** Production: set env ảnh trỏ HTTPS S3/CloudFront; chạy sync một lần sau deploy bucket. `web/.env` không cần `CRM_API_KEY` cho luồng admin mới.

## 2026-04-02 – CRM proxy: bỏ `CRM_API_KEY` / `x-api-key` tới upstream

- **Context:** Admin đã bảo vệ bằng JWT cookie; proxy CRM không cần thêm shared secret giữa `source-backend` và `crm-api`.
- **Decision:** `getCrmConfig` chỉ còn `CRM_API_BASE_URL`; không đọc `CRM_API_KEY`, không gửi header `x-api-key` khi `fetch` tới crm-api. Gỡ check 503 khi thiếu key.
- **Consequences:** `crm-api` upstream (nếu chạy riêng) phải cho phép gọi không key hoặc chỉ lắng nghe trên mạng nội bộ — không public Internet không auth.

## 2026-04-02 – RDS PostgreSQL 16 (Newtofu) cho event-rsvp

- **Context:** Account `427901343757`, region `ap-southeast-1`; EC2 production trong VPC `vpc-0833ffd2c1c803f40`.
- **Decision:** Tạo **RDS** `event-rsvp-pg`, engine **PostgreSQL 16.13**, class **db.t4g.micro**, storage **gp3 20 GB**, encrypted, backup **7 ngày**. **DB subnet group** `event-rsvp-db-subnet` (subnet `subnet-0ddf392e5c686c9f9` + `subnet-031f9e40ba26948ac`). **SG** `event-rsvp-rds-sg` (`sg-00977a1c96721026a`): inbound **5432** chỉ từ `event-rsvp-ec2-sg` (`sg-0e0d93e91c1a253cc`). **Không** public; DB ban đầu `eventrsvp`, user `eventrsvp`. Master password không dùng Secrets Manager (thiếu quyền `secretsmanager:CreateSecret`); lưu cục bộ `web/.env.rds.generated` (gitignore `.env*`) — **không** commit.
- **Consequences:** App trên EC2 dùng `DATABASE_URL` trỏ endpoint RDS; chạy migration từ máy có route tới VPC (SSM/bastion) hoặc trên host trong VPC. **`agent/knowledge/04-deployment-aws.md`** đã có mục **RDS**; cutover từ Neon là việc cấu hình env + migration dữ liệu khi team chốt.
- **Cập nhật (sau khi tạo instance):** RDS **public** + SG **5432** từ `0.0.0.0/0` (dev — nên siết IP sau). **Code:** thay `@neondatabase/serverless` bằng package **`postgres`** (postgres.js), module `web/src/db/postgres.ts`; SSL bật cho host `*.rds.amazonaws.com`, tắt cho `localhost` / `db` (Compose); host khác dùng `DATABASE_SSL=require`.

## 2026-04-03 – Admin CRM detail: đọc trực tiếp Postgres; toggles Stripe / Resend

- **Context:** Trang `/admin/registrations/[ref]` proxy qua `source-backend` → `CRM_API_BASE_URL`; khi crm-api không chạy hoặc sai URL, `fetch` lỗi **fetch failed**. Cần bật Stripe live và đổi thứ tự email (Resend trước) bằng biến môi trường có thể inject từ AWS AppConfig Agent.
- **Decision:** **`getRegistrationDetailFromDatabase`** (`web/src/lib/crm-detail-from-db.ts`) — `fetchRegistrationDetail` thử DB trước (cùng schema `registrations`), suy ra `crmPaymentStatus` từ `payment_method` / `payment_status` / `webhook_verified_at`; chỉ gọi HTTP khi không có dòng. **Stripe:** `resolveStripeSecretKey` / `resolveStripeWebhookSecret` (`web/src/lib/stripe-secret.ts`) — `STRIPE_USE_LIVE_MODE` hoặc `APP_CONFIG_STRIPE_LIVE` chọn cặp `STRIPE_*_LIVE` vs `STRIPE_*_TEST`, fallback `STRIPE_SECRET_KEY`. **Email:** `EMAIL_PRIMARY_RESEND=true` (hoặc `APP_CONFIG_EMAIL_PRIMARY_RESEND`) đảo thứ tự auto (Resend trước, SES fallback). **Email payment:** template `payment-confirmation` dùng ngày/link thật; không còn gửi tự động template **Email Confirmation | Physical Attendance** sau thanh toán — chỉ **payment_confirmation** (xác nhận nhận tiền); email physical gửi tay từ dashboard nếu cần.
- **Consequences:** Triển khai cần `DATABASE_URL` trên container web (đã có RDS). Webhook Stripe production phải dùng signing secret khớp key live/test. Terraform / Secrets Manager: ghi chép vận hành trong `agent/knowledge/04-deployment-aws.md` (bổ sung khi áp dụng).

## 2026-04-07 – Giảm giá (early-bird / promo) chỉ cấu hình trong Postgres

- **Context:** Early-bird từng gợi ý biến môi trường; stakeholder muốn một nguồn sự thật cho mọi discount, kể cả auto-apply khi không nhập mã.
- **Decision:** Bảng `discount_codes` thêm `apply_without_code` (migration `web/db/migrations/014_discount_auto_apply.sql`). Đúng một dòng **active** có thể `apply_without_code = true` (unique index partial). `resolve-discount.ts` gọi `findAutomaticDiscountCode()` khi không có mã; mã gõ tay vẫn qua `findActiveDiscountCode`. Không dùng `EARLYBIRD_*` env cho logic giá.
- **Consequences:** Chạy migration 014; seed ví dụ: cập nhật dòng `EARLYBIRD` (013) với `apply_without_code = true`. Đổi % / hạn / max_uses trực tiếp trong DB hoặc qua SQL/admin sau này.

_(Thêm entry mới phía dưới, giữ format trên.)_
