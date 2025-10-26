import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
// Pastikan path logo ini benar sesuai struktur proyek Anda
const logo = '/assets/images/logo-kang-agam.png';

// Komponen internal untuk ikon Menu (hamburger)
const MenuIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

/**
 * Komponen header untuk admin di tampilan mobile/tablet (lg:hidden).
 * Menampilkan logo, sapaan user, dan tombol toggle menu mobile.
 * @param {function} onMenuToggle - Fungsi untuk membuka/menutup menu mobile.
 */
const AdminHeader = ({ onMenuToggle }) => {
    const { user } = useAuth(); // Ambil data user dari AuthContext

    return (
        <header className="lg:hidden flex items-center justify-between p-4 bg-white shadow-md flex-shrink-0">
            {/* Logo, link ke dashboard */}
            <Link to="/admin/dashboard">
                <img src={logo} alt="Kang Agam Logo" className="h-9 w-auto" />
            </Link>
            {/* Sapaan user dan tombol menu */}
            <div>
                <span className="text-sm text-gray-600 mr-4">
                    Halo, {user?.adminEmail?.split('@')[0] || 'Admin'} {/* Ambil bagian sebelum @ dari email */}
                </span>
                <button onClick={onMenuToggle} className="p-2" aria-label="Buka menu">
                    <MenuIcon />
                </button>
            </div>
        </header>
    );
};

export default AdminHeader;