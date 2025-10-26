import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion'; // Untuk animasi

// Komponen-komponen ikon internal
const HomeIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m3 12 2-2m0 0 7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);
const AdminIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
    </svg>
);
const LoginIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
    </svg>
);
const RefreshIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

/**
 * Komponen halaman 404 Not Found.
 * Menampilkan pesan error dan tombol aksi yang relevan berdasarkan konteks URL
 * (apakah pengguna berada di area admin atau user) dan status login.
 */
const NotFoundPage = () => {
    const navigate = useNavigate(); // Hook untuk navigasi programatik
    const location = useLocation(); // Hook untuk mendapatkan informasi URL saat ini

    // Cek apakah URL saat ini berada di bawah path '/admin'
    const isAdminRoute = location.pathname.startsWith('/admin');
    // Cek apakah URL saat ini berada di bawah path user (home, topik, quiz, kamus-budaya)
    const isUserRoute = location.pathname.startsWith('/home') || 
                        location.pathname.startsWith('/topik') || 
                        location.pathname.startsWith('/quiz') ||
                        location.pathname.startsWith('/kamus-budaya');

    // Fungsi untuk mendapatkan status autentikasi (user & admin) dari localStorage
    // Catatan: Idealnya ini menggunakan AuthContext, tapi localStorage digunakan di sini
    // sebagai fallback atau jika AuthContext tidak tersedia di route ini.
    const getAuthStatus = () => {
        // Coba ambil token user dan admin dari localStorage
        const userToken = localStorage.getItem('user'); // Asumsi 'user' menyimpan objek user
        const adminToken = localStorage.getItem('token'); // Asumsi 'token' menyimpan token admin
        
        // Kembalikan objek status
        return {
            isUserLoggedIn: !!userToken, // True jika ada data user
            isAdminLoggedIn: !!adminToken, // True jika ada token admin
            isAdmin: isAdminRoute && !!adminToken, // True jika di route admin DAN admin login
            isUser: isUserRoute && !!userToken // True jika di route user DAN user login
        };
    };

    // Panggil fungsi untuk mendapatkan status saat ini
    const { isUserLoggedIn, isAdminLoggedIn, isAdmin, isUser } = getAuthStatus();

    // Handler untuk tombol "Kembali"
    const handleGoBack = () => {
        // Cek apakah ada history navigasi sebelumnya
        if (window.history.length > 1) {
            navigate(-1); // Kembali ke halaman sebelumnya
        } else {
            // Jika tidak ada history, navigasi ke halaman default berdasarkan konteks
            if (isAdminRoute) {
                // Jika di area admin, arahkan ke dashboard jika login, atau ke login jika tidak
                navigate(isAdminLoggedIn ? '/admin/dashboard' : '/admin/login');
            } else {
                // Jika di area user, arahkan ke home jika login, atau ke onboarding jika tidak
                navigate(isUserLoggedIn ? '/home' : '/');
            }
        }
    };

    // Handler untuk tombol "Muat Ulang Halaman"
    const handleRefresh = () => {
        window.location.reload(); // Reload halaman
    };

    // Varian animasi untuk container utama (mengatur stagger children)
    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.2 // Jeda antar animasi anak
            }
        }
    };

    // Varian animasi untuk item-item di dalam container
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    // Animasi mengambang (floating) untuk angka 404
    const floatingAnimation = {
        y: [-10, 10, -10], // Gerakan naik turun
        transition: {
            duration: 3,
            repeat: Infinity, // Ulangi tanpa henti
            ease: "easeInOut"
        }
    };

    return (
        // Container halaman penuh, tengahkan konten
        <div className="h-screen w-full bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="w-full max-w-lg mx-auto">
                {/* Wrapper utama dengan animasi container */}
                <motion.div 
                    className="w-full space-y-4 sm:space-y-6 lg:space-y-8 text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Angka 404 dengan animasi mengambang */}
                    <motion.div 
                        className="relative mb-6 sm:mb-8"
                        variants={itemVariants} // Animasi item
                        animate={floatingAnimation} // Terapkan animasi mengambang
                    >
                        {/* Angka 404 besar sebagai background */}
                        <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold text-primary/20 select-none">
                            404
                        </h1>
                        {/* Emoji kaca pembesar di tengah */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center">
                                {/* Animasi rotasi pada emoji */}
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="text-3xl sm:text-4xl"
                                >
                                    🔍
                                </motion.div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Pesan Error */}
                    <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-text">
                            Halaman Tidak Ditemukan
                        </h2>
                        {/* Pesan berbeda tergantung konteks admin/user */}
                        <p className="text-base sm:text-lg text-text-secondary px-2 max-w-md mx-auto">
                            {isAdminRoute 
                                ? "Halaman admin yang Anda cari tidak dapat ditemukan atau tidak tersedia."
                                : "Halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan."
                            }
                        </p>
                    </motion.div>

                    {/* Tombol Aksi Utama dan Sekunder */}
                    <motion.div 
                        variants={itemVariants}
                        // Layout tombol: kolom di mobile, baris di sm ke atas
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
                    >
                        {/* Tombol Aksi Utama (berbeda tergantung konteks dan status login) */}
                        {isAdminRoute ? (
                            // Konteks Admin
                            isAdminLoggedIn ? ( // Jika admin login
                                <Link
                                    to="/admin/dashboard"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <AdminIcon />
                                    Dashboard Admin
                                </Link>
                            ) : ( // Jika admin tidak login
                                <Link
                                    to="/admin/login"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <LoginIcon />
                                    Login Admin
                                </Link>
                            )
                        ) : (
                            // Konteks User
                            isUserLoggedIn ? ( // Jika user login
                                <Link
                                    to="/home"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <HomeIcon />
                                    Ke Beranda
                                </Link>
                            ) : ( // Jika user tidak login
                                <Link
                                    to="/"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <HomeIcon />
                                    Mulai Belajar
                                </Link>
                            )
                        )}

                        {/* Tombol Aksi Sekunder (Kembali) */}
                        <button
                            onClick={handleGoBack}
                            className="flex-1 bg-background-secondary text-text px-6 py-3 rounded-lg hover:bg-background-secondary/80 transition-colors duration-200 font-medium border border-background-secondary"
                        >
                            ← Kembali
                        </button>
                    </motion.div>

                    {/* Aksi Tambahan (Muat Ulang) */}
                    <motion.div 
                        variants={itemVariants}
                        className="pt-4 border-t border-background-secondary"
                    >
                        <button
                            onClick={handleRefresh}
                            className="text-text-secondary hover:text-text transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                        >
                            <RefreshIcon />
                            Muat Ulang Halaman
                        </button>
                    </motion.div>

                    {/* Link Bantuan */}
                    <motion.div 
                        variants={itemVariants}
                        className="pt-6"
                    >
                        <p className="text-sm text-text-secondary mb-4">
                            Atau coba kunjungi:
                        </p>
                        {/* Link relevan berdasarkan konteks */}
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            {isAdminRoute ? (
                                // Link Admin
                                isAdminLoggedIn ? (
                                    <>
                                        <Link 
                                            to="/admin/dashboard" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Dashboard
                                        </Link>
                                        <Link 
                                            to="/admin/manage-topics" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Kelola Topik
                                        </Link>
                                        <Link 
                                            to="/admin/statistics" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Statistik
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link 
                                            to="/admin/login" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Login Admin
                                        </Link>
                                        <Link 
                                            to="/" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Halaman Utama
                                        </Link>
                                    </>
                                )
                            ) : (
                                // Link User
                                isUserLoggedIn ? (
                                    <>
                                        <Link 
                                            to="/home" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Beranda
                                        </Link>
                                        <Link 
                                            to="/kamus-budaya" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Kamus Budaya
                                        </Link>
                                    </>
                                ) : (
                                    <>
                                        <Link 
                                            to="/" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Beranda
                                        </Link>
                                        <Link 
                                            to="/admin/login" 
                                            className="text-primary hover:text-primary/80 transition-colors duration-200"
                                        >
                                            Admin
                                        </Link>
                                    </>
                                )
                            )}
                        </div>
                    </motion.div>

                    {/* Informasi Footer (Error Code, Timestamp, Path) */}
                    <motion.div 
                        variants={itemVariants}
                        className="pt-8 text-xs text-text-secondary"
                    >
                        <p className="mb-2">
                            {isAdminRoute 
                                ? "Jika Anda memerlukan bantuan teknis, hubungi administrator sistem."
                                : "Jika masalah berlanjut, silakan coba lagi nanti."
                            }
                        </p>
                        <p className="mb-2">
                            Error Code: 404 • {new Date().toLocaleString('id-ID')} {/* Timestamp lokal */}
                        </p>
                        <p className="text-xs opacity-70 break-all">
                            Path: {location.pathname} {/* Path URL yang error */}
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFoundPage;