import fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

/**
 * Menghapus file berdasarkan array of file objects dari Multer.
 * @param {Array<Object>} files - Array file objects dari req.files.
 */
export const cleanupUploadedFiles = async (files) => {
    if (!files || files.length === 0) return;

    console.log(`Cleaning up ${files.length} uploaded file(s)...`);
    const filePaths = files.map(file => file.path); // Ambil path dari setiap objek

    // Panggil fungsi baru yang bekerja dengan path
    await cleanupUploadedFilesByPath(filePaths);
};

/**
 * ✅ FUNGSI BARU
 * Menghapus file berdasarkan array of string path.
 * @param {Array<String>} filePaths - Array berisi string path ke file.
 */
export const cleanupUploadedFilesByPath = async (filePaths) => {
    if (!filePaths || filePaths.length === 0) return;

    console.log(`Cleaning up ${filePaths.length} file(s) by path...`);
    
    const unlinkPromises = filePaths.map(path => {
        // Cek dulu apakah file ada sebelum mencoba menghapus
        if (fs.existsSync(path)) {
            return unlinkAsync(path).catch(err => {
                console.error(`Gagal menghapus file: ${path}`, err);
            });
        }
        return Promise.resolve(); // Jika file tidak ada, anggap berhasil
    });

    await Promise.all(unlinkPromises);
    console.log('Cleanup by path complete.');
};