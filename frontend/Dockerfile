# Etapa 1: Construcción
FROM node:18-alpine AS builder

# Declaramos que necesitamos esta variable para el build
ARG VITE_API_URL
ARG VITE_ADMIN_TOKEN

WORKDIR /app

# CORRECCIÓN: Apuntamos a la subcarpeta frontend para obtener los archivos correctos
COPY frontend/package*.json ./
RUN npm install

# Copiamos el contenido de la carpeta frontend al contenedor
COPY frontend/ .

# Inyectamos las variables justo antes de compilar
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_ADMIN_TOKEN=$VITE_ADMIN_TOKEN

RUN npm run build

# Etapa 2: Servidor de producción (Nginx)
FROM nginx:alpine

# COPIAMOS TU CONFIGURACIÓN PERSONALIZADA (Esta ruta es correcta porque el contexto es la raíz)
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# Copiamos los archivos de la app generados en la etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]