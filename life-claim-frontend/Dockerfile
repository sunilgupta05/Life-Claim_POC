# syntax=docker/dockerfile:1
# Life Claims frontend (roadmap 4.2). Multi-stage: build the Vite app, then serve
# the static bundle with nginx, which also proxies /api → backend and terminates TLS.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# VITE_* build-time vars can be injected via --build-arg if needed.
RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1
CMD ["nginx", "-g", "daemon off;"]
