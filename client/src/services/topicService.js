import axios from 'axios';

// URL endpoint API dasar
const API_URL = 'http://localhost:5000/api';

/**
 * Mengambil semua topik (kosakata/budaya) dari server.
 * Fungsi ini tidak perlu token karena bersifat publik.
 * @param {string} [language='id'] - Filter bahasa (opsional).
 * @returns {Promise<object>} Daftar topik.
 */
export const getTopics = async (language = 'id') => {
    try {
        const response = await axios.get(`${API_URL}/topics`, {
            params: { language: language }
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching topics:', error);
        throw error;
    }
};

/**
 * Mengambil satu topik berdasarkan ID.
 * Fungsi ini juga publik.
 * @param {string} topicId - ID topik yang akan diambil.
 * @returns {Promise<object>} Data topik tunggal.
 */
export const getTopicById = async (topicId) => {
    try {
        const response = await axios.get(`${API_URL}/topics/${topicId}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching topic with id ${topicId}:`, error);
        throw error;
    }
};

// --- FUNGSI YANG MEMERLUKAN TOKEN ---

/**
 * Menambahkan topik baru (memerlukan token admin).
 * @param {FormData} formData - Data topik baru (termasuk file).
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Topik yang baru dibuat.
 */
export const addTopic = async (formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.post(`${API_URL}/topics`, formData, config);
        return response.data;
    } catch (error) {
        console.error('Error adding topic:', error);
        throw error;
    }
};

/**
 * Memperbarui topik yang sudah ada (memerlukan token admin).
 * @param {string} id - ID topik yang akan diperbarui.
 * @param {FormData} formData - Data baru untuk topik.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Topik yang telah diperbarui.
 */
export const updateTopic = async (id, formData, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.put(`${API_URL}/topics/${id}`, formData, config);
        return response.data;
    } catch (error) {
        console.error(`Error updating topic ${id}:`, error);
        throw error;
    }
};

/**
 * Menghapus topik (memerlukan token admin).
 * @param {string} id - ID topik yang akan dihapus.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Pesan konfirmasi.
 */
export const deleteTopic = async (id, token) => {
    try {
        // 1. Buat config untuk menyertakan token
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        };
        const response = await axios.delete(`${API_URL}/topics/${id}`, config);
        return response.data;
    } catch (error) {
        console.error(`Error deleting topic ${id}:`, error);
        throw error;
    }
};