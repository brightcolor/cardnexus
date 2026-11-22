# syntax=docker/dockerfile:1
# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:24-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN --mount=type=cache,id=npm,target=/root/.npm \
    npm ci

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client for the runner OS (linux-musl-openssl-3.0.x)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

ARG BUILD_TIME="dev"
ARG VERSION="dev"
ENV NEXT_PUBLIC_BUILD_TIME=$BUILD_TIME
ENV NEXT_PUBLIC_APP_VERSION=$VERSION

# Build-time env placeholders — overridden at runtime via docker-compose
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV APP_URL="http://localhost:3000"

# Create a pre-initialised base SQLite DB (schema only, no data).
# At first container startup the entrypoint copies this to the data volume —
# no prisma CLI needed at runtime, avoiding Prisma version conflicts.
RUN mkdir -p /tmp/builddb && \
    DATABASE_URL="file:/tmp/builddb/app.db" npx prisma db push && \
    cp /tmp/builddb/app.db /app/prisma/base.db

ENV DATABASE_URL="file:/tmp/builddb/app.db"
RUN --mount=type=cache,id=nextjs,target=/app/.next/cache \
    BETTER_AUTH_SECRET=$(node -p 'require("node:crypto").randomBytes(32).toString("hex")') npm run build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM alpine:3.24 AS runner
# su-exec: lightweight setuid helper (same pattern as official postgres/redis images)
RUN apk add --no-cache libstdc++ openssl curl su-exec 'zlib>=1.4-r0' \
 && addgroup -g 1001 -S nodejs \
 && adduser  -u 1001 -S nextjs -G nodejs

# The standalone server and startup scripts need Node only.
COPY --from=builder /usr/local/bin/node /usr/local/bin/node

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built Next.js standalone output
RUN mkdir -p ./public
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema + generated client (needed for app queries at runtime)
# base.db is the pre-initialised empty database used for first-run bootstrap
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy @better-auth for runtime seeding
COPY --from=builder /app/node_modules/@better-auth ./node_modules/@better-auth

# Entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Normalize Windows checkout line endings before Linux executes the script.
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
 && chmod +x /usr/local/bin/docker-entrypoint.sh

# Persistent volume mount points — owned by nextjs so su-exec drop works
RUN mkdir -p /app/data /app/public/uploads \
 && chown -R nextjs:nodejs /app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/api/health/ready || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
