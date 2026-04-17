# Build context must be the monorepo root: docker build -f packages/web/Dockerfile .

# ── Stage 1: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable pnpm
WORKDIR /app

# Copy workspace manifest + lockfile first (layer cache)
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/web/package.json ./packages/web/package.json
COPY packages/api/package.json ./packages/api/package.json

# Install only the frontend's deps (faster, smaller layer)
RUN pnpm install --frozen-lockfile --filter talent-lens-web

# Copy source and build
COPY packages/web ./packages/web
ARG VITE_API_BASE_URL=http://localhost:3001
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN pnpm --filter talent-lens-web build

# ── Stage 2: serve ──────────────────────────────────────────────────────────
FROM nginx:alpine
COPY packages/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/packages/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
