# syntax=docker/dockerfile:1
# ─── Stage 1: Install dependencies ──────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --frozen-lockfile

# ─── Stage 2: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client (targets the runner OS)
RUN npx prisma generate

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Placeholder env for build time — overridden at runtime
ENV BETTER_AUTH_SECRET="build-placeholder-replace-at-runtime"
ENV BETTER_AUTH_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV APP_URL="http://localhost:3000"

# Create a temporary SQLite DB for the build step so Prisma client initialises
# without hitting a missing-file error. getPlatformSettings() has a try/catch
# and returns safe defaults when the DB is unreachable, so this is belt-and-
# suspenders; the actual data volume is mounted at runtime.
RUN mkdir -p /tmp/builddb && \
    DATABASE_URL="file:/tmp/builddb/app.db" npx prisma db push

ENV DATABASE_URL="file:/tmp/builddb/app.db"
RUN npm run build

# ─── Stage 3: Runner ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl curl

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Non-root user
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy built output
RUN mkdir -p ./public
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema + client (needed for db push at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy seed script + its deps
COPY --from=builder /app/node_modules/tsx ./node_modules/tsx
COPY --from=builder /app/node_modules/@better-auth ./node_modules/@better-auth
COPY --from=builder /app/node_modules/nanoid ./node_modules/nanoid

# Entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Persistent volume mount points
RUN mkdir -p /app/data /app/public/uploads \
 && chown -R nextjs:nodejs /app/data /app/public/uploads /app

VOLUME ["/app/data", "/app/public/uploads"]

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
