# Multi-stage Dockerfile for YF Yugen Forge (YF Digital Studio)

# Stage 1: Build dependencies & assets
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for building TypeScript & Vite)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma Client & build frontend (Vite) + backend (TypeScript)
RUN npx prisma generate
RUN npm run build
RUN npm run build:server

# Stage 2: Production runtime image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built server and built frontend static assets. The Prisma Client itself
# is regenerated fresh in this stage via the postinstall hook (`prisma generate`)
# triggered by `npm ci --omit=dev` above, using the standard @prisma/client
# location — no separate copy of a generated client is needed.
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

EXPOSE 5000

# Run migrations and start production server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server/server.cjs"]
