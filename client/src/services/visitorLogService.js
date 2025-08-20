import axios from 'axios';

const API_URL = '/api/visitor-logs';

/**
 * Mengirimkan log kunjungan ke server.
 * @param {object} logData - Objek berisi learnerId dan topicId.
 * @returns {Promise<object>} Data log yang tersimpan.
 */
export const logVisit = async (logData) => {
    try {
        // Request ini tidak memerlukan token karena bersifat publik (mencatat aktivitas)
        const response = await axios.post(API_URL, logData);
        return response.data;
    } catch (error) {
        // Gagal mencatat log tidak boleh menghentikan user, jadi kita hanya log error di console.
        console.error('Gagal mencatat kunjungan:', error.response?.data || error.message);
        // Kita tidak melempar error agar aplikasi tetap berjalan normal.
    }
};