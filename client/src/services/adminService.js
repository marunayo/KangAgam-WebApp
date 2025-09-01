import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/api/admins` || 'http://localhost:5000/api/admins';

const login = async (adminData) => {
    try {
        const response = await axios.post(`${API_URL}/login`, adminData);
        return response.data;
    } catch (error) {
        console.error('Error login:', error);
        // --- PERBAIKAN DI SINI ---
        // Alih-alih melempar objek buatan, lempar error asli dari axios.
        // Ini akan membuat pesan error dari backend (seperti "Password salah")
        // bisa sampai ke halaman login.
        throw error;
    }
};

const logout = () => {
    localStorage.removeItem('user');
};

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

const adminService = {
    login,
    logout,
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
};

export default adminService;