import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/admins` || 'http://localhost:5000/api/admins';

/**
 * Mengirim permintaan login admin ke server.
 * @param {object} adminData - Objek berisi email dan password.
 * @returns {Promise<object>} Data admin dan token jika berhasil.
 */
const login = async (adminData) => {
    try {
        const response = await axios.post(`${API_URL}/login`, adminData);
        return response.data;
    } catch (error) {
        console.error('Error login:', error);
        // Lempar error asli yang diterima dari Axios,
        // agar pesan error spesifik (cth: "Password salah")
        // dapat ditangkap dan ditampilkan di halaman login.
        throw error;
    }
};

/**
 * Fungsi placeholder untuk logout.
 * Implementasi logout sesungguhnya ada di AuthContext.
 */
const logout = () => {
    localStorage.removeItem('user');
};

/**
 * Mengambil semua data admin dari server.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Daftar semua admin.
 */
const getAllAdmins = async (token) => {
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.get(API_URL, config);
        return response.data;
    } catch (error) {
        console.error('Error getAllAdmins:', error);
        throw error.response?.data || { message: 'Gagal mengambil data admin.' };
    }
};

/**
 * Membuat admin baru di server.
 * @param {object} adminData - Data admin baru.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Data admin yang baru dibuat.
 */
const createAdmin = async (adminData, token) => {
    try {
        console.log('Creating admin with data:', adminData);
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.post(API_URL, adminData, config);
        return response.data;
    } catch (error) {
        console.error('Error createAdmin:', error);
        throw error.response?.data || { message: 'Gagal membuat admin.' };
    }
};

/**
 * Memperbarui data admin di server.
 * @param {string} id - ID admin yang akan diperbarui.
 * @param {object} adminData - Data baru untuk admin.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Data admin yang telah diperbarui.
 */
const updateAdmin = async (id, adminData, token) => {
    try {
        console.log('Updating admin ID:', id, 'with data:', adminData);
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.put(`${API_URL}/${id}`, adminData, config);
        return response.data;
    } catch (error) {
        console.error('Error updateAdmin:', error);
        throw error.response?.data || { message: 'Gagal memperbarui admin.' };
    }
};

/**
 * Menghapus admin dari server.
 * @param {string} id - ID admin yang akan dihapus.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Pesan konfirmasi.
 */
const deleteAdmin = async (id, token) => {
    try {
        const config = {
            headers: { Authorization: `Bearer ${token}` },
        };
        const response = await axios.delete(`${API_URL}/${id}`, config);
        return response.data;
    } catch (error) {
        console.error('Error deleteAdmin:', error);
        throw error.response?.data || { message: 'Gagal menghapus admin.' };
    }
};

/**
 * Mengubah password admin di server.
 * @param {string} adminId - ID admin yang passwordnya akan diubah.
 * @param {object} passwordData - Objek berisi password lama dan baru.
 * @param {string} token - Token JWT untuk otorisasi.
 * @returns {Promise<object>} Pesan konfirmasi.
 */
const changePassword = async (adminId, passwordData, token) => {
    const response = await axios.put(
        `${API_URL}/${adminId}/change-password`,
        passwordData,
        {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        }
    );
    return response.data;
};

// Mengumpulkan semua fungsi ke dalam satu objek service
const adminService = {
    login,
    logout,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    changePassword
};

export default adminService;