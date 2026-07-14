FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11 --activate

FROM base AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json .npmrc ./
COPY tsconfig.base.json ./
COPY database/ ./database/
COPY packages/shared/package.json packages/shared/
COPY packages/shared/tsconfig.json packages/shared/
COPY packages/physics/package.json packages/physics/
COPY packages/physics/tsconfig.json packages/physics/
COPY packages/game-engine/package.json packages/game-engine/
COPY packages/game-engine/tsconfig.json packages/game-engine/
COPY packages/assets/package.json packages/assets/
COPY packages/networking/package.json packages/networking/
COPY packages/ui/package.json packages/ui/
COPY apps/server/package.json apps/server/
COPY packages/shared/src/ packages/shared/src/
COPY packages/physics/src/ packages/physics/src/
COPY packages/game-engine/src/ packages/game-engine/src/
COPY apps/server/ apps/server/
ENV PNPM_NODE_LINKER=hoisted
RUN pnpm install --no-frozen-lockfile
RUN cd apps/server && npx prisma generate
RUN pnpm --filter @battle-jets/shared build
RUN pnpm --filter @battle-jets/physics build
RUN pnpm --filter @battle-jets/game-engine build
RUN pnpm --filter @battle-jets/server build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nestjs
COPY --from=builder /app/apps/server/dist ./dist
COPY --from=builder /app/apps/server/package.json ./
COPY --from=builder /app/apps/server/node_modules ./node_modules
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/database ./database
RUN mkdir -p uploads && chown -R nestjs:nodejs /app
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main"]
