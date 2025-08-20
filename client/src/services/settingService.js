import axios from 'axios';

const API_URL = '/api/settings';

/**
 * Mengambil pengaturan aplikasi dari server.
 * @param {string} token - Token JWT admin.
 * @returns {Promise<object>} Objek pengaturan (cth: { maxAdmins: 5 }).
 */
export const getSettings = async (token) => {
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        console.error('Error getSettings:', error);
        throw error.response?.data || { message: 'Gagal mengambil pengaturan.' };
    }
};

/**
 * Memperbarui pengaturan aplikasi. Hanya untuk superadmin.
 * @param {object} settingsData - Data pengaturan baru (cth: { maxAdmins: 10 }).
 * @param {string} token - Token JWT superadmin.
 * @returns {Promise<object>} Pengaturan yang sudah diperbarui.
 */
export const updateSettings = async (settingsData, token) => {
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(API_URL, settingsData, config);
        return response.data;
    } catch (error) {
        console.error('Error updateSettings:', error);
        throw error.response?.data || { message: 'Gagal memperbarui pengaturan.' };
    }
};

const settingService = {
    getSettings,
    updateSettings,
};

export default settingService;