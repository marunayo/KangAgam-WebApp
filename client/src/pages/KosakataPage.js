import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'; // Hook routing
import { useTranslation } from 'react-i18next'; // Hook i18n
import { motion, AnimatePresence } from 'framer-motion'; // Animasi
import { getEntriesByTopicId } from '../services/entryService'; // API ambil kosakata
import { getTopicById } from '../services/topicService'; // API ambil info topik
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Komponen loading
import PageHeader from '../components/ui/PageHeader'; // Komponen header halaman
import AudioProgressModal from '../components/ui/AudioProgressModal'; // Import kembali modal audio
import NotFoundPage from '../components/NotFoundPage'; // Import kembali NotFoundPage
import KosakataCard from '../components/ui/KosakataCard'; // Import komponen KosakataCard

// ====================================================================
// IMAGE URL HELPER FUNCTION
// ====================================================================
/**
 * Helper function untuk mendapatkan URL gambar yang benar,
 * baik dari backend maupun aset lokal.
 * @param {string} imagePath - Path gambar.
 * @returns {string} URL gambar yang lengkap.
 */
const getImageUrl = (imagePath) => {
    if (!imagePath) return '';

    // Jika sudah URL lengkap, kembalikan langsung
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }

    // Jika path dimulai dengan /assets, anggap sebagai aset lokal
    if (imagePath.startsWith('/assets')) {
        return imagePath; // Kembalikan path relatif apa adanya
    }

    // Jika tidak, anggap dari backend
    const cleanPath = imagePath.replace(/\\/g, '/'); // Bersihkan backslash jika ada
    const baseUrl = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'; // Ambil base URL API
    // Gabungkan base URL dengan path gambar
    return `${baseUrl}${cleanPath.startsWith('/') ? '' : '/'}${cleanPath}`;
};


// ====================================================================
// KOMPONEN IKON & POPUP FEEDBACK
// ====================================================================

// Ikon centang (untuk jawaban benar)
const CheckIcon = () => ( 
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
);

// Ikon tanda seru (untuk jawaban salah)
const ExclamationIcon = () => ( 
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
);

/**
 * Komponen popup yang menampilkan feedback visual (benar/salah) setelah menjawab.
 * @param {boolean} isOpen - Apakah popup ditampilkan.
 * @param {string} type - 'correct' atau 'incorrect'.
 * @param {string} imageUrl - URL gambar karakter (happy/sad).
 */
export const QuizFeedbackPopup = ({ isOpen, type, imageUrl }) => {
    // Konfigurasi tampilan untuk setiap tipe feedback
    const content = {
        correct: { 
            icon: <CheckIcon />, 
            text: "Hebat!", 
            bgColor: "bg-green-100 dark:bg-green-900/30",
            borderColor: "border-green-300 dark:border-green-700",
            textColor: "text-green-800 dark:text-green-100",
            defaultImage: "/assets/images/char/char-happy.png" // Fallback jika imageUrl null
        },
        incorrect: { 
            icon: <ExclamationIcon />, 
            text: "Coba lagi, ya!", 
            bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
            borderColor: "border-yellow-300 dark:border-yellow-700", 
            textColor: "text-yellow-800 dark:text-yellow-100",
            defaultImage: "/assets/images/char/char-sad.png" // Fallback jika imageUrl null
        },
    };
    // Pilih konfigurasi berdasarkan prop 'type'
    const selectedContent = content[type] || content.correct;

    return (
        <AnimatePresence> {/* Animasi muncul/hilang */}
            {isOpen && ( // Hanya render jika isOpen true
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" // Overlay
                >
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.5, opacity: 0 }} 
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }} // Animasi spring
                        className={`p-8 rounded-2xl flex flex-col items-center gap-4 border-2 backdrop-blur-sm shadow-2xl max-w-sm w-full ${selectedContent.bgColor} ${selectedContent.borderColor} ${selectedContent.textColor}`} // Styling modal
                    >
                        {/* Ikon feedback */}
                        <div className={`${selectedContent.textColor}`}>
                            {selectedContent.icon}
                        </div>
                        {/* Teks feedback */}
                        <p className={`text-2xl font-bold ${selectedContent.textColor}`}>
                            {selectedContent.text}
                        </p>
                        {/* Gambar karakter */}
                        <div className="w-full flex justify-center mt-2">
                            <img 
                                src={imageUrl || selectedContent.defaultImage} // Gunakan imageUrl prop atau fallback
                                alt={type === 'correct' ? 'Jawaban Benar' : 'Jawaban Salah'}
                                className="w-48 h-48 object-cover rounded-xl"
                                // Fallback jika gambar utama gagal dimuat
                                onError={(e) => { e.target.onerror = null; e.target.src=selectedContent.defaultImage }}
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// ====================================================================
// SMART SORTING FUNCTIONS (Simplified for KosakataPage)
// ====================================================================

// Core number words untuk deteksi (minimal mapping) - Tetap dibutuhkan
const coreNumbers = {
    // Indonesia
    'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
    'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
    
    // Sunda  
    'hiji': 1, 'tilu': 3, 'opat': 4, 'genep': 6, 'dalapan': 8, 'salapan': 9, 'sapuluh': 10,
    
    // English
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

/**
 * Fungsi untuk mendeteksi dan mengekstrak nilai numerik dari string.
 * Versi ini lebih sederhana, hanya cek direct mapping dan digit.
 * @param {string} str - String kosakata.
 * @returns {number | null} Nilai numerik atau null.
 */
const extractNumericValue = (str) => {
    if (!str || typeof str !== 'string') return null;
    
    const cleanStr = str.toLowerCase().trim();
    
    // Cek direct mapping
    if (coreNumbers[cleanStr] !== undefined) {
        return coreNumbers[cleanStr];
    }
    
    // Cek digit angka
    if (/^\d+$/.test(cleanStr)) {
        return parseInt(cleanStr);
    }
    
    // Tambahkan deteksi simple teens jika diperlukan (misal 'belas')
    if (cleanStr.endsWith('belas')) {
        const baseWord = cleanStr.replace('belas', '').trim();
        if (baseWord === 'se') return 11;
        if (coreNumbers[baseWord] && coreNumbers[baseWord] >= 2 && coreNumbers[baseWord] <= 9) {
            return 10 + coreNumbers[baseWord];
        }
    }
    // Tambahkan deteksi simple teens english
    const englishTeens = {
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19
    };
     if (englishTeens[cleanStr]) {
        return englishTeens[cleanStr];
    }
    
    return null;
};

// Hapus fungsi parseIndonesianNumber
// const parseIndonesianNumber = (str) => { ... };

// Hapus fungsi parseEnglishNumber
// const parseEnglishNumber = (str) => { ... };


/**
 * Mendeteksi apakah mayoritas kosakata dalam sampel adalah angka.
 * @param {Array} entries - Daftar entri kosakata.
 * @param {number} sampleSize - Ukuran sampel untuk deteksi.
 * @param {string} language - Kode bahasa target.
 * @returns {boolean} True jika mayoritas angka, false jika tidak.
 */
const isNumberTopic = (entries, sampleSize = 5, language = 'id') => {
    if (!entries || entries.length === 0) return false;
    
    const sample = entries.slice(0, Math.min(sampleSize, entries.length));
    const numberCount = sample.filter(entry => {
        // Gunakan findVocab untuk mendapatkan objek vocab yang benar
        const vocabObj = findVocab(entry, language); 
        return vocabObj && extractNumericValue(vocabObj.vocab) !== null;
    }).length;
    
    // Jika lebih dari 70% sampel adalah angka, anggap sebagai topik angka
    return sample.length > 0 && (numberCount / sample.length) > 0.7;
};


/**
 * Fungsi helper untuk mencari objek kosakata berdasarkan kode bahasa.
 * @param {object} entry - Objek entri kosakata.
 * @param {string} lang - Kode bahasa ('id', 'su', 'en').
 * @returns {object | null} Objek kosakata atau null.
 */
const findVocab = (entry, lang) => entry?.entryVocabularies?.find(v => v.language.languageCode === lang) || entry?.entryVocabularies?.[0];

// ====================================================================
// COMPONENT HOOKS & ICONS
// ====================================================================

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

// Varian animasi (tetap sama)
const pageVariants = { initial: { opacity: 0, y: 20 }, in: { opacity: 1, y: 0 }, out: { opacity: 0, y: -20 }, };
const pageTransition = { type: 'tween', ease: 'anticipate', duration: 0.5, };
const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05, }, }, };
const cardVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, }, }, };

// Komponen ikon internal (tetap sama)
const SearchIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"> <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> </svg> );
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>;

// Konstanta jumlah entri per halaman (untuk mobile/tablet)
const ENTRIES_PER_PAGE = 12;

// ====================================================================
// KOMPONEN UTAMA HALAMAN KOSAKATA
// ====================================================================
const KosakataPage = () => {
    // Hooks
    const { topicId } = useParams(); // Ambil ID topik dari URL
    const { t, i18n } = useTranslation(); // Hook i18n
    const navigate = useNavigate(); // Hook navigasi
    const location = useLocation(); // Hook lokasi (untuk state fromQuiz)
    const isDesktop = useMediaQuery('(min-width: 1024px)'); // Cek ukuran layar
    const pageTopRef = useRef(null); // Ref untuk scroll ke atas
    const activeCardRef = useRef(null); // Ref untuk panel detail (tidak dipakai saat ini)
    const audioRef = useRef(null); // Ref untuk objek audio kosakata

    // State data
    const [topicInfo, setTopicInfo] = useState(null); // Info topik (nama, dll)
    const [entries, setEntries] = useState([]); // Daftar kosakata
    
    // State UI & Loading
    const [isLoading, setIsLoading] = useState(true); // Status loading data
    const [error, setError] = useState(null); // Pesan error fetch data
    const [activeEntry, setActiveEntry] = useState(null); // Kosakata yang aktif (ditampilkan di detail)
    const [searchTerm, setSearchTerm] = useState(''); // Kata kunci pencarian
    const [sortOrder, setSortOrder] = useState('asc'); // Urutan sorting ('asc' atau 'desc')
    const [currentPage, setCurrentPage] = useState(1); // Halaman pagination saat ini
    const [isAudioPlaying, setIsAudioPlaying] = useState(false); // Status pemutaran audio kosakata
    const [isClosing, setIsClosing] = useState(false); // Status saat audio closing diputar
    const [isOpening, setIsOpening] = useState(false); // Status saat audio opening diputar
    const [isTopicNotFound, setIsTopicNotFound] = useState(false); // Status jika topik 404

    /**
     * Menghentikan audio yang sedang diputar (kosakata, opening, closing).
     * Dibungkus useCallback agar referensi stabil.
     */
    const stopCurrentAudio = useCallback(() => {
        if (audioRef.current) { // Hentikan audio kosakata
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            // Hapus listener agar tidak ada memory leak
            audioRef.current.removeEventListener('ended', () => {}); 
            audioRef.current.removeEventListener('error', () => {}); 
            audioRef.current = null;
        }
        setIsAudioPlaying(false); // Set status audio kosakata tidak playing
        // Tambahkan logic untuk menghentikan audio opening/closing jika diperlukan
        // (saat ini audio opening/closing tidak disimpan di ref khusus,
        // jadi hanya bisa dihentikan jika navigasi/unmount)
        setIsOpening(false); // Set status opening false
        setIsClosing(false); // Set status closing false
    }, []);

    // Efek cleanup: Hentikan semua audio saat komponen unmount
    useEffect(() => {
        return () => {
            stopCurrentAudio(); // Panggil fungsi stop saat unmount
        };
    }, [stopCurrentAudio]); // Dependensi

    // Efek: Hentikan audio jika tab tidak aktif atau halaman direfresh/ditutup
    useEffect(() => {
        const handleBeforeUnload = () => stopCurrentAudio(); // Handler refresh/close
        const handleVisibilityChange = () => { // Handler ganti tab
            if (document.hidden) {
                stopCurrentAudio();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup listener saat unmount
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [stopCurrentAudio]); // Dependensi

    // Efek: Putar audio opening saat masuk ke halaman (kecuali dari quiz)
    useEffect(() => {
        // Jangan putar jika kembali dari halaman kuis
        if (location.state?.fromQuiz) return; 

        // Fungsi async untuk memutar audio opening
        const playOpeningAudio = async () => {
            setIsOpening(true); // Set status opening
            const openingAudioPath = '/assets/audio/system/opening.wav';
            const audio = new Audio(openingAudioPath);
            audioRef.current = audio; // Simpan referensi (opsional, bisa bentrok dengan audio kosakata)

            // Promise untuk menunggu audio selesai atau error
            const audioPromise = new Promise((resolve) => {
                audio.addEventListener('ended', resolve, { once: true });
                audio.addEventListener('error', (e) => {
                    console.error("Gagal memutar audio opening:", e);
                    resolve(); // Tetap resolve meski error
                }, { once: true });
            });

            try {
                await audio.play(); // Coba putar audio
                await audioPromise; // Tunggu selesai atau error
            } catch (error) {
                console.error("Gagal memulai audio opening:", error);
            } finally {
                setIsOpening(false); // Set status opening selesai
                // Hapus referensi jika disimpan
                if (audioRef.current === audio) {
                    audioRef.current = null; 
                }
            }
        };

        // Delay sedikit sebelum memutar audio
        const timer = setTimeout(playOpeningAudio, 100); 
        return () => clearTimeout(timer); // Cleanup timeout jika unmount sebelum audio mulai

    }, [location.state]); // Jalankan ulang jika state lokasi berubah

    // Efek: Fetch data topik dan kosakata saat komponen dimuat atau topicId berubah
    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true); // Mulai loading
                setError(null); // Reset error
                setIsTopicNotFound(false); // Reset status 404
                
                // Tambahkan delay minimal untuk efek loading
                const minDelay = new Promise(resolve => setTimeout(resolve, 500)); 
                
                // Fetch data topik dan kosakata secara paralel
                const [topicData, entriesData] = await Promise.all([
                    getTopicById(topicId),
                    getEntriesByTopicId(topicId),
                    minDelay
                ]);

                setTopicInfo(topicData.topic); // Simpan info topik
                setEntries(entriesData.entries || []); // Simpan daftar kosakata

                // Set kosakata pertama sebagai aktif jika ada
                if (entriesData.entries && entriesData.entries.length > 0) {
                    setActiveEntry(entriesData.entries[0]);
                }
                
            } catch (err) { // Tangani error fetch data
                console.error('Error fetching data:', err);
                
                // Cek status error dari response
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

    /**
     * Mengubah urutan sorting (asc/desc) dan reset ke halaman pertama.
     */
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1); 
    };

    /**
     * Handler untuk tombol kembali. Memutar audio closing lalu navigasi.
     * @param {React.MouseEvent<HTMLButtonElement>} e - Event klik tombol.
     */
    const handleBackClick = async (e) => {
        e.preventDefault(); // Mencegah default action (jika ini link)
        // Cegah klik ganda jika sedang opening/closing
        if (isClosing || isOpening) return;

        stopCurrentAudio(); // Hentikan audio kosakata yang mungkin sedang berjalan
        setIsClosing(true); // Set status closing

        // Pilih audio closing secara acak
        const closingSounds = [
            '/assets/audio/system/closing-1.wav',
            '/assets/audio/system/closing-2.wav',
        ];
        const randomSoundPath = closingSounds[Math.floor(Math.random() * closingSounds.length)];
        const audio = new Audio(randomSoundPath);
        // Tidak simpan di audioRef agar tidak bentrok jika user klik kosakata lagi

        // Promise untuk menunggu audio selesai atau error
        const audioPromise = new Promise((resolve) => {
            audio.addEventListener('ended', resolve, { once: true });
            audio.addEventListener('error', (e) => {
                console.error("Gagal memutar audio closing:", e);
                resolve(); // Tetap resolve meski error
            }, { once: true });
        });

        try {
            await audio.play(); // Coba putar audio
            await audioPromise; // Tunggu selesai atau error
        } catch (error) {
            console.error("Gagal memulai audio closing:", error);
        } finally {
            setIsClosing(false); // Set status closing selesai
            navigate('/home'); // Navigasi ke halaman home
        }
    };

    /**
     * Mendapatkan nama topik yang sudah diterjemahkan sesuai bahasa UI.
     * @returns {string} Nama topik terjemahan atau fallback.
     */
    const getTranslatedTopicName = () => {
        if (!topicInfo || !Array.isArray(topicInfo.topicName)) return 'Memuat...';
        // Cari terjemahan sesuai bahasa UI
        const currentTranslation = topicInfo.topicName.find(t => t.lang === i18n.language);
        if (currentTranslation) return currentTranslation.value;
        // Jika tidak ada, gunakan bahasa Indonesia atau nama pertama sebagai fallback
        const fallback = topicInfo.topicName.find(t => t.lang === 'id') || topicInfo.topicName[0];
        return fallback ? fallback.value : 'Judul Topik';
    };

    // Filter dan sort kosakata berdasarkan search term dan sort order
    const filteredAndSortedEntries = entries
        .filter(entry => { // Filter berdasarkan search term (cek di semua bahasa)
            const searchLower = searchTerm.toLowerCase();
            const vocabId = findVocab(entry, 'id')?.vocab?.toLowerCase() || '';
            const vocabSu = findVocab(entry, 'su')?.vocab?.toLowerCase() || '';
            const vocabEn = findVocab(entry, 'en')?.vocab?.toLowerCase() || '';
            return vocabId.includes(searchLower) || vocabSu.includes(searchLower) || vocabEn.includes(searchLower);
        })
        .sort((a, b) => { // Sortir hasil filter
            // Ambil kosakata sesuai bahasa UI untuk sorting
            const vocabA = findVocab(a, i18n.language)?.vocab || '';
            const vocabB = findVocab(b, i18n.language)?.vocab || '';
            
            // Deteksi apakah ini topik angka
            const isNumericTopic = isNumberTopic(entries, 5, i18n.language);
            
            if (isNumericTopic) { // Jika topik angka
                const numA = extractNumericValue(vocabA); // Ekstrak nilai numerik A
                const numB = extractNumericValue(vocabB); // Ekstrak nilai numerik B
                
                // Jika keduanya angka, bandingkan secara numerik
                if (numA !== null && numB !== null) {
                    return sortOrder === 'asc' ? numA - numB : numB - numA;
                }
                // Jika hanya A angka, A lebih dulu (asc) atau B lebih dulu (desc)
                if (numA !== null && numB === null) return sortOrder === 'asc' ? -1 : 1;
                // Jika hanya B angka, B lebih dulu (asc) atau A lebih dulu (desc)
                if (numA === null && numB !== null) return sortOrder === 'asc' ? 1 : -1;
            }
            
            // Jika bukan topik angka atau keduanya bukan angka, bandingkan secara alfabetis
            const result = vocabA.toLowerCase().localeCompare(vocabB.toLowerCase());
            return sortOrder === 'asc' ? result : -result; // Balik urutan jika desc
        });

    // Hitung total halaman untuk pagination
    const totalPages = Math.ceil(filteredAndSortedEntries.length / ENTRIES_PER_PAGE);
    // Hitung index item pertama dan terakhir untuk halaman saat ini
    const indexOfLastItem = currentPage * ENTRIES_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ENTRIES_PER_PAGE;
    // Ambil item untuk halaman saat ini (hanya untuk mobile/tablet)
    const paginatedEntries = filteredAndSortedEntries.slice(indexOfFirstItem, indexOfLastItem);
    
    /**
     * Handler untuk mengganti halaman pagination dan scroll ke atas.
     * @param {number} pageNumber - Nomor halaman tujuan.
     */
    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber); // Update state halaman
        // Scroll ke atas (ke elemen dengan ref pageTopRef)
        if (pageTopRef.current) {
            // Cari kontainer scrollable terdekat
            const scrollableContainer = pageTopRef.current.closest('.overflow-y-auto'); 
            if (scrollableContainer) {
                // Scroll ke atas dengan smooth
                scrollableContainer.scrollTo({ top: 0, behavior: 'smooth' }); 
            }
        }
    };

    /**
     * Handler saat kartu kosakata diklik.
     * Menghentikan audio sebelumnya, set kosakata aktif, dan putar audio baru (2x).
     * @param {object} entry - Objek entri kosakata yang diklik.
     */
    const handleCardClick = (entry) => {
        // Cegah interaksi jika audio opening/closing sedang berjalan
        if (isClosing || isOpening) return;
        
        // Hentikan audio yang sedang berjalan jika ada
        if (isAudioPlaying) {
            stopCurrentAudio();
        }
        
        // Set entri yang diklik sebagai aktif
        setActiveEntry(entry);
        
        // Cari URL audio sesuai bahasa UI
        const audioUrl = findVocab(entry, i18n.language)?.audioUrl;
        // Jangan lakukan apa-apa jika tidak ada URL audio
        if (!audioUrl || audioUrl.endsWith('#')) return;

        // Buat objek Audio baru
        const audio = new Audio(getImageUrl(audioUrl)); // Gunakan helper getImageUrl
        audioRef.current = audio; // Simpan referensi
        setIsAudioPlaying(true); // Set status audio playing

        let playCount = 0; // Counter untuk memutar 2x
        // Handler saat audio selesai diputar
        const handleAudioEnd = () => {
            playCount++;
            if (playCount < 2) { // Jika belum 2x
                audio.currentTime = 0; // Putar ulang dari awal
                audio.play().catch(error => { // Tangani error saat replay
                    console.error("Error replaying audio:", error);
                    setIsAudioPlaying(false);
                    audio.removeEventListener('ended', handleAudioEnd); // Hapus listener
                    audioRef.current = null;
                });
            } else { // Jika sudah 2x
                setIsAudioPlaying(false); // Set status audio selesai
                audio.removeEventListener('ended', handleAudioEnd); // Hapus listener
                audioRef.current = null; // Hapus referensi
            }
        };

        // Handler jika audio gagal dimuat/diputar
        const handleAudioError = (e) => {
            console.error("Error loading/playing audio:", e, audioUrl);
            setIsAudioPlaying(false); // Set status audio selesai (gagal)
            // Hapus listener
            audio.removeEventListener('ended', handleAudioEnd);
            audio.removeEventListener('error', handleAudioError);
            audioRef.current = null; // Hapus referensi
        };

        // Tambahkan listener
        audio.addEventListener('ended', handleAudioEnd);
        audio.addEventListener('error', handleAudioError);
        
        // Mulai putar audio, tangani error awal
        audio.play().catch(error => {
            console.error("Error starting audio play:", error);
            setIsAudioPlaying(false);
            // Hapus listener jika play() gagal
            audio.removeEventListener('ended', handleAudioEnd);
            audio.removeEventListener('error', handleAudioError);
            audioRef.current = null;
        });
    };

    // Tentukan entri mana yang akan ditampilkan (semua di desktop, paginasi di mobile)
    const entriesToDisplay = isDesktop ? filteredAndSortedEntries : paginatedEntries;

    // Cek apakah tombol kuis harus dinonaktifkan (kurang dari 5 kosakata)
    const isQuizDisabled = !entries || entries.length < 5;

    // ---- RENDER KONDISIONAL ----

    // Tampilkan loading jika data masih diambil
    if (isLoading) {
        return <LoadingIndicator />;
    }

    // Tampilkan halaman 404 jika topik tidak ditemukan
    if (isTopicNotFound) {
        return <NotFoundPage />;
    }

    /**
     * Komponen internal untuk menampilkan panel detail kosakata (hanya di desktop).
     */
    const DetailPanel = () => {
        // Urutan bahasa untuk ditampilkan
        const languageOrder = ['id', 'su', 'en'];
        // Bahasa utama (sesuai UI)
        const mainLang = i18n.language;
        // Bahasa lainnya
        const otherLangs = languageOrder.filter(lang => lang !== mainLang);

        return (
            <div ref={activeCardRef}> {/* Ref untuk potensi scroll ke elemen aktif */}
                {/* Kontainer Gambar */}
                <div className="bg-background-secondary rounded-2xl shadow-inner overflow-hidden">
                    <div className="aspect-square"> {/* Rasio 1:1 */}
                        {activeEntry ? ( // Tampilkan gambar jika ada entri aktif
                            <AnimatePresence mode="wait"> {/* Animasi transisi gambar */}
                                <motion.img
                                    key={activeEntry._id} // Key agar animasi berjalan saat gambar berubah
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    src={getImageUrl(activeEntry.entryImagePath)} // URL gambar
                                    alt="Gambar kosakata" 
                                    className="w-full h-full object-cover" 
                                    // Fallback jika gambar gagal
                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/e2e8f0/4a5568?text=?' }}
                                />
                            </AnimatePresence>
                        ) : ( // Tampilkan placeholder jika tidak ada entri aktif
                            <div className="flex items-center justify-center text-text-secondary h-full">Pilih kosakata</div>
                        )}
                    </div>
                </div>
                {/* Kontainer Teks Kosakata */}
                {activeEntry && ( // Tampilkan teks jika ada entri aktif
                    <div className="mt-4 text-center bg-background-secondary p-4 rounded-2xl shadow-md">
                        <AnimatePresence mode="wait"> {/* Animasi transisi teks */}
                            <motion.div
                                key={activeEntry._id} // Key agar animasi berjalan saat teks berubah
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {/* Teks bahasa utama */}
                                <p className="text-2xl font-bold text-text">{findVocab(activeEntry, mainLang)?.vocab || 'N/A'}</p>
                                {/* Teks bahasa lainnya */}
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

    // ---- RENDER UTAMA HALAMAN ----
    return (
        <>
            {/* Modal Audio Opening */}
            <AudioProgressModal isOpen={isOpening} message="Bersiap..." imageUrl={"/assets/images/char/char-smile.png"} />
            {/* Modal Audio Closing */}
            <AudioProgressModal isOpen={isClosing} message="Sampai jumpa!" imageUrl={"/assets/images/char/char-smile-wave.png"} />
            
            {/* Kontainer Utama Halaman dengan Animasi */}
            <motion.div
                initial="initial"
                animate="in"
                exit="out"
                variants={pageVariants}
                transition={pageTransition}
                ref={pageTopRef} // Ref untuk scroll ke atas
                className="flex flex-col min-h-full" // Layout flex column
            >
                {/* Header Sticky */}
                <div className="sticky top-[var(--navbar-height)] z-20 bg-background shadow-sm border-b border-gray-200 dark:border-gray-700/50"> {/* Sesuaikan top dengan tinggi navbar */}
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col gap-6 py-6">
                            {/* Baris Judul & Tombol Aksi */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <PageHeader 
                                    title={getTranslatedTopicName()} // Judul topik terjemahan
                                    visitCount={topicInfo?.visitCount} // Jumlah kunjungan (opsional)
                                />
                                {/* Tombol Kuis & Kembali */}
                                <div className='flex items-center gap-4 w-full sm:w-auto'>
                                    <Link 
                                        to={isQuizDisabled ? '#' : `/quiz/${topicId}`} // Link ke kuis (disable jika perlu)
                                        state={{ fromQuiz: false }} // Reset state fromQuiz
                                        onClick={(e) => { // Handler klik
                                            if (isQuizDisabled || isClosing || isOpening) e.preventDefault(); // Cegah navigasi jika disable/closing/opening
                                            else stopCurrentAudio(); // Hentikan audio jika navigasi
                                        }}
                                        className={`flex-1 text-center font-bold px-4 py-2 rounded-lg text-sm transition-opacity ${ // Styling tombol kuis
                                            isQuizDisabled || isOpening
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' // Style disabled
                                                : 'bg-primary text-white hover:opacity-90' // Style aktif
                                        }`}
                                        title={isQuizDisabled ? "Kuis membutuhkan minimal 5 kosakata" : isOpening ? "Menunggu..." : "Mulai Kuis"} // Tooltip
                                    >
                                        {t('quizButton')} {/* Teks tombol dari i18n */}
                                    </Link>
                                    {/* Tombol Kembali */}
                                    <button 
                                        onClick={handleBackClick} // Handler kembali
                                        disabled={isOpening || isClosing} // Disable jika opening/closing
                                        className={`flex-1 items-center justify-center gap-2 font-bold px-4 py-2 rounded-lg text-sm whitespace-nowrap flex transition-opacity ${ // Styling tombol kembali
                                            isOpening || isClosing 
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed' // Style disabled
                                                : 'bg-background-secondary text-text-secondary hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600' // Style aktif
                                        }`}
                                    >
                                        <span>←</span>
                                        <span>{isOpening ? "Menunggu..." : t("backButton")}</span> {/* Teks tombol */}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Baris Search & Sort */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
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
                                    title={`Urut ${sortOrder === 'asc' ? 'A-Z/1-10' : 'Z-A/10-1'}`} // Update tooltip
                                >
                                    {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                                    {/* Update teks sort */}
                                    <span>{sortOrder === 'asc' ? (isNumberTopic(entries, 5, i18n.language) ? '1-10' : 'A-Z') : (isNumberTopic(entries, 5, i18n.language) ? '10-1' : 'Z-A')}</span> 
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Konten Utama */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 mt-8 flex-grow"> {/* flex-grow agar footer tetap di bawah */}
                    {/* Tampilkan Error jika ada (dan bukan 404) */}
                    {error && <p className="text-center text-red-500">{error}</p>}

                    {/* Tampilkan pesan jika tidak ada kosakata */}
                    {!error && !isLoading && entries.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-xl text-text-secondary">Kosakata belum tersedia, ditunggu yah {'>'}.{'<'}</p>
                        </div>
                    )}
                    
                    {/* Tampilkan grid kosakata jika ada */}
                    {!error && entries.length > 0 && (
                        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
                            {/* Panel Detail (Desktop) */}
                            {isDesktop && (
                                <div className="lg:col-span-1">
                                    <div className="lg:sticky lg:top-[calc(var(--navbar-height)+140px)] z-10"> {/* Sesuaikan top agar pas di bawah header */}
                                        <DetailPanel />
                                    </div>
                                </div>
                            )}
                            
                            {/* Grid Kosakata */}
                            <div className={isDesktop ? "lg:col-span-2" : "w-full"}>
                                {/* Tampilkan jika ada hasil filter */}
                                {entriesToDisplay.length > 0 ? (
                                    <AnimatePresence mode="wait"> {/* Animasi saat ganti halaman */}
                                        <motion.div
                                            key={currentPage} // Key agar animasi berjalan saat ganti halaman
                                            variants={containerVariants}
                                            initial="hidden"
                                            animate="visible"
                                            className="grid grid-cols-2 sm:grid-cols-3 gap-4" // Grid kartu
                                        >
                                            {/* Mapping kartu kosakata */}
                                            {entriesToDisplay.map((entry) => {
                                                const currentVocab = findVocab(entry, i18n.language); // Cari vocab sesuai bahasa
                                                if (!currentVocab) return null; // Skip jika tidak ada vocab

                                                return (
                                                    <motion.div key={entry._id} variants={cardVariants}> {/* Kartu dengan animasi */}
                                                        <KosakataCard 
                                                            content={currentVocab.vocab} // Teks kosakata
                                                            imageUrl={getImageUrl(entry.entryImagePath)} // URL gambar
                                                            isActive={activeEntry && activeEntry._id === entry._id} // Status aktif
                                                            isPlaying={isAudioPlaying && activeEntry?._id === entry._id} // Status audio playing
                                                            isAnyAudioPlaying={isAudioPlaying} // Status ada audio lain playing
                                                            onCardClick={() => handleCardClick(entry)} // Handler klik
                                                        />
                                                    </motion.div>
                                                );
                                            })}
                                        </motion.div>
                                    </AnimatePresence>
                                ) : ( // Tampilkan jika tidak ada hasil filter/search
                                    <div className="text-center py-20">
                                        <p className="text-xl text-text-secondary">Kosakata yang Anda cari tidak ditemukan.</p>
                                    </div>
                                )}
                                {/* Pagination (Mobile/Tablet) */}
                                {!isDesktop && totalPages > 1 && (
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

const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    // Simple, accessible pagination control used on mobile/tablet
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let start = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let end = start + maxPagesToShow - 1;
    if (end > totalPages) {
        end = totalPages;
        start = Math.max(1, end - maxPagesToShow + 1);
    }
    for (let p = start; p <= end; p++) pages.push(p);

    return (
        <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
            <button
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-background-secondary disabled:opacity-50"
                aria-label="Previous page"
            >
                ‹
            </button>

            {start > 1 && (
                <>
                    <button onClick={() => onPageChange(1)} className="px-3 py-1 rounded bg-background-secondary">
                        1
                    </button>
                    {start > 2 && <span className="px-2">…</span>}
                </>
            )}

            {pages.map((p) => (
                <button
                    key={p}
                    onClick={() => onPageChange(p)}
                    aria-current={p === currentPage ? 'page' : undefined}
                    className={`px-3 py-1 rounded ${p === currentPage ? 'bg-primary text-white' : 'bg-background-secondary'}`}
                >
                    {p}
                </button>
            ))}

            {end < totalPages && (
                <>
                    {end < totalPages - 1 && <span className="px-2">…</span>}
                    <button onClick={() => onPageChange(totalPages)} className="px-3 py-1 rounded bg-background-secondary">
                        {totalPages}
                    </button>
                </>
            )}

            <button
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-background-secondary disabled:opacity-50"
                aria-label="Next page"
            >
                ›
            </button>
        </nav>
    );
};

export default KosakataPage;