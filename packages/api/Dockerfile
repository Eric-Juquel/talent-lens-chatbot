# Build context must be the monorepo root: docker build -f packages/api/Dockerfile .

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/web/package.json ./packages/web/package.json

RUN pnpm install --frozen-lockfile
COPY packages/api ./packages/api
RUN pnpm --filter talent-lens-api build

# ── Stage 2: production deps (pnpm deploy creates a self-contained bundle) ──
FROM node:22-alpine AS prod-deps
RUN corepack enable pnpm
WORKDIR /app

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/api/package.json ./packages/api/package.json
COPY packages/web/package.json ./packages/web/package.json

RUN pnpm install --frozen-lockfile
# --legacy required for pnpm v10+ without inject-workspace-packages
RUN pnpm --filter talent-lens-api deploy --prod --legacy /deploy

# ── Stage 3: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine
# Remove npm/npx — not needed at runtime, eliminates CVE-2026-33671 (picomatch ReDoS)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app

COPY --from=prod-deps /deploy/node_modules ./node_modules
COPY --from=prod-deps /deploy/package.json ./package.json
COPY --from=builder /app/packages/api/dist ./dist

EXPOSE 3001
CMD ["node", "dist/main"]
