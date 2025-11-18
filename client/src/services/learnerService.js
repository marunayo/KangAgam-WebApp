import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/learners`;

/**
 * Mengambil semua data pengguna (learner) dari server.
 * Memerlukan token admin untuk otorisasi.
 * @param {string} token - Token JWT admin.
 * @returns {Promise<object>} Daftar semua pengguna.
 */
const getAllLearners = async (token) => {
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        console.error('Error getAllLearners:', error);
        throw error.response?.data || { message: 'Gagal mengambil data pengguna.' };
    }
};

/**
 * Menghapus data pengguna berdasarkan ID.
 * Memerlukan token admin untuk otorisasi.
 * @param {string} id - ID pengguna yang akan dihapus.
 * @param {string} token - Token JWT admin.
 * @returns {Promise<object>} Pesan konfirmasi.
 */
const deleteLearner = async (id, token) => {
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.delete(`${API_URL}/${id}`, config);
        return response.data;
    } catch (error) {
        console.error('Error deleteLearner:', error);
        throw error.response?.data || { message: 'Gagal menghapus pengguna.' };
    }
};

// Mengumpulkan fungsi ke dalam satu objek service
const learnerService = {
    getAllLearners,
    deleteLearner,
};

export default learnerService;