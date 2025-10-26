import React, { useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ThemeSwitcher from '../admin/ThemeSwitcher'; // Komponen pemilih tema

// Komponen-komponen ikon internal
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-3-5.197" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const UserCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const ChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;


/**
 * Komponen menu "off-canvas" (slide dari kanan) untuk navigasi admin di mobile/tablet.
 * @param {boolean} isOpen - Status menu (terbuka/tertutup).
 * @param {function} onClose - Fungsi untuk menutup menu.
 */
const AdminMobileMenu = ({ isOpen, onClose }) => {
    const { logout } = useAuth(); // Fungsi logout dari AuthContext
    const navigate = useNavigate(); // Hook untuk navigasi

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

    // Handler untuk logout
    const handleLogout = () => {
        onClose(); // Tutup menu dulu
        logout(); // Panggil fungsi logout
        navigate('/admin/login'); // Redirect ke halaman login admin
    };

    // Kelas CSS dasar untuk link navigasi
    const navLinkClasses = "flex items-center gap-4 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100";
    // Kelas CSS untuk link navigasi yang aktif
    const activeLinkClasses = "flex items-center gap-4 px-4 py-3 rounded-lg text-blue-700 bg-blue-50 font-semibold";

    return (
        // Container utama menu (fixed position, transisi opacity)
        <div className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
            {/* Backdrop gelap di belakang menu */}
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true"></div>
            
            {/* Panel menu yang slide dari kanan */}
            <div 
                onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam menu menutupnya
                className={`relative ml-auto h-full w-3/4 max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                {/* Header menu dengan tombol close */}
                <div className="flex justify-end p-4 border-b">
                    <button onClick={onClose} className="p-2 text-gray-600 hover:text-black" aria-label="Tutup menu">
                        <CloseIcon />
                    </button>
                </div>
                
                {/* Navigasi utama */}
                <nav className="p-4 flex-grow">
                    <NavLink to="/admin/dashboard" onClick={onClose} className={({ isActive }) => isActive ? activeLinkClasses : navLinkClasses}>
                        <HomeIcon />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/admin/manage-topics" onClick={onClose} className={({ isActive }) => isActive ? activeLinkClasses : navLinkClasses}>
                        <BookIcon />
                        <span>Kelola Topik</span>
                    </NavLink>
                    <NavLink to="/admin/manage-admins" onClick={onClose} className={({ isActive }) => isActive ? activeLinkClasses : navLinkClasses}>
                        <UsersIcon />
                        <span>Kelola Admin</span>
                    </NavLink>
                    <NavLink to="/admin/manage-learners" onClick={onClose} className={({ isActive }) => isActive ? activeLinkClasses : navLinkClasses}>
                        <UserCircleIcon />
                        <span>Kelola Pengguna</span>
                    </NavLink>
                    <NavLink to="/admin/statistics" onClick={onClose} className={({ isActive }) => isActive ? activeLinkClasses : navLinkClasses}>
                        <ChartIcon />
                        <span>Statistik</span>
                    </NavLink>
                </nav>
                
                {/* Footer menu: ThemeSwitcher dan tombol Logout */}
                <div className="p-4 border-t flex items-center justify-between">
                    <ThemeSwitcher /> {/* Komponen pemilih tema */}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 rounded-lg text-red-500 hover:bg-red-50">
                        <LogoutIcon />
                        <span>Keluar</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminMobileMenu;