import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar'; // Sidebar untuk desktop
import AdminHeader from './AdminHeader'; // Header untuk mobile/tablet
import AdminMobileMenu from './AdminMobileMenu'; // Menu mobile (off-canvas)
import { useAuth } from '../../context/AuthContext';
import LoadingIndicator from '../ui/LoadingIndicator'; // Komponen loading

/**
 * Komponen layout utama untuk halaman-halaman admin.
 * Mengatur struktur sidebar (desktop), header (mobile), dan area konten utama.
 * Juga menangani tampilan menu mobile.
 */
const AdminLayout = () => {
    // State untuk mengontrol visibilitas menu mobile
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Ambil status loading otentikasi
    const { isAuthLoading } = useAuth();

    // Fungsi untuk toggle menu mobile
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Tampilkan loading jika status otentikasi belum selesai
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <LoadingIndicator />
            </div>
        );
    }

    return (
        <>
            {/* CSS inline untuk menjaga ruang scrollbar tetap ada (mencegah layout shift) */}
            <style>{`
                .stable-scrollbar {
                    scrollbar-gutter: stable;
                }
            `}</style>
            
            {/* Komponen menu mobile (off-canvas) */}
            <AdminMobileMenu isOpen={isMenuOpen} onClose={toggleMenu} />
            
            {/* Container utama layout */}
            <div className="bg-background min-h-screen flex">
                {/* Sidebar (hanya tampil di desktop, disembunyikan di mobile/tablet via CSS di komponen Sidebar) */}
                <Sidebar />
                
                {/* Kontainer fleksibel untuk header (mobile) dan konten */}
                <div className="flex-grow flex flex-col lg:ml-24 h-screen overflow-hidden"> 
                    {/* Header Admin (hanya tampil di mobile/tablet, disembunyikan di desktop via CSS di komponen AdminHeader) */}
                    <AdminHeader onMenuToggle={toggleMenu} />
                    
                    {/* Area konten utama yang bisa di-scroll */}
                    <div className="flex-grow overflow-y-auto stable-scrollbar">
                        <div className="p-4 sm:p-8"> {/* Padding untuk konten */}
                            <Outlet /> {/* Tempat merender komponen halaman spesifik */}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminLayout;