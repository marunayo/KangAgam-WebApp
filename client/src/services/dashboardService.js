import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/dashboard`;

/**
 * Mengambil data statistik dari backend.
 * @param {object} params - Objek berisi filter (cth: { visitorsPeriod: 'monthly' }).
 * @param {string} token - Token otorisasi JWT.
 * @returns {Promise<object>} Data statistik dari server.
 */
export const getDashboardData = async (params, token) => {
    try {
        const config = {
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: params // Kirim filter sebagai query parameters
        };
        const response = await axios.get(`${API_URL}/stats`, config);
        return response.data;
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        throw error.response?.data || { message: 'Gagal mengambil data statistik.' };
    }
};