# service/Dockerfile (Versi Perbaikan)

FROM node:18-alpine
ENV NODE_ENV=production
WORKDIR /app

# Instalasi dependensi tetap sama
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Salin semua sisa kode aplikasi
COPY . .

# ======== TAMBAHKAN BARIS INI ========
# Ubah kepemilikan seluruh direktori /app menjadi milik user 'node'
RUN chown -R node:node /app
# =====================================

# Baru beralih ke user 'node'
USER node

EXPOSE 5000
CMD ["npm", "start"]