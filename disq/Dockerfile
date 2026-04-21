FROM oven/bun:1 AS base
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

# Build
FROM deps AS builder
COPY . .
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}
RUN bun run build

# Production image
FROM oven/bun:1-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001
ENV PORT=3001
CMD ["bun", "./build/index.js"]