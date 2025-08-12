import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { fileURLToPath } from 'url';

// Import semua router yang benar
import topicsRouter from './src/routes/TopicRoutes.js';
import languageRouter from './src/routes/LanguageRoutes.js';
import learnerRouter from './src/routes/LearnerRoutes.js';
import adminRouter from './src/routes/AdminRoutes.js';
import visitorLogRouter from './src/routes/VisitorLogRoutes.js';
import dashboardRouter from './src/routes/DashboardRoutes.js';
import locationRouter from './src/routes/LocationRoutes.js';
import settingRouter from './src/routes/SettingRoutes.js';
import cultureEntryRouter from './src/routes/CultureEntryRoutes.js'; // Impor rute entri budaya
import cultureTopicRouter from './src/routes/CultureTopicRoutes.js'; // Impor rute topik budaya
import connectDB from './src/config/db.js';
import errorHandler from './src/middlewares/ErrorHandler.js';

// Konfigurasi untuk mendapatkan __dirname di ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express dan Socket.IO setup
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());

// Tambahkan middleware untuk parsing JSON dan URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Daftarkan middleware untuk menyajikan file statis dari folder 'public'
app.use(express.static(path.join(__dirname, 'public')));


const uri = process.env.ATLAS_URI;
connectDB();

// --- PENDAFTARAN RUTE ---
// Rute untuk entri sudah ditangani di dalam topicsRouter, jadi tidak perlu didaftarkan di sini.
app.use('/api/topics', topicsRouter);
app.use('/api/languages', languageRouter);
app.use('/api/learners', learnerRouter);
app.use('/api/admins', adminRouter);
app.use('/api/visitor-logs', visitorLogRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/locations', locationRouter);
app.use('/api/settings', settingRouter);
app.use('/api/culture-topics', cultureTopicRouter); // Rute untuk topik budaya
app.use('/api/culture-topics/:cultureTopicId/entries', cultureEntryRouter);

// Middleware untuk menangani error
app.use(errorHandler);

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Kang Agam API Documentation',
      version: '0.1.0',
      description: 'API documentation for Kang Agam Web App',
    },
    servers: [ { url: `http://localhost:${PORT}/` } ]
  },
  apis: ['./src/routes/*.js']
};
const spacs = swaggerJSDoc(options);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spacs));

// Jalankan server
server.listen(PORT, () => {
    console.log(`Service is running on port ${PORT}`);
});