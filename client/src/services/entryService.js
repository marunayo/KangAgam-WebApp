import axios from 'axios';

// URL endpoint API dasar
const API_URL = 'http://localhost:5000/api';

/**
 * Mengambil semua entri (kosakata/budaya) berdasarkan ID topik.
 * Fungsi ini publik, tidak perlu token.
 * @param {string} topicId - ID topik.
 * @returns {Promise<object>} Daftar entri untuk topik tersebut.
 */
export const getEntriesByTopicId = async (topicId) => {
    try {
        const response = await axios.get(`${API_URL}/topics/${topicId}/entries`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching entries for topic ${topicId}:`, error);
        throw error;
    }
};

// --- FUNGSI YANG MEMERLUKAN TOKEN ---

/**
 * Menambahkan entri baru ke sebuah topik (memerlukan token admin).
 * @param {string} topicId - ID topik.
 * @param {FormData} formData - Data entri (termasuk file jika ada).
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Entri yang baru dibuat.
 */
export const addEntry = async (topicId, formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            }
        };
        const response = await axios.post(`${API_URL}/topics/${topicId}/entries`, formData, config);
        return response.data;
    } catch (error) {
        console.error('Error adding entry:', error);
        throw error;
    }
};

/**
 * Memperbarui entri yang sudah ada (memerlukan token admin).
 * @param {string} topicId - ID topik.
 * @param {string} entryId - ID entri yang akan diperbarui.
 * @param {FormData} formData - Data baru untuk entri.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Entri yang telah diperbarui.
 */
export const updateEntry = async (topicId, entryId, formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            }
        };
        const response = await axios.put(`${API_URL}/topics/${topicId}/entries/${entryId}`, formData, config);
        return response.data;
    } catch (error) {
        console.error(`Error updating entry ${entryId}:`, error);
        throw error;
    }
};

/**
 * Menghapus entri dari sebuah topik (memerlukan token admin).
 * @param {string} topicId - ID topik.
 * @param {string} entryId - ID entri yang akan dihapus.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Pesan konfirmasi.
 */
export const deleteEntry = async (topicId, entryId, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        };
        const response = await axios.delete(`${API_URL}/topics/${topicId}/entries/${entryId}`, config);
        return response.data;
    } catch (error) {
        console.error(`Error deleting entry ${entryId}:`, error);
        throw error;
    }
};