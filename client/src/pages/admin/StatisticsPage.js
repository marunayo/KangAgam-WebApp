import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../context/AuthContext'; // Hook otentikasi
import { getDashboardData } from '../../services/dashboardService'; // Service API dashboard
import PageHeader from '../../components/ui/PageHeader'; // Komponen header halaman
import LoadingIndicator from '../../components/ui/LoadingIndicator'; // Indikator loading
import ExportControls from '../../components/admin/ExportControls'; // Komponen tombol ekspor

// Import komponen dan modul yang diperlukan dari Chart.js
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

// Registrasi komponen Chart.js yang akan digunakan
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

/**
 * Helper function untuk mendapatkan nama topik dalam Bahasa Indonesia.
 * @param {string | Array<{lang: string, value: string}>} nameData - Data nama topik.
 * @returns {string} Nama topik dalam Bahasa Indonesia atau 'N/A'.
 */
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

/**
 * Helper function untuk membuat gradient warna background pada chart bar.
 * @param {CanvasRenderingContext2D} ctx - Konteks canvas chart.
 * @param {object} area - Area chart.
 * @param {string} colorStart - Warna awal gradient (bawah).
 * @param {string} colorEnd - Warna akhir gradient (atas).
 * @returns {CanvasGradient} Gradient yang dibuat.
 */
const createGradient = (ctx, area, colorStart, colorEnd) => {
    const gradient = ctx.createLinearGradient(0, area.bottom, 0, area.top);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
};

/**
 * Komponen halaman Statistik Pengguna.
 * Menampilkan berbagai data statistik dalam bentuk chart bar
 * (Total Kunjungan, Topik Favorit, Pengunjung Unik, Asal Domisili)
 * dengan opsi filter periode dan tombol ekspor PDF.
 */
const StatisticsPage = () => {
    const { user } = useAuth(); // Ambil data user admin
    // Refs untuk mengakses instance chart (diperlukan untuk ekspor PDF)
    const visitorChartRef = useRef(null);
    const topicChartRef = useRef(null);
    const uniqueVisitorChartRef = useRef(null);
    const cityChartRef = useRef(null);

    // State untuk menyimpan data statistik dari API
    const [visitorStats, setVisitorStats] = useState({ total: 0, distribution: [] });
    const [topicStats, setTopicStats] = useState({ favorite: {}, distribution: [] });
    const [uniqueVisitorStats, setUniqueVisitorStats] = useState({ total: 0, distribution: [] });
    const [cityStats, setCityStats] = useState({ mostFrequent: {}, distribution: [] });

    // State untuk menyimpan pilihan filter periode saat ini
    const [filters, setFilters] = useState({
        visitorsPeriod: 'monthly', // Filter default untuk Total Kunjungan
        uniqueVisitorsPeriod: 'monthly', // Filter default untuk Pengunjung Unik
        topicPeriod: 'monthly', // Filter default untuk Topik Favorit
        cityPeriod: 'monthly', // Filter default untuk Asal Domisili
    });

    // State loading
    const [isInitialLoading, setIsInitialLoading] = useState(true); // Loading awal saat semua data diambil
    const [loadingStates, setLoadingStates] = useState({ // Loading per kartu saat filter diubah
        visitors: false,
        uniqueVisitors: false,
        topics: false,
        cities: false,
    });
    // State untuk menyimpan pesan error
    const [error, setError] = useState(null);

    // Fungsi untuk mengambil data statistik spesifik untuk satu kartu (dipanggil saat filter berubah)
    const fetchCardData = useCallback(async (cardType, currentFilters) => {
        if (!user?.token) return; // Validasi token
        setLoadingStates(prev => ({ ...prev, [cardType]: true })); // Set loading untuk kartu spesifik
        try {
            // Panggil API dengan filter yang diperbarui
            const data = await getDashboardData(currentFilters, user.token);
            // Update state yang relevan berdasarkan cardType
            switch (cardType) {
                case 'visitors':
                    setVisitorStats({ total: data.totalVisitors, distribution: data.visitorDistribution });
                    break;
                case 'uniqueVisitors':
                    setUniqueVisitorStats({ total: data.totalUniqueVisitors, distribution: data.uniqueVisitorDistribution });
                    break;
                case 'topics':
                    setTopicStats({ favorite: data.favoriteTopic, distribution: data.topicDistribution });
                    break;
                case 'cities':
                    setCityStats({ mostFrequent: data.mostfrequentcity, distribution: data.cityDistribution });
                    break;
                default:
                    break;
            }
        } catch (err) {
            setError(`Gagal memuat data untuk kartu ${cardType}.`); // Set error spesifik
            console.error(err);
        } finally {
            setLoadingStates(prev => ({ ...prev, [cardType]: false })); // Selesai loading untuk kartu spesifik
        }
    }, [user]); // Dependensi: user (token)

    // Efek untuk mengambil semua data statistik saat komponen pertama kali dimuat
    useEffect(() => {
        const fetchInitialData = async () => {
            if (!user?.token) return; // Validasi token
            setIsInitialLoading(true); // Mulai loading awal
            try {
                // Panggil API dengan filter default
                const data = await getDashboardData(filters, user.token);
                // Set semua state statistik
                setVisitorStats({ total: data.totalVisitors, distribution: data.visitorDistribution });
                setUniqueVisitorStats({ total: data.totalUniqueVisitors, distribution: data.uniqueVisitorDistribution });
                setTopicStats({ favorite: data.favoriteTopic, distribution: data.topicDistribution });
                setCityStats({ mostFrequent: data.mostfrequentcity, distribution: data.cityDistribution });
                setError(null); // Bersihkan error jika berhasil
            } catch (err) {
                setError('Gagal memuat data statistik awal.'); // Set error awal
                console.error(err);
            } finally {
                setIsInitialLoading(false); // Selesai loading awal
            }
        };
        fetchInitialData(); // Panggil fungsi fetch awal
    }, [user, filters]); // Dependensi: user (token) dan filters awal

    // Handler saat pilihan filter periode diubah
    const handleFilterChange = (e) => {
        const { name, value } = e.target; // Ambil nama filter dan nilainya
        const newFilters = { ...filters, [name]: value }; // Buat objek filter baru
        setFilters(newFilters); // Update state filter
        
        // Mapping nama filter di frontend ke tipe kartu (untuk fetch data spesifik)
        const cardTypeMap = {
            visitorsPeriod: 'visitors',
            uniqueVisitorsPeriod: 'uniqueVisitors',
            topicPeriod: 'topics',
            cityPeriod: 'cities',
        };
        
        const cardType = cardTypeMap[name]; // Tentukan tipe kartu berdasarkan nama filter yang berubah
        fetchCardData(cardType, newFilters); // Panggil fetch data untuk kartu yang relevan
    };

    // Konfigurasi data untuk chart Total Kunjungan
    const visitorChartData = {
        labels: visitorStats.distribution?.map(d => d.label) || [], // Label sumbu X (periode)
        datasets: [{
            label: 'Total Kunjungan',
            data: visitorStats.distribution?.map(d => d.count) || [], // Data jumlah kunjungan
            // Background gradient
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(124, 58, 237, 0.5)'; // Fallback jika area chart belum siap
                return createGradient(ctx, chartArea, '#A78BFA80', '#7C3AED'); // Warna ungu
            },
            borderColor: '#7C3AED', // Warna border bar
            borderWidth: 1,
            borderRadius: 8, // Sudut bar melengkung
        }],
    };

    // Konfigurasi data untuk chart Topik Favorit
    const topicChartData = {
        labels: topicStats.distribution?.map(d => getTopicName(d.name)) || [], // Label sumbu X (nama topik)
        datasets: [{
            label: 'Jumlah Kunjungan',
            data: topicStats.distribution?.map(d => d.count) || [], // Data jumlah kunjungan per topik
            // Background gradient
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(245, 158, 11, 0.5)';
                return createGradient(ctx, chartArea, '#FBBF2480', '#F59E0B'); // Warna kuning/oranye
            },
            borderColor: '#F59E0B',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    // Konfigurasi data untuk chart Pengunjung Unik
    const uniqueVisitorChartData = {
        labels: uniqueVisitorStats.distribution?.map(d => d.label) || [], // Label sumbu X (periode)
        datasets: [{
            label: 'Pengunjung Unik',
            data: uniqueVisitorStats.distribution?.map(d => d.count) || [], // Data jumlah pengunjung unik
            // Background gradient
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(5, 150, 105, 0.5)';
                return createGradient(ctx, chartArea, '#34D39980', '#059669'); // Warna hijau
            },
            borderColor: '#059669',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    // Konfigurasi data untuk chart Asal Domisili
    const cityChartData = {
        labels: cityStats.distribution?.map(d => d.label) || [], // Label sumbu X (nama kota)
        datasets: [{
            label: 'Jumlah Pengunjung',
            data: cityStats.distribution?.map(d => d.count) || [], // Data jumlah pengunjung per kota
            // Background gradient
            backgroundColor: (context) => {
                const { ctx, chartArea } = context.chart;
                if (!chartArea) return 'rgba(236, 72, 153, 0.5)';
                return createGradient(ctx, chartArea, '#F472B680', '#EC4899'); // Warna pink/magenta
            },
            borderColor: '#EC4899',
            borderWidth: 1,
            borderRadius: 8,
        }],
    };

    // Opsi konfigurasi umum untuk semua chart bar
    const chartOptions = {
        responsive: true, // Chart akan menyesuaikan ukuran container
        maintainAspectRatio: false, // Jangan paksakan aspek rasio (penting agar tinggi chart bisa diatur)
        plugins: { legend: { display: false } }, // Sembunyikan legenda
        scales: {
            // Konfigurasi sumbu Y (vertikal)
            y: { 
                beginAtZero: true, // Mulai dari 0
                grid: { display: false }, // Sembunyikan garis grid Y
                ticks: { color: 'rgb(var(--color-text-secondary))', precision: 0 } // Warna & presisi label Y
            },
            // Konfigurasi sumbu X (horizontal)
            x: { 
                grid: { display: false }, // Sembunyikan garis grid X
                ticks: { color: 'rgb(var(--color-text-secondary))' } // Warna label X
            },
        },
    };

    // Dapatkan nama kota paling sering muncul dari data distribusi
    const mostFrequentCityName = cityStats.distribution && cityStats.distribution.length > 0
        ? cityStats.distribution[0].label // Ambil label pertama (karena sudah diurutkan dari API)
        : 'N/A'; // Default jika tidak ada data

    // Tampilkan loading awal jika isInitialLoading true
    if (isInitialLoading) return <div className="flex items-center justify-center h-96"><LoadingIndicator /></div>;
    // Tampilkan error jika terjadi error awal dan belum ada data sama sekali
    if (error && !visitorStats.distribution) return <p className="text-center text-red-500">{error}</p>;

    // Render halaman statistik
    return (
        <div>
            {/* Header halaman dengan tombol Ekspor */}
            <PageHeader title="Statistik Pengguna">
                <ExportControls 
                    // Kirim semua data dan refs yang diperlukan ke komponen ExportControls
                    visitorData={visitorStats}
                    topicData={topicStats}
                    uniqueVisitorData={uniqueVisitorStats}
                    cityData={cityStats}
                    filters={filters}
                    visitorChartRef={visitorChartRef}
                    topicChartRef={topicChartRef}
                    uniqueVisitorChartRef={uniqueVisitorChartRef}
                    cityChartRef={cityChartRef}
                />
            </PageHeader>

            {/* Grid layout untuk kartu-kartu statistik */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                {/* Kartu: Total Kunjungan */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    {/* Header kartu: Judul dan Filter */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Total Kunjungan</h3>
                        {/* Dropdown filter periode */}
                        <select name="visitorsPeriod" value={filters.visitorsPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {/* Tampilkan loading atau data chart */}
                    {loadingStates.visitors ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            {/* Tampilkan total angka */}
                            <p className="text-5xl font-bold text-text">{visitorStats.total.toLocaleString('id-ID')}</p>
                            {/* Container chart dengan tinggi tetap */}
                            <div className="mt-4 h-60">
                                {/* Komponen Bar dari react-chartjs-2 */}
                                <Bar ref={visitorChartRef} options={chartOptions} data={visitorChartData} />
                            </div>
                        </>
                    )}
                </div>

                {/* Kartu: Topik Favorit */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    {/* Header kartu: Judul dan Filter */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Topik Favorit</h3>
                        <select name="topicPeriod" value={filters.topicPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {/* Tampilkan loading atau data chart */}
                    {loadingStates.topics ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            {/* Tampilkan nama topik favorit */}
                            <p className="text-3xl font-bold text-text">{getTopicName(topicStats.favorite?.name)}</p>
                            {/* Container chart */}
                            <div className="mt-4 h-60">
                                <Bar ref={topicChartRef} options={chartOptions} data={topicChartData} />
                            </div>
                        </>
                    )}
                </div>

                {/* Kartu: Pengunjung Unik */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    {/* Header kartu: Judul dan Filter */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Total Pengunjung</h3> {/* Judul mungkin perlu diubah ke "Pengunjung Unik" */}
                        <select name="uniqueVisitorsPeriod" value={filters.uniqueVisitorsPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {/* Tampilkan loading atau data chart */}
                    {loadingStates.uniqueVisitors ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            {/* Tampilkan total pengunjung unik */}
                            <p className="text-5xl font-bold text-text">{uniqueVisitorStats.total.toLocaleString('id-ID')}</p>
                            {/* Container chart */}
                            <div className="mt-4 h-60">
                                <Bar ref={uniqueVisitorChartRef} options={chartOptions} data={uniqueVisitorChartData} />
                            </div>
                        </>
                    )}
                </div>

                {/* Kartu: Asal Domisili */}
                <div className="bg-background-secondary p-6 rounded-xl shadow-md">
                    {/* Header kartu: Judul dan Filter */}
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-text">Domisili Pengunjung Terbanyak</h3>
                        <select name="cityPeriod" value={filters.cityPeriod} onChange={handleFilterChange} className="bg-background text-text-secondary rounded-lg px-3 py-1 text-sm border border-gray-300 dark:border-gray-600">
                            <option value="daily">Harian</option>
                            <option value="weekly">Mingguan</option>
                            <option value="monthly">Bulanan</option>
                            <option value="yearly">Tahunan</option>
                        </select>
                    </div>
                    {/* Tampilkan loading atau data chart */}
                    {loadingStates.cities ? (
                        <div className="h-72 flex items-center justify-center"><LoadingIndicator /></div>
                    ) : (
                        <>
                            {/* Tampilkan nama kota paling sering */}
                            <p className="text-3xl font-bold text-text capitalize">{mostFrequentCityName}</p>
                            {/* Container chart */}
                            <div className="mt-4 h-60">
                                <Bar ref={cityChartRef} options={chartOptions} data={cityChartData} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StatisticsPage;