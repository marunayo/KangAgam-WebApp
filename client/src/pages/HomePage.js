import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // Hook untuk translasi (i18n)
import { useNavigate } from 'react-router-dom'; // Hook untuk navigasi
import { motion, AnimatePresence } from 'framer-motion'; // Untuk animasi

// Import hook audio kustom dan modal progress audio
import usePageAudio from '../hooks/usePageAudio';
import AudioProgressModal from '../components/ui/AudioProgressModal';

// Import komponen UI lainnya
import TopicCard from '../components/ui/TopicCard'; // Kartu untuk menampilkan topik
import PageHeader from '../components/ui/PageHeader'; // Header halaman (judul)
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Indikator loading
import Pagination from '../components/ui/Pagination'; // Komponen pagination
import InfoModal from '../components/ui/InfoModal'; // Modal untuk info (misal: topik kosong)

// Import service API dan context
import { getTopics } from '../services/topicService'; // Service untuk mengambil data topik
import { useAuth } from '../context/AuthContext'; // Context untuk data user
import { logVisit } from '../services/visitorLogService'; // Service untuk mencatat kunjungan

// Helper function untuk mendapatkan URL absolut gambar (sama seperti di KosakataPage)
const getImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath;
    if (imagePath.startsWith('/assets')) return imagePath;
    const cleanPath = imagePath.replace(/\\/g, '/');
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};


// Varian animasi untuk transisi halaman
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};
const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
};

// Varian animasi untuk container kartu (stagger children)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // Jeda antar animasi kartu
        },
    },
};

// Varian animasi untuk setiap kartu
const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
        },
    },
};

// Komponen ikon internal
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>;

// Konstanta jumlah topik per halaman
const TOPICS_PER_PAGE = 10;

/**
 * Komponen halaman utama (Beranda) untuk user.
 * Menampilkan daftar topik kosakata yang tersedia, dengan fitur pencarian, sorting,
 * pagination, dan audio pembuka.
 */
const HomePage = () => {
    const { t, i18n } = useTranslation(); // Hook i18n untuk translasi teks
    const navigate = useNavigate(); // Hook untuk navigasi antar halaman
    const { user } = useAuth(); // Hook untuk mendapatkan data user yang login
    const { playOpeningSound } = usePageAudio(); // Hook custom untuk memutar audio (opening/closing)

    // State untuk menyimpan data topik dari API
    const [topics, setTopics] = useState([]);
    // State untuk status loading data
    const [isLoading, setIsLoading] = useState(true);
    // State untuk menyimpan pesan error jika fetch gagal
    const [error, setError] = useState(null);
    // State untuk input pencarian topik
    const [searchTerm, setSearchTerm] = useState('');
    // State untuk urutan sorting (ascending/descending)
    const [sortOrder, setSortOrder] = useState('asc'); // Default 'asc' (A-Z)
    // State untuk halaman pagination saat ini
    const [currentPage, setCurrentPage] = useState(1);
    // State untuk mengontrol modal info (misalnya saat topik kosong)
    const [infoModal, setInfoModal] = useState({ isOpen: false, title: '', message: '' });
    // State untuk mengontrol tampilan modal progress audio pembuka
    const [isAudioPlaying, setIsAudioPlaying] = useState(true); // Default true agar modal tampil

    // Efek untuk memutar audio pembuka saat pertama kali mengunjungi halaman ini dalam sesi browser
    useEffect(() => {
        const playIntro = async () => {
            // Cek sessionStorage, jika belum ada 'hasVisitedHome', putar audio
            if (!sessionStorage.getItem('hasVisitedHome')) {
                try {
                    await playOpeningSound(); // Panggil fungsi putar audio dari hook
                    sessionStorage.setItem('hasVisitedHome', 'true'); // Tandai sudah diputar di sesi ini
                } catch (audioError) {
                    console.error("Gagal memutar audio pembuka:", audioError);
                    // Tetap lanjutkan meskipun audio gagal
                }
            }
            // Setelah audio selesai (atau gagal), sembunyikan modal progress
            setIsAudioPlaying(false); 
        };
        playIntro(); // Panggil fungsi playIntro
    }, [playOpeningSound]); // Dependensi hanya pada fungsi playOpeningSound dari hook

    // Efek untuk mengambil data topik dari API setiap kali bahasa UI (i18n.language) berubah
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true); // Mulai loading
                // Tambahkan delay minimum untuk efek visual (opsional)
                const minDelay = new Promise(resolve => setTimeout(resolve, 500)); 
                // Panggil service API getTopics dengan kode bahasa saat ini
                const dataFetch = getTopics(i18n.language); 
                // Tunggu kedua promise (fetch data dan delay) selesai
                const [data] = await Promise.all([dataFetch, minDelay]); 
                setTopics(data.topics || []); // Simpan data topik ke state (atau array kosong jika tidak ada)
                setError(null); // Bersihkan error jika fetch berhasil
            } catch (err) {
                setError("Gagal memuat topik dari server."); // Set pesan error jika fetch gagal
                console.error(err);
            } finally {
                setIsLoading(false); // Selesai loading (baik berhasil maupun gagal)
            }
        };
        fetchData(); // Panggil fungsi fetchData
    }, [i18n.language]); // Jalankan ulang efek ini jika i18n.language berubah

    // Handler untuk tombol sort (A-Z / Z-A)
    const toggleSortOrder = () => {
        // Ganti state sortOrder ke nilai sebaliknya ('asc' -> 'desc', 'desc' -> 'asc')
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc'); 
        setCurrentPage(1); // Reset pagination ke halaman pertama setelah sorting berubah
    };

    // Handler saat kartu (card) topik diklik oleh user
    const handleTopicClick = (topic) => {
        // Jangan lakukan apa pun jika audio pembuka masih berjalan
        if (isAudioPlaying) return; 

        // Cek apakah topik yang diklik memiliki entri kosakata
        if (!topic.topicEntries || topic.topicEntries.length === 0) {
            // Jika kosong, tampilkan modal informasi
            setInfoModal({
                isOpen: true,
                title: 'Informasi',
                message: 'Topik ini belum memiliki kosakata, ditunggu yah!',
            });
            return; // Hentikan proses navigasi
        }

        // Jika user login (ada data user dan ID), catat kunjungan ke topik ini
        if (user && user._id) {
            logVisit({ // Panggil service logVisit (async, tidak perlu ditunggu)
                learnerId: user._id,
                topicId: topic._id,
            }); 
        }
        // Navigasi ke halaman detail kosakata (/topik/:topicId)
        navigate(`/topik/${topic._id}`); 
    };

    // Filter daftar topik berdasarkan input searchTerm (nama topik)
    // Kemudian sort berdasarkan sortOrder (A-Z atau Z-A)
    const filteredAndSortedTopics = topics
        .filter(topic => // Filter: cek apakah nama topik (lowercase) mengandung searchTerm (lowercase)
            topic.topicName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => { // Sort: bandingkan nama topik a dan b
            const nameA = a.topicName.toLowerCase();
            const nameB = b.topicName.toLowerCase();
            
            if (sortOrder === 'asc') { // Jika ascending (A-Z)
                return nameA.localeCompare(nameB); // Gunakan localeCompare untuk sorting string yang benar
            } else { // Jika descending (Z-A)
                return nameB.localeCompare(nameA);
            }
        });

    // Logika untuk pagination: hitung total halaman, index item awal dan akhir di halaman saat ini
    const totalPages = Math.ceil(filteredAndSortedTopics.length / TOPICS_PER_PAGE);
    const indexOfLastItem = currentPage * TOPICS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - TOPICS_PER_PAGE;
    // Ambil data topik yang akan ditampilkan di halaman saat ini
    const currentTopics = filteredAndSortedTopics.slice(indexOfFirstItem, indexOfLastItem);
    // Handler untuk mengganti halaman pagination
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // Jika masih loading awal, tampilkan loading indicator full page
    if (isLoading) {
        return <LoadingIndicator />;
    }

    // Render Halaman Utama
    return (
        // Wrapper utama dengan animasi transisi masuk/keluar halaman
        <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="flex flex-col min-h-full" // flex-col min-h-full untuk memastikan footer di bawah
        >
            {/* Modal progress audio pembuka (tampil jika isAudioPlaying true dan tidak sedang loading data) */}
            <AudioProgressModal isOpen={isAudioPlaying && !isLoading} message="Ayoo kita belajar..." />
            
            {/* Header Halaman (dibuat sticky di atas) */}
            <div className="sticky top-[var(--navbar-height)] z-10 bg-background border-b border-gray-200 dark:border-gray-700"> {/* var(--navbar-height) dari UserLayout.js */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Konten Header: Judul Halaman, Input Search, Tombol Sort */}
                    <div className="py-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                        {/* Komponen PageHeader untuk judul */}
                        <PageHeader title={t('welcomeMessage')} /> {/* Teks judul diambil dari i18n */}
                        {/* Kontainer untuk Search dan Sort */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                            {/* Input Search */}
                            <div className="relative w-full sm:w-auto sm:flex-grow">
                                {/* Ikon search di dalam input */}
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                    <SearchIcon />
                                </span>
                                {/* Input field */}
                                <input
                                    type="text"
                                    placeholder="Cari topik..." // Placeholder
                                    value={searchTerm} // Nilai dari state
                                    onChange={(e) => setSearchTerm(e.target.value)} // Update state saat diketik
                                    className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text focus:ring-1 focus:ring-primary focus:border-primary" // Styling
                                />
                            </div>
                            {/* Tombol Sort */}
                            <button 
                                onClick={toggleSortOrder} // Handler klik
                                // Styling tombol
                                className="bg-gray-500/10 text-text-secondary font-bold px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-500/20 flex-shrink-0 text-sm w-full sm:w-auto justify-center sm:justify-start"
                                title={`Urut ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`} // Tooltip
                            >
                                {/* Ikon sort (berubah sesuai state sortOrder) */}
                                {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />} 
                                {/* Teks sort (A-Z / Z-A) */}
                                <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span> 
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Konten Utama Halaman (Grid Topik dan Pagination) */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow w-full flex flex-col">
                {error ? ( // Jika ada error saat fetch data, tampilkan pesan error
                    <p className="text-center text-red-500 mt-8">{error}</p>
                ) : ( // Jika tidak ada error
                    <>
                        {/* Kondisi jika tidak loading DAN tidak ada topik setelah filter/search */}
                        {!isLoading && filteredAndSortedTopics.length === 0 ? (
                            // Tampilkan pesan "Topik belum tersedia" di tengah halaman
                            <div className="text-center py-20 flex-grow flex items-center justify-center">
                                <p className="text-xl text-text-secondary">Topik belum tersedia, ditunggu yah {'>'}.{'<'}</p>
                            </div>
                        ) : (
                            // Jika ada topik yang akan ditampilkan
                            <>
                                {/* Container utama untuk grid, flex-grow agar mengisi ruang */}
                                <div className="flex-grow"> 
                                    {/* AnimatePresence untuk animasi keluar-masuk saat halaman pagination berubah */}
                                    <AnimatePresence mode="wait"> 
                                        {/* motion.div sebagai wrapper grid dengan key={currentPage} agar animasi berjalan */}
                                        <motion.div
                                            key={currentPage} // Kunci animasi berdasarkan halaman saat ini
                                            variants={containerVariants} // Varian animasi container (stagger)
                                            initial="hidden" // State awal animasi
                                            animate="visible" // State akhir animasi
                                            // Grid responsif untuk kartu topik
                                            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 mt-12"
                                        >
                                            {/* Mapping data topik di halaman saat ini (currentTopics) */}
                                            {currentTopics.map((topic) => (
                                                // motion.div sebagai wrapper kartu dengan animasi individual
                                                <motion.div key={topic._id} variants={cardVariants}>
                                                    {/* Render komponen TopicCard */}
                                                    <TopicCard
                                                        title={topic.topicName} // Nama topik
                                                        imageUrl={getImageUrl(topic.topicImagePath)} // URL gambar (pakai helper)
                                                        onClick={() => handleTopicClick(topic)} // Handler klik
                                                        visitCount={topic.visitCount} // Jumlah kunjungan (opsional)
                                                    />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                
                                {/* Pagination di bagian paling bawah halaman */}
                                <div className="mt-auto pt-8 pb-8"> {/* mt-auto mendorong pagination ke bawah */}
                                    {/* Komponen Pagination */}
                                    <Pagination
                                        currentPage={currentPage} // Halaman saat ini
                                        totalPages={totalPages} // Total halaman
                                        onPageChange={handlePageChange} // Handler ganti halaman
                                        totalItems={filteredAndSortedTopics.length} // Jumlah total item setelah filter
                                    />
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
            
            {/* Modal Info (untuk notifikasi topik kosong) */}
            <InfoModal 
                isOpen={infoModal.isOpen} // Status buka/tutup modal
                onClose={() => setInfoModal({ isOpen: false, title: '', message: '' })} // Handler tutup modal
                title={infoModal.title} // Judul modal
                message={infoModal.message} // Pesan modal
            />
        </motion.div>
    );
};

export default HomePage;