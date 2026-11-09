# Etapa 1: instala solo las dependencias de producción
FROM node:20-alpine AS dependencias
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Etapa 2: imagen final, liviana y sin herramientas de compilación
FROM node:20-alpine
LABEL org.opencontainers.image.title="gestor-tareas-app" \
      org.opencontainers.image.description="API y frontend del gestor de tareas"
ENV NODE_ENV=production \
    PORT=3000
WORKDIR /app

COPY --from=dependencias /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY public ./public

# Se ejecuta con el usuario sin privilegios que trae la imagen oficial, no como root
USER node

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1

CMD ["node", "src/server.js"]
