import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Hook untuk otentikasi
import adminService from '../../services/adminService'; // Service untuk API admin

// Path ke logo (pastikan sesuai struktur folder Anda)
const logo = '/assets/images/logo-kang-agam.png';
const logoBalaiBahasa = '/assets/images/logo/tut-wuri-handayani.svg';

/**
 * Komponen halaman Login untuk Administrator.
 */
const AdminLoginPage = () => {
    const navigate = useNavigate(); // Hook untuk navigasi
    const { user, login } = useAuth(); // Ambil status user dan fungsi login dari AuthContext
    // State untuk data form (email, password)
    const [formData, setFormData] = useState({ adminEmail: '', adminPassword: '' });
    // State untuk menyimpan pesan error validasi atau error dari API
    const [errors, setErrors] = useState({});
    // State untuk menandakan proses submit sedang berlangsung (untuk disable tombol)
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Efek untuk redirect otomatis jika admin sudah login
    useEffect(() => {
        // Cek jika user ada dan rolenya adalah admin atau superadmin
        if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'superadmin') {
            // Redirect ke dashboard admin, replace history agar tidak bisa kembali ke login
            navigate('/admin/dashboard', { replace: true }); 
        }
    }, [user, navigate]); // Jalankan efek saat user atau navigate berubah

    // Handler untuk perubahan input form
    const handleChange = (e) => {
        // Update state formData sesuai input yang berubah
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Jika ada error pada field ini sebelumnya, hapus error tersebut saat user mulai mengetik lagi
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
    };

    // Fungsi untuk validasi form sebelum submit
    const validateForm = () => {
        const newErrors = {}; // Objek untuk menyimpan error baru
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex sederhana untuk format email

        // Validasi email
        if (!formData.adminEmail.trim()) {
            newErrors.adminEmail = 'Email wajib diisi.';
        } else if (!emailRegex.test(formData.adminEmail)) {
            newErrors.adminEmail = 'Format email tidak valid.';
        }

        // Validasi password
        if (!formData.adminPassword.trim()) {
            newErrors.adminPassword = 'Kata sandi wajib diisi.';
        }
        return newErrors; // Kembalikan objek errors
    };

    // Handler untuk submit form login
    const handleSubmit = async (e) => {
        e.preventDefault(); // Cegah reload halaman default
        const formErrors = validateForm(); // Lakukan validasi
        // Jika ada error validasi, tampilkan error dan hentikan proses
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setErrors({}); // Bersihkan error sebelumnya
        setIsSubmitting(true); // Mulai proses submit

        try {
            // Panggil service login dari adminService
            const response = await adminService.login(formData);
            // Jika berhasil, panggil fungsi login dari AuthContext dengan data user dari response
            login(response); 
            // Redirect ke dashboard (useEffect di atas akan menangani ini, tapi bisa juga dilakukan di sini)
            // navigate('/admin/dashboard', { replace: true });
        } catch (err) {
            // Tangani error dari API (misal: email/password salah)
            // Tampilkan pesan error dari response API jika ada, atau pesan default
            setErrors({ general: err.response?.data?.message || 'Gagal login. Periksa kredensial Anda.' });
        } finally {
            setIsSubmitting(false); // Selesai proses submit
        }
    };

    return (
        // Container utama halaman login
        <div className="bg-[#F0F4FF] min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            {/* Wrapper konten dengan layout flex */}
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                
                {/* Kolom Kiri: Informasi Aplikasi dan Balai Bahasa */}
                <div className="w-full md:w-1/2 max-w-md md:max-w-none text-center md:text-left flex flex-col items-center md:items-start">
                    {/* Logo Aplikasi dan Deskripsi */}
                    <div className="mb-8">
                        <img src={logo} alt="Kang Agam Logo" className="w-48 sm:w-56 mx-auto md:mx-0" />
                        <p className="text-gray-700 mt-4 text-base sm:text-lg">Kamus Daring Audio Bergambar Tiga Bahasa</p>
                        <p className="text-sm text-gray-600">Panel Khusus Administrator</p>
                    </div>
                    
                    {/* Logo dan Informasi Balai Bahasa */}
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-8 md:mt-auto">
                        <img src={logoBalaiBahasa} alt="Logo Balai Bahasa" className="h-12 sm:h-16" />
                        <div className="text-left">
                            <p className="text-sm sm:text-base font-bold text-gray-800 leading-tight">BALAI BAHASA PROVINSI JAWA BARAT</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight mt-0.5">BADAN PENGEMBANGAN DAN PEMBINAAN BAHASA</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 leading-tight mt-1">Kementerian Pendidikan Dasar dan Menengah Republik Indonesia</p>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Form Login */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md mt-8 md:mt-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Login Admin</h2>
                    {/* Tampilkan error umum (misal: kredensial salah) */}
                    {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}
                    
                    {/* Info box */}
                    <div className="bg-[#E8F0FF] text-[#4169E1] text-sm p-3 rounded-lg flex items-center gap-3 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        <span>Masukkan kredensial admin yang valid</span>
                    </div>

                    {/* Form Login */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Input Email */}
                        <div>
                            <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-600 mb-1">Posel</label>
                            <input 
                                type="email" 
                                name="adminEmail" 
                                id="adminEmail"
                                value={formData.adminEmail} 
                                onChange={handleChange} 
                                // Tambahkan border merah jika ada error
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none ${errors.adminEmail ? 'border-red-500' : 'border-gray-300'}`} 
                                placeholder="admin@example.com"
                            />
                            {/* Tampilkan pesan error email */}
                            {errors.adminEmail && <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>}
                        </div>
                        
                        {/* Input Password */}
                        <div>
                            <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-600 mb-1">Kata sandi</label>
                            <input 
                                type="password" 
                                name="adminPassword" 
                                id="adminPassword"
                                value={formData.adminPassword} 
                                onChange={handleChange} 
                                // Tambahkan border merah jika ada error
                                className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:outline-none ${errors.adminPassword ? 'border-red-500' : 'border-gray-300'}`} 
                                placeholder="••••••••"
                            />
                            {/* Tampilkan pesan error password */}
                            {errors.adminPassword && <p className="text-red-500 text-xs mt-1">{errors.adminPassword}</p>}
                        </div>
                        
                        {/* Tombol Submit */}
                        <button 
                            type="submit" 
                            disabled={isSubmitting} // Disable tombol saat submitting
                            className="w-full bg-[#4169E1] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#3B5CE0] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Memproses...' : 'Login'} {/* Ubah teks tombol saat submitting */}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;