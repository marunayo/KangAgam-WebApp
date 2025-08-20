import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ✅ Impor modal untuk audio
import AudioProgressModal from '../components/ui/AudioProgressModal';

import KosakataCard from '../components/ui/KosakataCard';
import PageHeader from '../components/ui/PageHeader';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import Pagination from '../components/ui/Pagination';
import { getEntriesByTopicId } from '../services/entryService';
import { getTopicById } from '../services/topicService';

// ✅ Import komponen NotFound untuk error handling
import NotFoundPage from '../components/NotFoundPage';

// Hook untuk mendeteksi ukuran layar
const useMediaQuery = (query) => {
    const [matches, setMatches] = useState(window.matchMedia(query).matches);

    useEffect(() => {
        const media = window.matchMedia(query);
        const listener = () => setMatches(media.matches);
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }, [query]);

    return matches;
};

// Varian animasi
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
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};
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

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>;

const ENTRIES_PER_PAGE = 12;

const KosakataPage = () => {
    const { topicId } = useParams();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isDesktop = useMediaQuery('(min-width: 1024px)');
    const pageTopRef = useRef(null);
    const activeCardRef = useRef(null);
    const audioRef = useRef(null);

    const [topicInfo, setTopicInfo] = useState(null);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeEntry, setActiveEntry] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' atau 'desc'
    const [currentPage, setCurrentPage] = useState(1);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    
    // ✅ TAMBAHAN: State untuk mendeteksi apakah topik tidak ditemukan
    const [isTopicNotFound, setIsTopicNotFound] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                setError(null);
                setIsTopicNotFound(false);
                
                const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
                
                const [topicData, entriesData] = await Promise.all([
                    getTopicById(topicId),
                    getEntriesByTopicId(topicId),
                    minDelay
                ]);

                setTopicInfo(topicData.topic);
                setEntries(entriesData.entries || []);

                if (entriesData.entries && entriesData.entries.length > 0) {
                    setActiveEntry(entriesData.entries[0]);
                }
                
            } catch (err) {
                console.error('Error fetching data:', err);
                
                // ✅ PERBAIKAN: Cek apakah error adalah 404 (topik tidak ditemukan)
                if (err.response && err.response.status === 404) {
                    setIsTopicNotFound(true);
                } else if (err.response && err.response.status >= 400 && err.response.status < 500) {
                    // Client error lainnya (400, 401, 403, dll)
                    setError("Terjadi kesalahan dalam permintaan data.");
                } else if (err.response && err.response.status >= 500) {
                    // Server error (500, 502, dll)
                    setError("Server sedang mengalami gangguan. Silakan coba lagi nanti.");
                } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                    // Network error atau tidak ada response
                    setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
                } else {
                    // Error umum lainnya
                    setError("Terjadi kesalahan yang tidak diketahui.");
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [topicId]);

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1); // Reset ke halaman pertama setelah sorting
    };

    // ✅ FUNGSI BARU: Logika audio closing di-handle di sini
    const handleBackClick = (e) => {
        e.preventDefault();
        // Mencegah klik ganda saat transisi atau audio sedang berjalan
        if (isClosing || isAudioPlaying) return;

        setIsClosing(true);

        // Memilih salah satu dari dua varian audio closing agar tidak monoton.
        const closingSounds = [
            '/assets/audio/system/closing-1.wav',
            '/assets/audio/system/closing-2.wav',
        ];
        const randomSoundPath = closingSounds[Math.floor(Math.random() * closingSounds.length)];
        const audio = new Audio(randomSoundPath);

        // Fungsi untuk navigasi, dipanggil saat audio selesai atau error
        const navigateHome = () => {
            navigate('/home');
        };

        // Menambahkan event listener untuk menunggu audio selesai, lalu navigasi.
        audio.addEventListener('ended', navigateHome);
        
        // Penanganan jika audio gagal diputar
        audio.addEventListener('error', () => {
            console.error("Gagal memutar audio closing.");
            navigateHome(); // Langsung navigasi jika ada error
        });

        // Memutar audio, dan menangani jika promise play() di-reject
        audio.play().catch(error => {
            console.error("Gagal memulai audio closing:", error);
            navigateHome(); // Langsung navigasi jika ada error
        });
    };

    const findVocab = (entry, lang) => {
        if (!entry || !entry.entryVocabularies) return null;
        return entry.entryVocabularies.find(v => v.language.languageCode === lang) || entry.entryVocabularies[0];
    };
    
    const getTranslatedTopicName = () => {
        if (!topicInfo || !Array.isArray(topicInfo.topicName)) return 'Memuat...';
        const currentTranslation = topicInfo.topicName.find(t => t.lang === i18n.language);
        if (currentTranslation) return currentTranslation.value;
        const fallback = topicInfo.topicName.find(t => t.lang === 'id') || topicInfo.topicName[0];
        return fallback ? fallback.value : 'Judul Topik';
    };

    // Filter dan sort entries berdasarkan kosakata dalam bahasa yang aktif
    const filteredAndSortedEntries = entries
        .filter(entry => {
            const vocab = findVocab(entry, i18n.language);
            return vocab && vocab.vocab.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => {
            const vocabA = findVocab(a, i18n.language)?.vocab.toLowerCase() || '';
            const vocabB = findVocab(b, i18n.language)?.vocab.toLowerCase() || '';
            
            if (sortOrder === 'asc') {
                return vocabA.localeCompare(vocabB);
            } else {
                return vocabB.localeCompare(vocabA);
            }
        });

    const totalPages = Math.ceil(filteredAndSortedEntries.length / ENTRIES_PER_PAGE);
    const indexOfLastItem = currentPage * ENTRIES_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ENTRIES_PER_PAGE;
    const paginatedEntries = filteredAndSortedEntries.slice(indexOfFirstItem, indexOfLastItem);
    
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        if (pageTopRef.current) {
            const scrollableContainer = pageTopRef.current.closest('.stable-scrollbar');
            if (scrollableContainer) {
                scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const handleCardClick = (entry) => {
        if (isAudioPlaying || isClosing) return;
        setActiveEntry(entry);
        
        const audioUrl = findVocab(entry, i18n.language)?.audioUrl;
        if (!audioUrl) return;

        if (audioRef.current) {
            audioRef.current.pause();
        }

        const audio = new Audio(`/public${audioUrl.replace(/\\/g, '/')}`);
        audioRef.current = audio;
        setIsAudioPlaying(true);

        let playCount = 0;
        const handleAudioEnd = () => {
            playCount++;
            if (playCount < 2) {
                audio.currentTime = 0;
                audio.play();
            } else {
                setIsAudioPlaying(false);
                audio.removeEventListener('ended', handleAudioEnd);
            }
        };
        audio.addEventListener('ended', handleAudioEnd);
        audio.play();
    };

    const entriesToDisplay = isDesktop ? filteredAndSortedEntries : paginatedEntries;

    const isQuizDisabled = !entries || entries.length < 5;

    // ✅ PERBAIKAN: Jika loading, tampilkan loading indicator
    if (isLoading) {
        return <LoadingIndicator />;
    }

    // ✅ PERBAIKAN: Jika topik tidak ditemukan (404), tampilkan halaman NotFound
    if (isTopicNotFound) {
        return <NotFoundPage />;
    }

    const DetailPanel = () => {
        const languageOrder = ['id', 'su', 'en'];
        const mainLang = i18n.language;
        const otherLangs = languageOrder.filter(lang => lang !== mainLang);

        return (
            <div ref={activeCardRef}>
                <div className="bg-background-secondary rounded-2xl shadow-inner overflow-hidden">
                    <div className="aspect-square">
                        {activeEntry ? (
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeEntry._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    src={`/public${activeEntry.entryImagePath.replace(/\\/g, '/')}`} 
                                    alt="Gambar kosakata" 
                                    className="w-full h-full object-cover" 
                                />
                            </AnimatePresence>
                        ) : (
                            <div className="flex items-center justify-center text-text-secondary h-full">Pilih kosakata</div>
                        )}
                    </div>
                </div>
                {activeEntry && (
                    <div className="mt-4 text-center bg-background-secondary p-4 rounded-2xl shadow-md">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeEntry._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                <p className="text-2xl font-bold text-text">{findVocab(activeEntry, mainLang)?.vocab}</p>
                                {otherLangs.map(lang => (
                                    <p key={lang} className="text-lg text-text-secondary">{findVocab(activeEntry, lang)?.vocab}</p>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        );
    };

    return (
        <>
            <AudioProgressModal isOpen={isClosing} message="Sampai ketemu lagi!" />
            
            <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                ref={pageTopRef}
            >
                <div className="sticky top-0 z-20 bg-background pt-4 pb-4 border-b border-gray-200 dark:border-gray-700/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <PageHeader 
                                    title={getTranslatedTopicName()}
                                    visitCount={topicInfo?.visitCount}
                                />
                                <div className='flex items-center gap-4 w-full sm:w-auto'>
                                    <Link 
                                        to={isQuizDisabled ? '#' : `/quiz/${topicId}`}
                                        onClick={(e) => {
                                            if (isQuizDisabled || isClosing) e.preventDefault();
                                        }}
                                        className={`flex-1 text-center font-bold px-4 py-2 rounded-lg text-sm transition-opacity ${
                                            isQuizDisabled 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                                                : 'bg-primary text-white hover:opacity-90'
                                        }`}
                                        title={isQuizDisabled ? "Kuis membutuhkan minimal 5 kosakata" : "Mulai Kuis"}
                                    >
                                        {t('quizButton')}
                                    </Link>
                                    <button onClick={handleBackClick} className="flex-1 items-center justify-center gap-2 bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap flex">
                                        <span>←</span>
                                        <span>{t("backButton")}</span>
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                                <div className="relative w-full sm:max-w-xs">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                        <SearchIcon />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder="Cari kosakata..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text focus:ring-1 focus:ring-primary focus:border-primary shadow-sm"
                                    />
                                </div>
                                {/* Sort Button - Desktop & Mobile */}
                                <button 
                                    onClick={toggleSortOrder}
                                    className="bg-gray-500/10 text-text-secondary font-bold px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-500/20 flex-shrink-0 text-sm w-full sm:w-auto justify-center sm:justify-start"
                                    title={`Urut ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
                                >
                                    {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                                    <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-8">
                    {/* ✅ PERBAIKAN: Tampilkan error hanya jika ada error dan bukan 404 */}
                    {error && <p className="text-center text-red-500">{error}</p>}

                    {!error && !isLoading && entries.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-xl text-gray-500">Kosakata belum tersedia, ditunggu yah {'>'}.{'<'}</p>
                        </div>
                    )}
                    
                    {!error && entries.length > 0 && (
                        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                            {isDesktop && (
                                <div className="lg:col-span-1">
                                    <div className="lg:sticky lg:top-40 z-10">
                                        <DetailPanel />
                                    </div>
                                </div>
                            )}
                            
                            <div className={isDesktop ? "lg:col-span-2" : "w-full"}>
                                {entriesToDisplay.length > 0 ? (
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentPage}
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                                        >
                                            {entriesToDisplay.map((entry) => {
                                                const currentVocab = findVocab(entry, i18n.language);
                                                if (!currentVocab) return null;

                                                return (
                                                    <motion.div key={entry._id} variants={cardVariants}>
                                                        <KosakataCard 
                                                            content={currentVocab.vocab}
                                                            imageUrl={`/public${entry.entryImagePath.replace(/\\/g, '/')}`}
                                                            isActive={activeEntry && activeEntry._id === entry._id}
                                                            isPlaying={isAudioPlaying && activeEntry?._id === entry._id}
                                                            isAnyAudioPlaying={isAudioPlaying}
                                                            onCardClick={() => handleCardClick(entry)}
                                                        />
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                ) : (
                                    <div className="text-center py-20">
                                        <p className="text-xl text-gray-500">Kosakata yang Anda cari tidak ditemukan.</p>
                                    </div>
                                )}
                                {!isDesktop && (
                                    <div className="mt-12 pt-8">
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            onPageChange={handlePageChange}
                                            totalItems={filteredAndSortedEntries.length}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </>
    );
};

export default KosakataPage;