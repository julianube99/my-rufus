# Etapa de build
FROM node:18-alpine AS builder

WORKDIR /app

COPY ../rufus_app/package*.json ./
RUN npm install

COPY ../rufus_app ./
RUN npm run build

# Etapa de producción
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000
CMD ["npx", "next", "start", "-p", "3000"]
