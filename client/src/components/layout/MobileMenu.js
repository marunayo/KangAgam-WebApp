import React, { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// Import komponen pemilih tema khusus user
import UserThemeSwitcher from '../ui/UserThemeSwitcher';

// Komponen internal untuk ikon 'Close' (X)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

/**
 * Komponen menu "off-canvas" (slide dari kanan) untuk navigasi user di mobile (sm:hidden).
 * @param {boolean} isOpen - Status menu (terbuka/tertutup).
 * @param {function} onClose - Fungsi untuk menutup menu.
 */
const MobileMenu = ({ isOpen, onClose }) => {
    const { logout } = useAuth(); // Fungsi logout dari AuthContext
    const navigate = useNavigate(); // Hook untuk navigasi
    const { t, i18n } = useTranslation(); // Hook untuk translasi (i18next)

    // Handler untuk logout
    const handleLogout = () => {
        onClose(); // Tutup menu
        logout(); // Panggil fungsi logout
        navigate('/'); // Redirect ke halaman onboarding/awal
    };

    // Handler untuk mengganti bahasa
    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value); // Ubah bahasa menggunakan i18next
    };
    
    // Fungsi untuk menentukan style link navigasi mobile (aktif vs tidak aktif)
    const mobileNavLinkStyles = ({ isActive }) =>
        `block text-lg font-medium py-3 rounded-md px-3 transition-colors duration-200 ${
            isActive 
            ? 'bg-primary/10 text-primary' // Style jika aktif
            : 'text-gray-700 hover:bg-gray-100' // Style jika tidak aktif
        }`;

    // Efek untuk mencegah scrolling body saat menu mobile terbuka
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        // Cleanup function untuk mengembalikan scrolling
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isOpen]); // Jalankan efek saat prop 'isOpen' berubah

    return (
        // Container utama menu (fixed position, transisi opacity)
        <div 
            className={`sm:hidden fixed inset-0 z-40 transition-opacity duration-300
                        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop gelap di belakang menu */}
            <div 
                className="absolute inset-0 bg-black/40"
                onClick={onClose} // Klik backdrop menutup menu
                aria-hidden="true"
            ></div>
            
            {/* Panel menu yang slide dari kanan */}
            <div
                onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam menu menutupnya
                className={`relative ml-auto h-full w-3/4 max-w-sm bg-white shadow-xl
                            transform transition-transform duration-300 ease-in-out
                            flex flex-col
                            ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} // Transisi slide
            >
                {/* Header menu dengan judul dan tombol close */}
                <div className="flex justify-between items-center p-4 border-b">
                     <div className="text-gray-700 font-bold">Menu</div>
                    <button onClick={onClose} className="p-2 text-gray-600 hover:text-black" aria-label="Tutup menu">
                        <CloseIcon />
                    </button>
                </div>

                {/* Navigasi utama */}
                <nav className="p-6 flex-grow space-y-2">
                    <NavLink to="/home" onClick={onClose} className={mobileNavLinkStyles}>
                        Kamus Kosakata
                    </NavLink>
                    <NavLink to="/kamus-budaya" onClick={onClose} className={mobileNavLinkStyles}>
                        Kamus Budaya
                    </NavLink>
                </nav>
                
                {/* Footer menu: Pengaturan Tampilan, Bahasa, dan Tombol Logout */}
                <div className="p-6 border-t">
                    {/* Pengaturan Tampilan (Theme Switcher) */}
                    <div className="flex justify-between items-center mb-6">
                        <label className="text-sm font-medium text-gray-500">Mode Tampilan</label>
                        <UserThemeSwitcher />
                    </div>

                    {/* Pengaturan Bahasa */}
                    <div className="mb-4">
                        <label htmlFor="bahasa-mobile" className="block text-sm font-medium text-gray-500 mb-2">{t('languageLabel')}</label>
                        <select
                            id="bahasa-mobile"
                            name="bahasa"
                            className="w-full bg-gray-100 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-1 focus:ring-indigo-500"
                            onChange={changeLanguage}
                            value={i18n.language} // Nilai select mengikuti bahasa aktif i18next
                        >
                            <option value="id">Indonesia</option>
                            <option value="en">Inggris</option>
                            <option value="su">Sunda</option>
                        </select>
                    </div>
                    {/* Tombol Logout */}
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        {t('logoutButton')} 
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;