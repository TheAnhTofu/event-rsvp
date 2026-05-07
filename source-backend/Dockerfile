# Build from repository root:
#   docker build --platform linux/amd64 -f source-backend/Dockerfile -t event-rsvp-api .
# Requires web/src for @/* alias bundled by esbuild.
# bookworm-slim: esbuild native binary không chạy ổn trên alpine trong build.
FROM node:22-bookworm-slim AS builder
WORKDIR /app

COPY source-backend/package.json source-backend/package-lock.json ./
RUN npm ci && node node_modules/esbuild/install.js

COPY source-backend/ ./
COPY web/src /web/src

RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=4100

# Puppeteer/Chromium system dependencies (invoice PDF generation)
RUN apt-get update && apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 \
      libatk1.0-0 libcups2 libdbus-1-3 libdrm2 libgbm1 libgtk-3-0 \
      libnspr4 libnss3 libxcomposite1 libxdamage1 libxfixes3 \
      libxkbcommon0 libxrandr2 xdg-utils wget \
    && rm -rf /var/lib/apt/lists/*

COPY source-backend/package.json source-backend/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/assets ./assets

EXPOSE 4100

CMD ["node", "dist/index.js"]
