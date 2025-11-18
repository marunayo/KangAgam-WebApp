# Menggunakan image resmi Node.js versi 18 yang ringan
FROM node:18-alpine

# Menetapkan direktori kerja di dalam container
WORKDIR /app

# Salin package.json dan package-lock.json terlebih dahulu untuk caching
COPY package*.json ./

# Install semua dependensi produksi
RUN npm install --omit=dev

# Salin sisa kode dari folder 'service' ke dalam direktori kerja '/app'
COPY . .

# Expose port yang akan digunakan oleh aplikasi
EXPOSE 5000

# Perintah default untuk menjalankan aplikasi
CMD ["npm", "start"]
