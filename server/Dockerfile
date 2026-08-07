# --- Build stage: install + compile shared and server ---
FROM node:22-alpine AS build
WORKDIR /app
# Build context is the repo root (see docker-compose.yml).
COPY . .
RUN npm --prefix shared install \
  && npm --prefix server install \
  && npm --prefix server run build

# --- Runtime stage ---
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/package.json /app/tsconfig.base.json ./
COPY --from=build /app/shared ./shared
COPY --from=build /app/server ./server
WORKDIR /app/server
ENV NODE_ENV=production
EXPOSE 4000
# Migrate + seed (idempotent) then start. tsx is present from the install above.
CMD ["sh", "-c", "npm run migrate && npm run seed && node dist/index.js"]
