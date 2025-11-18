import React, { useState, useEffect } from 'react'; // Import React
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar'; // Navbar utama user
import MobileMenu from './MobileMenu'; // Menu mobile user
import { useAuth } from '../../context/AuthContext'; // Hook otentikasi
import Footer from '../../components/layout/Footer'; // Komponen Footer

/**
 * Komponen layout utama untuk halaman-halaman user (learner).
 * Mengatur struktur Navbar (fixed), konten utama, dan Footer.
 * Juga mengambil data statistik pengunjung untuk ditampilkan di Footer dan Navbar (jika perlu).
 */
const UserLayout = () => {
    // State untuk mengontrol visibilitas menu mobile
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // State untuk menyimpan total pengunjung unik
    const [totalUniqueVisitors, setTotalUniqueVisitors] = useState(0); 
    // Ambil data user dan token (meskipun token mungkin tidak digunakan langsung di sini)
    const { user, token } = useAuth(); 

    // Fungsi untuk toggle menu mobile (diteruskan ke Navbar)
    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    // Efek untuk mengambil data statistik pengunjung saat komponen dimuat
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/visitor-logs/stats`);
                setTotalUniqueVisitors(response.data.totalUniqueVisitors || 0);
            } catch (error) {
                console.error('Gagal mengambil statistik pengunjung:', error);
                setTotalUniqueVisitors(0); // Set ke 0 jika gagal
            }
        };
        
        fetchStats(); // Panggil fungsi fetch
    }, []); // Array dependensi kosong berarti efek ini hanya berjalan sekali saat mount

    return (
        <>
            {/* CSS inline untuk scrollbar-gutter dan variabel tinggi navbar */}
            <style>{`
                /* Menjaga ruang untuk scrollbar tanpa menampilkannya jika tidak perlu */
                .stable-scrollbar {
                    scrollbar-gutter: stable;
                }
                /* Variabel CSS untuk tinggi navbar (default mobile) */
                :root {
                    --navbar-height: 64px; 
                }
                /* Tinggi navbar untuk layar sm ke atas */
                @media (min-width: 640px) {
                    :root {
                        --navbar-height: 72px; 
                    }
                }
                
                /* Memberi padding atas pada konten utama sebesar tinggi navbar */
                .main-content {
                    padding-top: var(--navbar-height);
                }
            `}</style>
            
            {/* Komponen menu mobile (off-canvas) */}
            <MobileMenu isOpen={isMenuOpen} onClose={toggleMenu} />
            
            {/* Container utama layout */}
            <div className="bg-background min-h-screen flex flex-col">
                {/* Header (Navbar) yang fixed di atas */}
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background-secondary/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <Navbar
                        onMenuToggle={toggleMenu} // Prop untuk toggle menu mobile
                        isMenuOpen={isMenuOpen} // Status menu mobile (untuk ikon hamburger)
                        totalUniqueVisitors={totalUniqueVisitors} // Prop statistik
                    />
                </header>
                
                {/* Konten utama yang fleksibel (mengisi sisa ruang) */}
                <main className="flex-1 flex flex-col main-content">
                    {/* Wrapper agar konten mengisi ruang vertikal yang tersedia */}
                    <div className="flex-1 w-full pt-4 sm:pt-6">
                        <Outlet /> {/* Tempat merender komponen halaman spesifik user */}
                    </div>
                    {/* Komponen Footer di bagian bawah */}
                    <Footer totalUniqueVisitors={totalUniqueVisitors} /> 
                </main>
            </div>
        </>
    );
};

export default UserLayout;