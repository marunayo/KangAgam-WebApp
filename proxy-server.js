const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

// --- KONFIGURASI SESUAI PROYEKMU ---
const CLIENT_PORT = 3000;    // Port React App
const SERVICE_PORT = 5000;   // Port Express/Service App
const PROXY_PORT = 8000;     // Port baru untuk proxy, agar tidak bentrok dengan service

// 1. Proxy untuk API & Socket.IO
// Semua request yang diawali /api akan diarahkan ke service backend.
// Opsi `ws: true` sangat penting untuk meneruskan koneksi Socket.IO.
app.use('/api', createProxyMiddleware({
  target: `http://localhost:${SERVICE_PORT}`,
  changeOrigin: true,
  ws: true, // <-- PENTING untuk Socket.IO
}));

// 2. Proxy untuk Swagger API Docs
// Arahkan /api-docs ke service backend juga.
app.use('/api-docs', createProxyMiddleware({
  target: `http://localhost:${SERVICE_PORT}`,
  changeOrigin: true,
}));


// 3. Proxy untuk Client (React App)
// SEMUA request LAINNYA akan diarahkan ke aplikasi client.
// Ini harus menjadi rule terakhir.
app.use('/', createProxyMiddleware({
  target: `http://localhost:${CLIENT_PORT}`,
  changeOrigin: true,
}));

// Jalankan server proxy
app.listen(PROXY_PORT, () => {
  console.log(`🚀 Reverse Proxy berjalan di http://localhost:${PROXY_PORT}`);
  console.log(`Mengarahkan:`);
  console.log(`  -> /api/** -> service di port ${SERVICE_PORT} (termasuk WebSocket)`);
  console.log(`  -> /api-docs/** -> service di port ${SERVICE_PORT}`);
  console.log(`  -> Lainnya -> client di port ${CLIENT_PORT}`);
});