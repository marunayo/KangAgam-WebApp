import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/admin/StatCard';
import MenuCard from '../../components/admin/MenuCard';
import { getDashboardData } from '../../services/dashboardService';
import LoadingIndicator from '../../components/ui/LoadingIndicator';

// Helper untuk mendapatkan nama topik dalam Bahasa Indonesia
const getTopicName = (nameData) => {
    if (!nameData) return 'N/A';
    if (typeof nameData === 'string') return nameData;
    if (Array.isArray(nameData)) {
        const idName = nameData.find(n => n.lang === 'id');
        if (idName) return idName.value;
        return nameData.length > 0 ? nameData[0].value : 'N/A';
    }
    return 'N/A';
};

// --- PERUBAHAN KUNCI 1 ---
// Ikon didefinisikan tanpa warna (colorless) agar fleksibel.
// Kelas seperti 'text-blue-800' telah dihapus dari sini.
const PawIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c-1.88 0-3.62.67-5 1.74-.14.1-.26.2-.37.3-.1.1-.18.2-.26.3-.09.1-.17.2-.24.3-.07.1-.14.2-.2.3-.06.1-.1.2-.15.3-.05.1-.08.2-.12.3-.04.1-.07.2-.1.3-.03.1-.05.2-.07.3-.02.1-.03.2-.04.3-.01.1-.02.2-.02.3s0 .2.01.3c0 .1.01.2.02.3s.03.2.04.3.05.2.07.3.07.2.1.3.08.2.12.3.1.2.15.3.14.2.2.3.17.2.24.3.18.2.26.3.23.2.37.3C8.38 17.33 10.12 18 12 18s3.62-.67 5-1.74c.14-.1.26-.2.37-.3.1-.1.18-.2.26-.3.09-.1.17-.2.24-.3.07-.1.14-.2.2-.3.06-.1-.1-.2-.15.3.05-.1.08-.2.12.3.04-.1.07.2-.1.3.03-.1-.05-.2-.07.3.02-.1.03.2.04.3.01-.1.02.2-.02-.3s0-.2-.01-.3c0-.1-.01-.2-.02-.3s-.03-.2-.04-.3-.05-.2-.07-.3-.07-.2-.1-.3-.08-.2-.12-.3-.1-.2-.15-.3-.14-.2-.2-.3-.17-.2-.24-.3-.18-.2-.26-.3-.23-.2-.37-.3C15.62 11.67 13.88 11 12 11zM12 21a9 9 0 100-18 9 9 0 000 18z" /></svg>;
const BookOpenIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-3-5.197" /></svg>;
const ChartBarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>;


const AdminDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            if (!user?.token) return;

            try {
                setIsLoading(true);
                const data = await getDashboardData({
                    visitorsPeriod: 'monthly',
                    topicPeriod: 'monthly',
                    cityPeriod: 'monthly',
                }, user.token);
                setStats(data);
            } catch (err) {
                setError('Gagal memuat data statistik.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    // --- PERUBAHAN KUNCI 2 ---
    // Data untuk StatCard. Ikon diwarnai di dalam komponen StatCard.
    // Properti warna untuk light & dark mode dikirim ke StatCard.
    const statsData = stats ? [
        { 
            title: 'Total Pengunjung', 
            value: stats.totalVisitors.toLocaleString('id-ID'), 
            icon: React.cloneElement(<PawIcon />, { className: 'h-8 w-8 text-blue-800 dark:text-blue-300' }),
            bgColor: 'bg-blue-100', 
            darkBgColor: 'dark:bg-blue-900/50',
        },
        { 
            title: 'Topik Favorit', 
            value: getTopicName(stats.favoriteTopic?.name) || 'N/A', 
            icon: React.cloneElement(<BookOpenIcon />, { className: 'h-8 w-8 text-green-800 dark:text-green-300' }),
            bgColor: 'bg-green-100',
            darkBgColor: 'dark:bg-green-900/50',
        },
        { 
            title: 'Total Topik', 
            value: stats.totalTopics, 
            icon: React.cloneElement(<BookOpenIcon />, { className: 'h-8 w-8 text-yellow-800 dark:text-yellow-300' }),
            bgColor: 'bg-yellow-100',
            darkBgColor: 'dark:bg-yellow-900/50',
        },
        { 
            title: 'Total Admin', 
            value: stats.totalAdmins, 
            icon: React.cloneElement(<UsersIcon />, { className: 'h-8 w-8 text-purple-800 dark:text-purple-300' }),
            bgColor: 'bg-purple-100',
            darkBgColor: 'dark:bg-purple-900/50',
        },
    ] : [];

    // --- PERUBAHAN KUNCI 3 ---
    // Data untuk MenuCard. Ikon sudah diberi warna awal di sini.
    // MenuCard akan menambahkan warna hover.
    const menuData = [
        { 
            title: 'Kelola Topik & Kosakata', 
            description: 'Tambah, ubah, hapus topik dan kosakata', 
            icon: <BookOpenIcon />, 
            to: '/admin/manage-topics' 
        },
        { 
            title: 'Kelola Admin', 
            description: 'Tambah atau hapus akun administrator', 
            icon: <UsersIcon />, 
            to: '/admin/manage-admins' 
        },
        { 
            title: 'Statistik Pengguna', 
            description: 'Lihat data dan grafik kunjungan', 
            icon: <ChartBarIcon />, 
            to: '/admin/statistics' 
        },
    ];

    return (
        <div>
            <div className="hidden lg:flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-text">Halo, {user?.adminName || 'Admin'}</h1>
                    <p className="text-text-secondary">Selamat datang kembali di dasbor Anda.</p>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <LoadingIndicator />
                </div>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {statsData.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>
            )}

            <div className="mt-10">
                <h2 className="text-xl font-bold text-text mb-4">Menu Admin</h2>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {menuData.map((menu, index) => (
                        <MenuCard key={index} {...menu} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;