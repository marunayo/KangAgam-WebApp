import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // Hook routing
import { useTranslation } from 'react-i18next'; // Hook i18n
import { motion, AnimatePresence } from 'framer-motion'; // Animasi

// Import modal untuk menampilkan progress audio
import AudioProgressModal from '../components/ui/AudioProgressModal';

// Import komponen UI lainnya
import KosakataCard from '../components/ui/KosakataCard'; // Kartu kosakata
import PageHeader from '../components/ui/PageHeader'; // Header halaman
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Indikator loading
import Pagination from '../components/ui/Pagination'; // Komponen pagination

// Import service API
import { getEntriesByTopicId } from '../services/entryService'; // Ambil kosakata
import { getTopicById } from '../services/topicService'; // Ambil info topik

// Import komponen halaman 404
import NotFoundPage from '../components/NotFoundPage';

// ====================================================================
// HELPER URL GAMBAR & AUDIO
// ====================================================================
/**
 * Helper function untuk mendapatkan URL absolut gambar atau audio.
 * Menangani path relatif dari backend, path aset lokal, dan URL absolut.
 * @param {string} path - Path relatif atau URL.
 * @returns {string} URL absolut.
 */
const getImageUrl = (imagePath) => {
    if (!imagePath) return ''; // Kembalikan string kosong jika path tidak ada
    // Jika sudah URL absolut, kembalikan langsung
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    // Jika path aset lokal (biasanya dari public folder), kembalikan apa adanya
    if (imagePath.startsWith('/assets')) {
        return imagePath;
    }
    // Jika path dari backend (mungkin mengandung backslash)
    const cleanPath = imagePath.replace(/\\/g, '/'); // Ganti backslash jadi slash
    // Ambil base URL API dari environment variable atau default ke localhost
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';
    // Gabungkan base URL dengan path (pastikan hanya ada satu slash pemisah)
    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};

// ====================================================================
// FUNGSI SORTING PINTAR (INTELLIGENT SORTING)
// Digunakan untuk mengurutkan kosakata secara numerik jika topiknya tentang angka,
// atau secara alfabetis jika bukan.
// ====================================================================

// Kata kunci angka inti untuk deteksi bahasa Indonesia, Sunda, Inggris
const coreNumbers = {
    'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
    'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
    'hiji': 1, 'tilu': 3, 'opat': 4, 'genep': 6, 'dalapan': 8, 'salapan': 9, 'sapuluh': 10,
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

/**
 * Mengekstrak nilai numerik dari string (kata atau angka).
 * @param {string} str - String input.
 * @returns {number | null} Nilai numerik atau null jika tidak terdeteksi.
 */
const extractNumericValue = (str) => {
    if (!str || typeof str !== 'string') return null;
    const cleanStr = str.toLowerCase().trim();
    if (coreNumbers[cleanStr] !== undefined) return coreNumbers[cleanStr]; // Cek mapping langsung
    if (/^\d+$/.test(cleanStr)) return parseInt(cleanStr); // Cek digit angka
    // TODO: Tambahkan parsing lebih kompleks jika diperlukan (puluh, belas, teens, dll.)
    // const indonesianPattern = ...
    // const englishPattern = ...
    // const englishTeens = ...
    return null; // Return null jika tidak terdeteksi
};

// Parser angka Indonesia (placeholder, bisa dikembangkan)
const parseIndonesianNumber = (str) => { /* ... implementasi ... */ return null; };
// Parser angka Inggris (placeholder, bisa dikembangkan)
const parseEnglishNumber = (str) => { /* ... implementasi ... */ return null; };

/**
 * Mendeteksi apakah mayoritas kosakata dalam sampel adalah angka.
 * @param {Array} entries - Daftar kosakata.
 * @param {number} sampleSize - Jumlah sampel yang dicek.
 * @param {string} language - Kode bahasa ('id', 'su', 'en').
 * @returns {boolean} True jika dianggap topik angka.
 */
const isNumberTopic = (entries, sampleSize = 5, language = 'id') => {
    if (!entries || entries.length === 0) return false;
    const sample = entries.slice(0, Math.min(sampleSize, entries.length));
    const numberCount = sample.filter(entry => {
        const vocab = findVocab(entry, language); // Gunakan helper findVocab
        return vocab && extractNumericValue(vocab.vocab) !== null; // Cek apakah vocab adalah angka
    }).length;
    // Anggap topik angka jika lebih dari 70% sampel adalah angka
    return sample.length > 0 && (numberCount / sample.length) > 0.7;
};

/**
 * Helper function untuk mencari objek kosakata berdasarkan kode bahasa.
 * @param {object} entry - Objek entri kosakata.
 * @param {string} lang - Kode bahasa ('id', 'su', 'en').
 * @returns {object | null} Objek kosakata atau null.
 */
const findVocab = (entry, lang) => {
    if (!entry || !entry.entryVocabularies) return null;
    // Cari vocab yang cocok dengan bahasa, atau fallback ke vocab pertama jika tidak ketemu
    return entry.entryVocabularies.find(v => v.language.languageCode === lang) || entry.entryVocabularies[0];
};

// ====================================================================
// HOOK CUSTOM MEDIA QUERY & VARIAN ANIMASI
// ====================================================================

/**
 * Hook custom sederhana untuk mendeteksi ukuran layar (media query).
 * @param {string} query - String media query (e.g., '(min-width: 1024px)').
 * @returns {boolean} True jika query cocok.
 */
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
// Varian animasi untuk container kartu (stagger)
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
        },
    },
};
// Varian animasi untuk kartu individual
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


// Konstanta jumlah entri per halaman (untuk mobile/tablet)
const ENTRIES_PER_PAGE = 12;

/**
 * Komponen halaman Kosakata.
 * Menampilkan daftar kosakata dalam satu topik, detail kosakata (di desktop),
 * fitur pencarian, sorting (pintar), pagination (mobile/tablet), dan pemutaran audio.
 * Juga menangani audio opening/closing dan error 404 jika topik tidak ditemukan.
 */
const KosakataPage = () => {
    const { topicId } = useParams(); // Ambil ID topik dari parameter URL
    const { t, i18n } = useTranslation(); // Hook i18n
    const navigate = useNavigate(); // Hook navigasi
    const location = useLocation(); // Hook lokasi (untuk state dari halaman sebelumnya)
    const isDesktop = useMediaQuery('(min-width: 1024px)'); // Cek ukuran layar
    const pageTopRef = useRef(null); // Ref untuk elemen teratas (untuk scroll)
    const activeCardRef = useRef(null); // Ref untuk panel detail (tidak terlalu digunakan)
    const audioRef = useRef(null); // Ref untuk menyimpan objek Audio yang sedang diputar

    // State data topik dan kosakata
    const [topicInfo, setTopicInfo] = useState(null); // Informasi detail topik
    const [entries, setEntries] = useState([]); // Daftar entri/kosakata
    // State UI dan kontrol
    const [isLoading, setIsLoading] = useState(true); // Status loading data
    const [error, setError] = useState(null); // Menyimpan pesan error
    const [activeEntry, setActiveEntry] = useState(null); // Entri yang sedang aktif/ditampilkan di detail
    const [searchTerm, setSearchTerm] = useState(''); // Nilai input pencarian
    const [sortOrder, setSortOrder] = useState('asc'); // Urutan sorting ('asc' atau 'desc')
    const [currentPage, setCurrentPage] = useState(1); // Halaman pagination saat ini
    const [isAudioPlaying, setIsAudioPlaying] = useState(false); // Status apakah audio kosakata sedang diputar
    const [isClosing, setIsClosing] = useState(false); // Status saat audio closing sedang diputar (untuk tombol kembali)
    const [isOpening, setIsOpening] = useState(false); // Status saat audio opening sedang diputar
    const [isTopicNotFound, setIsTopicNotFound] = useState(false); // Status jika API mengembalikan 404

    /**
     * Menghentikan audio yang sedang diputar dan mereset state terkait.
     * Dibungkus useCallback agar referensi fungsinya stabil.
     */
    const stopCurrentAudio = useCallback(() => {
        if (audioRef.current) { // Jika ada objek Audio aktif
            audioRef.current.pause(); // Jeda
            audioRef.current.currentTime = 0; // Reset waktu
            // Hapus listener untuk mencegah memory leak
            audioRef.current.removeEventListener('ended', () => {}); 
            audioRef.current = null; // Hapus referensi
        }
        setIsAudioPlaying(false); // Update state
    }, []); // Tidak ada dependensi

    // Efek cleanup: Hentikan audio saat komponen di-unmount
    useEffect(() => {
        return () => { // Fungsi cleanup akan dijalankan saat unmount
            stopCurrentAudio();
        };
    }, [stopCurrentAudio]);

    // Efek: Hentikan audio jika tab browser tidak aktif atau halaman ditutup/refresh
    useEffect(() => {
        const handleBeforeUnload = () => stopCurrentAudio(); // Handler sebelum unload
        const handleVisibilityChange = () => { // Handler saat visibilitas tab berubah
            if (document.hidden) stopCurrentAudio(); // Hentikan jika tab tersembunyi
        };
        // Tambahkan event listeners
        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        // Cleanup: Hapus listeners saat unmount
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [stopCurrentAudio]);

    // Efek: Putar audio opening saat halaman dimuat (jika tidak kembali dari kuis)
    useEffect(() => {
        // Cek state 'fromQuiz' yang mungkin dikirim dari halaman Kuis
        if (location.state?.fromQuiz) {
            return; // Lewati jika kembali dari kuis
        }

        const playOpeningAudio = () => {
            setIsOpening(true); // Tampilkan modal progress opening
            const openingAudioPath = '/assets/audio/system/opening.wav';
            const audio = new Audio(openingAudioPath);
            // Fungsi yang dipanggil saat audio selesai/error
            const finishOpening = () => setIsOpening(false); 
            // Tambahkan listeners
            audio.addEventListener('ended', finishOpening);
            audio.addEventListener('error', (error) => {
                console.error("Gagal memutar audio opening:", error);
                finishOpening(); // Tetap selesaikan meskipun error
            });
            // Mulai putar audio
            audio.play().catch(error => {
                console.error("Gagal memulai audio opening:", error);
                finishOpening(); // Tetap selesaikan meskipun error
            });
        };
        // Beri jeda singkat sebelum memutar
        const timer = setTimeout(playOpeningAudio, 100);
        return () => clearTimeout(timer); // Cleanup timer
    }, [location.state]); // Dependensi pada location.state

    // Efek utama: Mengambil data topik dan kosakata dari API saat topicId berubah
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true); // Mulai loading
                setError(null); // Reset error
                setIsTopicNotFound(false); // Reset status 404
                
                const minDelay = new Promise(resolve => setTimeout(resolve, 1000)); // Delay minimum
                
                // Panggil API secara paralel
                const [topicData, entriesData] = await Promise.all([
                    getTopicById(topicId), // Ambil info topik
                    getEntriesByTopicId(topicId), // Ambil daftar kosakata
                    minDelay
                ]);

                setTopicInfo(topicData.topic); // Simpan info topik
                setEntries(entriesData.entries || []); // Simpan daftar kosakata

                // Jika ada kosakata, set kosakata pertama sebagai aktif (untuk tampilan detail)
                if (entriesData.entries && entriesData.entries.length > 0) {
                    setActiveEntry(entriesData.entries[0]); 
                }
                
            } catch (err) { // Tangani error
                console.error('Error fetching data:', err);
                if (err.response && err.response.status === 404) {
                    setIsTopicNotFound(true); // Set status 404 jika topik tidak ditemukan
                } else if (err.response && err.response.status >= 400 && err.response.status < 500) {
                    setError("Terjadi kesalahan dalam permintaan data.");
                } else if (err.response && err.response.status >= 500) {
                    setError("Server sedang mengalami gangguan. Silakan coba lagi nanti.");
                } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                    setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
                } else {
                    setError("Terjadi kesalahan yang tidak diketahui.");
                }
            } finally {
                setIsLoading(false); // Selesai loading
            }
        };
        fetchData(); // Panggil fungsi fetch
    }, [topicId]); // Jalankan ulang jika topicId berubah

    // Handler tombol sort
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1); // Reset halaman ke 1
    };

    // Handler tombol "Kembali"
    const handleBackClick = (e) => {
        e.preventDefault(); // Cegah aksi default Link
        // Jangan lakukan jika sedang transisi audio
        if (isClosing || isOpening) return; 

        stopCurrentAudio(); // Hentikan audio kosakata jika ada
        setIsClosing(true); // Tampilkan modal progress closing

        // Pilih audio closing secara acak
        const closingSounds = [ '/assets/audio/system/closing-1.wav', '/assets/audio/system/closing-2.wav' ];
        const randomSoundPath = closingSounds[Math.floor(Math.random() * closingSounds.length)];
        const audio = new Audio(randomSoundPath);
        // Fungsi navigasi setelah audio selesai/error
        const navigateHome = () => navigate('/home'); 
        // Tambahkan listeners
        audio.addEventListener('ended', navigateHome);
        audio.addEventListener('error', () => { console.error("Gagal memutar audio closing."); navigateHome(); });
        // Putar audio
        audio.play().catch(error => { console.error("Gagal memulai audio closing:", error); navigateHome(); });
    };

    /**
     * Mendapatkan nama topik yang sudah diterjemahkan sesuai bahasa UI saat ini.
     * @returns {string} Nama topik terjemahan atau fallback.
     */
    const getTranslatedTopicName = () => {
        if (!topicInfo || !Array.isArray(topicInfo.topicName)) return 'Memuat...';
        // Cari nama topik sesuai bahasa i18n
        const currentTranslation = topicInfo.topicName.find(t => t.lang === i18n.language);
        if (currentTranslation) return currentTranslation.value;
        // Fallback ke bahasa Indonesia atau nama pertama jika tidak ada
        const fallback = topicInfo.topicName.find(t => t.lang === 'id') || topicInfo.topicName[0];
        return fallback ? fallback.value : 'Judul Topik';
    };

    // Filter dan sort entri/kosakata menggunakan fungsi intelligentSort
    const filteredAndSortedEntries = entries
        .filter(entry => { // Filter berdasarkan searchTerm
            const vocab = findVocab(entry, i18n.language); // Cari vocab sesuai bahasa UI
            // Pastikan vocab ada sebelum mengakses properti vocab
            return vocab && vocab.vocab && vocab.vocab.toLowerCase().includes(searchTerm.toLowerCase());
        })
        .sort((a, b) => { // Sort menggunakan intelligentSort atau fallback alphabetical
            const vocabAObj = findVocab(a, i18n.language);
            const vocabBObj = findVocab(b, i18n.language);
            const vocabA = vocabAObj ? vocabAObj.vocab || '' : '';
            const vocabB = vocabBObj ? vocabBObj.vocab || '' : '';

            // Deteksi apakah ini topik angka berdasarkan sample entries
            const isNumericTopic = isNumberTopic(entries, 5, i18n.language);
            
            if (isNumericTopic) {
                // Untuk topik angka, prioritaskan sorting numerik
                const numA = extractNumericValue(vocabA);
                const numB = extractNumericValue(vocabB);
                
                // Jika keduanya angka, bandingkan nilai numeriknya
                if (numA !== null && numB !== null) {
                    return sortOrder === 'asc' ? numA - numB : numB - numA;
                }
                // Jika hanya A angka, A di depan (asc) atau belakang (desc)
                if (numA !== null && numB === null) {
                    return sortOrder === 'asc' ? -1 : 1;
                }
                 // Jika hanya B angka, B di depan (asc) atau belakang (desc)
                if (numA === null && numB !== null) {
                    return sortOrder === 'asc' ? 1 : -1;
                }
                // Jika keduanya bukan angka (dalam topik angka), fallback ke alphabetical
            }
            
            // Fallback ke alphabetical sorting untuk topik non-angka atau vocab non-angka
            const result = vocabA.toLowerCase().localeCompare(vocabB.toLowerCase());
            return sortOrder === 'asc' ? result : -result;
        });


    // Logika pagination
    const totalPages = Math.ceil(filteredAndSortedEntries.length / ENTRIES_PER_PAGE);
    const indexOfLastItem = currentPage * ENTRIES_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ENTRIES_PER_PAGE;
    // Ambil data untuk halaman saat ini (relevan di mobile/tablet)
    const paginatedEntries = filteredAndSortedEntries.slice(indexOfFirstItem, indexOfLastItem);
    
    // Handler ganti halaman pagination
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
        // Scroll ke atas halaman (lebih tepatnya, ke elemen dengan ref pageTopRef)
        if (pageTopRef.current) {
            // Cari parent terdekat yang bisa di-scroll
            const scrollableContainer = pageTopRef.current.closest('.stable-scrollbar'); 
            if (scrollableContainer) {
                // Lakukan scroll smooth ke atas
                scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' }); 
            }
        }
    };

    // Handler saat kartu kosakata diklik
    const handleCardClick = (entry) => {
        // Jangan proses jika sedang transisi audio
        if (isClosing || isOpening) return; 
        
        // Hentikan audio sebelumnya jika ada
        if (isAudioPlaying) {
            stopCurrentAudio();
        }
        
        setActiveEntry(entry); // Set entri ini sebagai aktif (untuk detail panel & highlight)
        
        // Ambil URL audio sesuai bahasa UI
        const audioUrlObj = findVocab(entry, i18n.language); 
        const audioUrl = audioUrlObj?.audioUrl; // Ambil path audio

        // Jangan putar jika tidak ada URL audio yang valid
        if (!audioUrl || audioUrl.endsWith('#')) {
             console.warn("Audio tidak tersedia untuk bahasa ini:", i18n.language, entry);
             return;
        }

        // Buat objek Audio baru
        const audio = new Audio(getImageUrl(audioUrl)); // Gunakan helper getImageUrl
        audioRef.current = audio; // Simpan referensinya
        setIsAudioPlaying(true); // Set status playing

        let playCount = 0; // Counter untuk memutar 2x
        // Handler saat audio selesai
        const handleAudioEnd = () => {
            playCount++;
            if (playCount < 2) { // Jika belum 2x
                audio.currentTime = 0; // Reset waktu
                audio.play().catch(error => { // Putar lagi, tangani error
                    console.error("Error replaying audio:", error);
                    setIsAudioPlaying(false);
                    audio.removeEventListener('ended', handleAudioEnd); // Cleanup
                    audioRef.current = null;
                });
            } else { // Jika sudah 2x
                setIsAudioPlaying(false); // Selesai
                audio.removeEventListener('ended', handleAudioEnd); // Cleanup
                audioRef.current = null;
            }
        };

        // Handler jika audio error
        const handleAudioError = (e) => {
            console.error("Error loading/playing audio:", audioUrl, e);
            setIsAudioPlaying(false); // Set status not playing
            // Cleanup
            audio.removeEventListener('ended', handleAudioEnd);
            audio.removeEventListener('error', handleAudioError);
            audioRef.current = null;
        };

        // Tambahkan listeners
        audio.addEventListener('ended', handleAudioEnd);
        audio.addEventListener('error', handleAudioError);
        
        // Mulai putar audio, tangani error saat play()
        audio.play().catch(error => {
            console.error("Error starting audio play:", error);
            handleAudioError(error); // Panggil handler error
        });
    };

    // Tentukan data yang akan di-render di grid: semua di desktop, paginasi di non-desktop
    const entriesToDisplay = isDesktop ? filteredAndSortedEntries : paginatedEntries;

    // Cek apakah tombol Kuis harus dinonaktifkan (kosakata < 5)
    const isQuizDisabled = !entries || entries.length < 5;

    // Tampilkan loading indicator jika masih loading data
    if (isLoading) {
        return <LoadingIndicator />;
    }

    // Jika topik tidak ditemukan (404), render komponen NotFoundPage
    if (isTopicNotFound) {
        return <NotFoundPage />;
    }

    // Komponen Internal: Panel Detail Kosakata (hanya untuk Desktop)
    const DetailPanel = () => {
        const languageOrder = ['id', 'su', 'en']; // Urutan tampilan bahasa
        const mainLang = i18n.language; // Bahasa utama (sesuai UI)
        const otherLangs = languageOrder.filter(lang => lang !== mainLang); // Bahasa lainnya

        return (
            <div ref={activeCardRef}> {/* Ref panel detail */}
                {/* Kontainer Gambar */}
                <div className="bg-background-secondary rounded-2xl shadow-inner overflow-hidden">
                    {/* Paksa rasio 1:1 untuk gambar */}
                    <div className="aspect-square">
                        {activeEntry ? ( // Jika ada entri aktif
                            // Animasi fade saat gambar berganti
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={activeEntry._id} // Key agar animasi berjalan
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    src={getImageUrl(activeEntry.entryImagePath)} // URL gambar
                                    alt="Gambar kosakata" 
                                    className="w-full h-full object-cover" // Styling gambar
                                    // Fallback jika gambar gagal dimuat
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/e2e8f0/4a5568?text=?' }}
                                />
                            </AnimatePresence>
                        ) : ( // Jika belum ada entri aktif
                            <div className="flex items-center justify-center text-text-secondary h-full">Pilih kosakata</div>
                        )}
                    </div>
                </div>
                {/* Tampilkan Teks Kosakata (jika ada entri aktif) */}
                {activeEntry && (
                    <div className="mt-4 text-center bg-background-secondary p-4 rounded-2xl shadow-md">
                        {/* Animasi saat teks berganti */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeEntry._id} // Key agar animasi berjalan
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {/* Teks bahasa utama (lebih besar) */}
                                <p className="text-2xl font-bold text-text">{findVocab(activeEntry, mainLang)?.vocab || '-'}</p>
                                {/* Teks bahasa lainnya (lebih kecil) */}
                                {otherLangs.map(lang => (
                                    <p key={lang} className="text-lg text-text-secondary">{findVocab(activeEntry, lang)?.vocab || '-'}</p>
                                ))}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                )}
            </div>
        );
    };

    // Render Halaman Kosakata
    return (
        <>
            {/* Modal progress audio opening */}
            <AudioProgressModal isOpen={isOpening} message="Masuk ke topik..." imageUrl={"/assets/images/char/char-smile.png"} />
            {/* Modal progress audio closing */}
            <AudioProgressModal isOpen={isClosing} message="Kembali ke beranda..." imageUrl={"/assets/images/char/char-smile-wave.png"} />
            
            {/* Wrapper utama dengan animasi transisi halaman */}
            <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                ref={pageTopRef} // Ref untuk scroll ke atas
            >
                {/* Header Halaman (Sticky) */}
                <div className="sticky top-[var(--navbar-height)] z-30 bg-background shadow-sm border-b border-gray-200 dark:border-gray-700/50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {/* Konten Header */}
                        <div className="flex flex-col gap-6 py-6">
                            {/* Baris 1: Judul dan Tombol Aksi */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                {/* Judul halaman & jumlah kunjungan */}
                                <PageHeader 
                                    title={getTranslatedTopicName()}
                                    visitCount={topicInfo?.visitCount}
                                />
                                {/* Tombol Aksi (Kuis & Kembali) */}
                                <div className='flex items-center gap-4 w-full sm:w-auto'>
                                    {/* Tombol Kuis (Link) */}
                                    <Link 
                                        to={isQuizDisabled ? '#' : `/quiz/${topicId}`} // Nonaktifkan jika kosakata < 5
                                        state={{ fromQuiz: false }} // Set state untuk halaman kuis
                                        onClick={(e) => { // Handler klik
                                            if (isQuizDisabled || isClosing || isOpening) e.preventDefault(); // Cegah navigasi jika disable/transisi
                                            else stopCurrentAudio(); // Hentikan audio sebelum ke kuis
                                        }}
                                        className={`flex-1 text-center font-bold px-4 py-2 rounded-lg text-sm transition-opacity ${
                                            isQuizDisabled || isOpening ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:opacity-90'
                                        }`} // Styling (termasuk disabled)
                                        title={isQuizDisabled ? "Kuis butuh min 5 kosakata" : isOpening ? "Menunggu..." : "Mulai Kuis"} // Tooltip
                                    >
                                        {t('quizButton')} {/* Teks dari i18n */}
                                    </Link>
                                    {/* Tombol Kembali */}
                                    <button 
                                        onClick={handleBackClick} // Handler klik kembali
                                        disabled={isOpening || isClosing} // Disable saat transisi
                                        className={`flex-1 items-center justify-center gap-2 font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap flex transition-opacity ${
                                            isOpening || isClosing ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-background-secondary text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
                                        }`} // Styling (termasuk disabled)
                                    >
                                        <span>←</span>
                                        <span>{isOpening ? "Menunggu..." : t("backButton")}</span> {/* Teks tombol */}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Baris 2: Search dan Sort */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:justify-end"> {/* Justify end on sm+ */}
                                {/* Input Search */}
                                <div className="relative w-full sm:max-w-xs">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                                    <input
                                        type="text"
                                        placeholder="Cari kosakata..."
                                        value={searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setCurrentPage(1); // Reset halaman saat search
                                        }}
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all duration-200"
                                    />
                                </div>
                                {/* Tombol Sort */}
                                <button 
                                    onClick={toggleSortOrder}
                                    className="bg-gray-500/10 text-text-secondary font-bold px-4 py-2.5 rounded-lg flex items-center gap-2 hover:bg-gray-500/20 transition-colors flex-shrink-0 text-sm w-full sm:w-auto justify-center sm:justify-start"
                                    title={`Urut ${sortOrder === 'asc' ? 'A-Z/1-9' : 'Z-A/9-1'}`}
                                >
                                    {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                                    <span>{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Konten Utama (Grid Layout) */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-8">
                    {/* Tampilkan error jika ada */}
                    {error && <p className="text-center text-red-500">{error}</p>}

                    {/* Tampilkan pesan jika topik kosong */}
                    {!error && !isLoading && entries.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-xl text-gray-500">Kosakata belum tersedia, ditunggu yah {'>'}.{'<'}</p>
                        </div>
                    )}
                    
                    {/* Tampilkan grid jika ada entri dan tidak error */}
                    {!error && entries.length > 0 && (
                        // Layout grid untuk desktop: 1 kolom detail + 2 kolom kosakata
                        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                            {/* Kolom Detail (hanya di desktop) */}
                            {isDesktop && (
                                <div className="lg:col-span-1">
                                    {/* Buat panel detail sticky */}
                                    <div className="lg:sticky lg:top-[calc(var(--navbar-height)+210px)] z-10"> {/* Adjusted top offset */}
                                        <DetailPanel />
                                    </div>
                                </div>
                            )}
                            
                            {/* Kolom Grid Kosakata */}
                            <div className={isDesktop ? "lg:col-span-2" : "w-full"}> {/* Lebar kolom */}
                                {entriesToDisplay.length > 0 ? ( // Jika ada entri untuk ditampilkan (setelah filter/search)
                                    // Animasi saat ganti halaman
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={currentPage} // Key animasi
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            // Grid responsif untuk kartu
                                            className="grid grid-cols-2 sm:grid-cols-3 gap-4" 
                                        >
                                            {/* Mapping data kosakata */}
                                            {entriesToDisplay.map((entry) => {
                                                const currentVocab = findVocab(entry, i18n.language); // Ambil vocab sesuai bahasa
                                                if (!currentVocab) return null; // Lewati jika tidak ada

                                                return (
                                                    // Animasi kartu individual
                                                    <motion.div key={entry._id} variants={cardVariants}>
                                                        {/* Komponen Kartu Kosakata */}
                                                        <KosakataCard 
                                                            content={currentVocab.vocab} // Teks
                                                            imageUrl={getImageUrl(entry.entryImagePath)} // Gambar
                                                            // Status untuk highlight
                                                            isActive={activeEntry && activeEntry._id === entry._id}
                                                            isPlaying={isAudioPlaying && activeEntry?._id === entry._id}
                                                            isAnyAudioPlaying={isAudioPlaying} // Untuk disable
                                                            onCardClick={() => handleCardClick(entry)} // Handler klik
                                                        />
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                ) : ( // Jika hasil filter/search kosong
                                    <div className="text-center py-20">
                                        <p className="text-xl text-gray-500">Kosakata yang Anda cari tidak ditemukan.</p>
                                    </div>
                                )}
                                {/* Pagination (hanya di non-desktop) */}
                                {!isDesktop && filteredAndSortedEntries.length > ENTRIES_PER_PAGE && ( // Only show pagination if more than one page
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