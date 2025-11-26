# KangAgam WebApp

KangAgam WebApp adalah platform Kamus Daring Audio Bergambar Tiga Bahasa (Indonesia, Sunda, Inggris). Aplikasi ini dirancang untuk membantu pembelajaran bahasa melalui pendekatan visual dan audio yang interaktif, dilengkapi dengan fitur gamifikasi (kuis) serta panel administrasi yang komprehensif.

## ✨ Fitur Utama

### 👤 Sisi Pengguna (Learner)

- Kamus Tiga Bahasa: Terjemahan instan antara Bahasa Indonesia, Sunda, dan Inggris.
- Audio & Visual: Setiap kosakata dilengkapi dengan gambar ilustrasi dan pelafalan audio native.
- Kuis Interaktif: Fitur gamifikasi untuk menguji pemahaman pengguna terhadap topik tertentu.
- Pencarian & Filter: Memudahkan pengguna mencari topik atau kata tertentu.
- Tema Dinamis: Dukungan mode Light, Dark, dan Sunset.
- Desain Responsif: Tampilan optimal di Desktop dan Mobile.

### 🛡️ Sisi Admin (Dashboard)

- Manajemen Konten (CRUD): Tambah, edit, dan hapus Topik serta Kosakata (termasuk upload gambar & audio).
- Manajemen Pengguna: Kelola akun Learner dan Admin (termasuk Superadmin).
- Statistik & Visualisasi: Grafik kunjungan, topik terpopuler, dan demografi pengguna menggunakan Chart.js.
- Ekspor Data: Fitur ekspor laporan statistik ke format PDF dan Excel.
- Keamanan: Otentikasi JWT, Role-based Access Control (RBAC), dan proteksi rute.

## 🛠️ Teknologi yang Digunakan (MERN Stack)

### Frontend (Client)
- React.js: Library UI utama.
- Tailwind CSS: Styling framework untuk desain responsif.
- Framer Motion: Untuk animasi transisi yang halus.
- Context API: Manajemen state global (Auth & Theme).
- Axios: Komunikasi HTTP ke backend.
- React Router DOM: Navigasi halaman.
- i18next: Dukungan multi-bahasa pada antarmuka.

### Backend (Service)
- Node.js & Express.js: Framework server.
- MongoDB & Mongoose: Database NoSQL dan ODM.
- JWT (JSON Web Token): Keamanan otentikasi.
- Multer: Middleware untuk upload file (gambar & audio).
- Nodemailer: Layanan pengiriman email (untuk reset password).
- Swagger UI: Dokumentasi API otomatis.

## 📂 Struktur Proyek
```bash
KangAgam-WebApp/
├── client/             # Frontend React Application
│   ├── public/
│   └── src/
│       ├── components/ # Reusable components (UI, Admin, etc.)
│       ├── context/    # Global state (AuthContext, ThemeContext)
│       ├── pages/      # Application pages
│       ├── services/   # API service integration
│       └── ...
└── service/            # Backend Express Application
    ├── public/         # Static files (uploaded images/audio)
    ├── src/
    │   ├── controllers/
    │   ├── middlewares/
    │   ├── models/
    │   ├── routes/
    │   └── utils/
    └── server.js       # Entry point

```
## 🚀 Cara Menjalankan (Instalasi)

Pastikan Anda sudah menginstall Node.js dan MongoDB di komputer Anda.

1. Clone Repository
```bash
git clone [https://github.com/username-anda/KangAgam-WebApp.git](https://github.com/username-anda/KangAgam-WebApp.git)
cd KangAgam-WebApp
```

2. Setup Backend (Service)
```bash
cd service
npm install
```

### Buat file .env di dalam folder service
```bash
cp .env.example .env
```
### (Isi variabel lingkungan sesuai konfigurasi Anda, lihat bagian Konfigurasi di bawah)
```bash
npm start
```
### Server akan berjalan di http://localhost:5000

3. Setup Frontend (Client)
Buka terminal baru:
```bash
cd client
npm install
```

### Buat file .env di dalam folder client
```bash
cp .env.example .env
npm start
```
### Aplikasi akan berjalan di http://localhost:3000
### ⚙️ Konfigurasi Environment (.env)

- Backend (service/.env)
```bash
Buat file .env di folder service dan isi dengan:

PORT=5000
ATLAS_URI=mongodb://localhost:27017/kangagam_db
JWT_SECRET=rahasia_kunci_jwt_anda_yang_sangat_panjang
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=email_anda@gmail.com
EMAIL_PASSWORD=app_password_anda
```
- Frontend (client/.env)
Buat file .env di folder client dan isi dengan:
```bash
REACT_APP_API_URL=http://localhost:5000
```



Dibuat dengan ❤️ oleh Tim Pengembang Kang Agam.
