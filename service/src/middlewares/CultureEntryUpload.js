import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadDir = 'public/';
        // Tentukan folder tujuan berdasarkan nama field
        if (file.fieldname === 'entryImage') {
            uploadDir += 'images/culture'; // Folder khusus untuk gambar budaya
        } else if (file.fieldname === 'entryVideo') {
            uploadDir += 'videos/culture'; // Folder khusus untuk video budaya
        }
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Buat nama file yang unik
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

const fileFilter = (req, file, cb) => {
    // Daftar tipe file yang diizinkan
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];

    // Cek apakah tipe file diizinkan berdasarkan nama field
    if (file.fieldname === 'entryImage' && allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
    } else if (file.fieldname === 'entryVideo' && allowedVideoTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Tipe file tidak diizinkan! Hanya gambar (untuk entryImage) atau video (untuk entryVideo) yang diperbolehkan.'), false);
    }
};

// Gunakan .fields() untuk menerima file dari dua field yang berbeda
const cultureEntryUpload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 50 // Batas ukuran file 50MB (untuk video)
    }
}).fields([
    { name: 'entryImage', maxCount: 1 }, // Menerima 1 file dari field 'entryImage'
    { name: 'entryVideo', maxCount: 1 }  // Menerima 1 file dari field 'entryVideo'
]);

export default cultureEntryUpload;