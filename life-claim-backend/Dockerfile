# syntax=docker/dockerfile:1
# Life Claims backend (roadmap 4.2). Runs the Express API over plain HTTP inside
# the private network; TLS is terminated at the reverse proxy / frontend nginx.
#
# Debian-based (node:20-slim, glibc) rather than alpine: the app depends on the
# native module `bcrypt`, which ships prebuilt binaries for linux-glibc (so no
# compilation is needed); build tools are added in the deps stage only as a
# fallback and never reach the slim runtime image.

FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
# bcrypt v6 ships prebuilt binaries for node-20 / linux-glibc-x64, so npm ci just
# downloads them — no compiler/apt install needed on this Debian (glibc) base.
RUN npm ci --omit=dev

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    USE_HTTPS=false \
    HOST=0.0.0.0 \
    PORT=3010
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The official node image ships a non-root `node` user (uid 1000).
RUN chown -R node:node /app
USER node
EXPOSE 3010
# Liveness health check (roadmap 3.2) — uses node itself (slim has no wget/curl).
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3010/api/health',r=>process.exit(r.statusCode<500?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "src/server.js"]
