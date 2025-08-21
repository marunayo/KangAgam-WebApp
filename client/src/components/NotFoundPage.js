import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// Icon components
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

const NotFoundPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Deteksi konteks berdasarkan URL
    const isAdminRoute = location.pathname.startsWith('/admin');
    const isUserRoute = location.pathname.startsWith('/home') || 
                        location.pathname.startsWith('/topik') || 
                        location.pathname.startsWith('/quiz') ||
                        location.pathname.startsWith('/kamus-budaya');

    // Tentukan status autentikasi berdasarkan konteks
    const getAuthStatus = () => {
        // Cek token dari localStorage atau context
        const userToken = localStorage.getItem('userToken');
        const adminToken = localStorage.getItem('adminToken');
        
        return {
            isUserLoggedIn: !!userToken,
            isAdminLoggedIn: !!adminToken,
            isAdmin: isAdminRoute && !!adminToken,
            isUser: isUserRoute && !!userToken
        };
    };

    const { isUserLoggedIn, isAdminLoggedIn, isAdmin, isUser } = getAuthStatus();

    const handleGoBack = () => {
        if (window.history.length > 1) {
            navigate(-1);
        } else {
            // Default navigation based on context
            if (isAdminRoute) {
                navigate(isAdminLoggedIn ? '/admin/dashboard' : '/admin/login');
            } else {
                navigate(isUserLoggedIn ? '/home' : '/');
            }
        }
    };

    const handleRefresh = () => {
        window.location.reload();
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: {
                duration: 0.6,
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    const floatingAnimation = {
        y: [-10, 10, -10],
        transition: {
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut"
        }
    };

    return (
        <div className="h-screen w-full bg-background flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
            <div className="w-full max-w-lg mx-auto">
                <motion.div 
                    className="w-full space-y-4 sm:space-y-6 lg:space-y-8 text-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Animated 404 Number - Responsive size */}
                    <motion.div 
                        className="relative mb-6 sm:mb-8"
                        variants={itemVariants}
                        animate={floatingAnimation}
                    >
                        <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold text-primary/20 select-none">
                            404
                        </h1>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-primary/10 flex items-center justify-center">
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

                    {/* Error Message - Responsive text sizes */}
                    <motion.div variants={itemVariants} className="space-y-3 sm:space-y-4 mb-8">
                        <h2 className="text-2xl sm:text-3xl font-bold text-text">
                            Halaman Tidak Ditemukan
                        </h2>
                        <p className="text-base sm:text-lg text-text-secondary px-2 max-w-md mx-auto">
                            {isAdminRoute 
                                ? "Halaman admin yang Anda cari tidak dapat ditemukan atau tidak tersedia."
                                : "Halaman yang Anda cari tidak dapat ditemukan atau telah dipindahkan."
                            }
                        </p>
                    </motion.div>

                    {/* Action Buttons - Full width on mobile, side by side on desktop */}
                    <motion.div 
                        variants={itemVariants}
                        className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6"
                    >
                        {/* Primary Action - Context Aware */}
                        {isAdminRoute ? (
                            // Admin Context
                            isAdminLoggedIn ? (
                                <Link
                                    to="/admin/dashboard"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <AdminIcon />
                                    Dashboard Admin
                                </Link>
                            ) : (
                                <Link
                                    to="/admin/login"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <LoginIcon />
                                    Login Admin
                                </Link>
                            )
                        ) : (
                            // User Context
                            isUserLoggedIn ? (
                                <Link
                                    to="/home"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <HomeIcon />
                                    Ke Beranda
                                </Link>
                            ) : (
                                <Link
                                    to="/"
                                    className="flex-1 bg-primary text-white px-6 py-3 rounded-lg hover:bg-primary/90 transition-colors duration-200 flex items-center justify-center gap-2 font-medium"
                                >
                                    <HomeIcon />
                                    Mulai Belajar
                                </Link>
                            )
                        )}

                        {/* Secondary Action */}
                        <button
                            onClick={handleGoBack}
                            className="flex-1 bg-background-secondary text-text px-6 py-3 rounded-lg hover:bg-background-secondary/80 transition-colors duration-200 font-medium border border-background-secondary"
                        >
                            ← Kembali
                        </button>
                    </motion.div>

                    {/* Additional Actions */}
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

                    {/* Helpful Links */}
                    <motion.div 
                        variants={itemVariants}
                        className="pt-6"
                    >
                        <p className="text-sm text-text-secondary mb-4">
                            Atau coba kunjungi:
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm">
                            {isAdminRoute ? (
                                // Admin Links
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
                                // User Links
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

                    {/* Footer Info */}
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
                            Error Code: 404 • {new Date().toLocaleString('id-ID')}
                        </p>
                        <p className="text-xs opacity-70 break-all">
                            Path: {location.pathname}
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default NotFoundPage;