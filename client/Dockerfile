# --- Build stage: compile shared + client with Vite ---
FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=http://localhost:4000/api/v1
COPY . .
# Bake the API URL into the build (Vite inlines VITE_* at build time).
RUN echo "VITE_API_URL=$VITE_API_URL" > client/.env \
  && npm --prefix shared install \
  && npm --prefix client install \
  && npm --prefix client run build

# --- Runtime stage: serve the static SPA with nginx ---
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
