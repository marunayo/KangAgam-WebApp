# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.16.0

################################################################################
# Gunakan node image untuk base image untuk semua stages.
FROM node:${NODE_VERSION}-alpine as base
WORKDIR /usr/src/app

################################################################################
# Stage untuk instalasi dependensi produksi.
FROM base as deps
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

################################################################################
# Stage untuk membangun aplikasi (build).
FROM deps as build
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci
COPY . .

ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=${REACT_APP_API_URL}

RUN npm run build

################################################################################
# Stage final untuk produksi menggunakan Nginx.
FROM nginx:stable-alpine as final

# Salin HANYA hasil build dari stage 'build' ke direktori web Nginx
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# (Opsional tapi sangat disarankan) Salin konfigurasi Nginx kustom
# Lihat penjelasan di bawah
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80, port default Nginx
EXPOSE 80

# Perintah untuk menjalankan Nginx
CMD ["nginx", "-g", "daemon off;"]