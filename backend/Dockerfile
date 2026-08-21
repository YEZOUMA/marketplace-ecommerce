FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
# Includes devDependencies (needed to run `prisma generate` and, in the dev
# compose override, the test suite) — trimmed to production-only is a later
# optimization once the image needs to be smaller.
RUN npm install

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

RUN mkdir -p /app/uploads
VOLUME ["/app/uploads"]

EXPOSE 4000

COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh

ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["node", "src/server.js"]
