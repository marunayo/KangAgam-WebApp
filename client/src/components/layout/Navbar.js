import React from 'react'; // Import React meskipun tidak ada JSX kompleks
import { useAuth } from '../../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import komponen pemilih tema khusus user
import UserThemeSwitcher from '../ui/UserThemeSwitcher';

// Path ke logo (pastikan sesuai struktur folder Anda)
const logo = '/assets/images/logo-kang-agam.png';

/**
 * Komponen Navbar utama untuk user (desktop dan mobile trigger).
 * @param {function} onMenuToggle - Fungsi untuk toggle menu mobile.
 * @param {boolean} isMenuOpen - Status menu mobile (untuk styling ikon hamburger).
 * @param {number|string} totalUniqueVisitors - Jumlah pengunjung (opsional, saat ini dikomentari).
 */
const Navbar = ({ onMenuToggle, isMenuOpen, totalUniqueVisitors }) => {
    const { logout } = useAuth(); // Fungsi logout dari AuthContext
    const navigate = useNavigate(); // Hook untuk navigasi
    const { t, i18n } = useTranslation(); // Hook untuk translasi (i18next)

    // Handler untuk logout
    const handleLogout = () => {
        logout(); // Panggil fungsi logout dari context
        navigate('/'); // Redirect ke halaman onboarding/awal
    };

    // Handler untuk mengganti bahasa
    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value); // Ubah bahasa menggunakan i18next
    };
    
    // Fungsi untuk menentukan style link navigasi desktop (aktif vs tidak aktif)
    const navLinkStyles = ({ isActive }) =>
        `text-sm font-semibold px-3 py-2 rounded-md transition-colors duration-200 ${
            isActive 
            ? 'bg-primary/10 text-primary' // Style jika aktif
            : 'text-text-secondary hover:bg-gray-500/10' // Style jika tidak aktif
        }`;


    return (
        <header className="bg-background-secondary border-b border-gray-200 dark:border-gray-700/50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between gap-4 py-4">
                    {/* Bagian Kiri: Logo */}
                    <div className="flex items-center gap-4">
                        <NavLink to="/home"> {/* Logo mengarah ke home */}
                            <img src={logo} alt="Kang Agam Logo" className="h-9 sm:h-10 w-auto" />
                        </NavLink>
                        {/* Statistik Pengunjung (saat ini dikomentari) */}
                        {/* <span className="text-sm text-text-secondary font-medium">
                            {t('totalVisitors', { count: totalUniqueVisitors })}
                        </span> */}
                    </div>

                    {/* Bagian Tengah/Kanan (Desktop): Navigasi, Tema, Bahasa, Logout */}
                    <nav className="hidden sm:flex items-center gap-2"> {/* Hanya tampil di layar sm ke atas */}
                        {/* Link Navigasi */}
                        <NavLink to="/home" className={navLinkStyles}>
                            Kamus Kosakata
                        </NavLink>
                        {/* Link Kamus Budaya (saat ini dikomentari) */}
                        {/* <NavLink to="/kamus-budaya" className={navLinkStyles}>
                            Kamus Budaya
                        </NavLink> */}
                        
                        {/* Pemisah vertikal */}
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>

                        {/* Pemilih Tema */}
                        <UserThemeSwitcher />

                        {/* Pemilih Bahasa */}
                        <div className="flex items-center">
                            <select
                                id="bahasa-nav-desktop"
                                name="bahasa"
                                className="bg-background border border-gray-300 dark:border-gray-600 rounded-lg pl-3 pr-8 py-2 text-sm font-medium text-text-secondary focus:ring-1 focus:ring-primary"
                                onChange={changeLanguage}
                                value={i18n.language} // Nilai select mengikuti bahasa aktif i18next
                            >
                                <option value="id">Indonesia</option>
                                <option value="su">Sunda</option>
                                <option value="en">Inggris</option>
                            </select>
                        </div>
                        {/* Tombol Logout */}
                        <button
                            onClick={handleLogout}
                            className="bg-red-500/10 text-red-500 text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-500/20 transition-colors"
                        >
                            {t('logoutButton')}
                        </button>
                    </nav>

                    {/* Bagian Kanan (Mobile): Tombol Hamburger Menu */}
                    <div className="sm:hidden"> {/* Hanya tampil di layar di bawah sm */}
                        <button onClick={onMenuToggle} className="p-2 -mr-2 focus:outline-none z-50 relative" aria-label="Buka menu">
                            {/* Animasi ikon hamburger menjadi X */}
                            <div className="w-6 h-0.5 bg-text rounded-full transition-all duration-300" style={{ transform: isMenuOpen ? 'rotate(45deg) translate(4px, 4px)' : 'none' }}></div>
                            <div className="w-6 h-0.5 bg-text rounded-full my-1.5 transition-all duration-300" style={{ opacity: isMenuOpen ? 0 : 1 }}></div>
                            <div className="w-6 h-0.5 bg-text rounded-full transition-all duration-300" style={{ transform: isMenuOpen ? 'rotate(-45deg) translate(4px, -4px)' : 'none' }}></div>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Navbar;