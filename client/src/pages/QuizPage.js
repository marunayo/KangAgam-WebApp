import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom'; // Hook routing
import { useTranslation } from 'react-i18next'; // Hook i18n
import { motion, AnimatePresence } from 'framer-motion'; // Animasi
import useAudioFeedback from '../hooks/useAudioFeedback'; // Hook audio feedback kuis (benar/salah)
import { getEntriesByTopicId } from '../services/entryService'; // API ambil kosakata
import { getTopicById } from '../services/topicService'; // API ambil info topik
import LoadingIndicator from '../components/ui/LoadingIndicator'; // Komponen loading
import PageHeader from '../components/ui/PageHeader'; // Komponen header halaman

// ====================================================================
// IMAGE URL HELPER FUNCTION (Tambahkan fungsi ini)
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
const QuizFeedbackPopup = ({ isOpen, type, imageUrl }) => {
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
// HELPER FUNCTIONS & VARIAN ANIMASI
// ====================================================================

/**
 * Fungsi helper untuk mengacak urutan elemen dalam array.
 * @param {Array} array - Array yang akan diacak.
 * @returns {Array} Array baru dengan urutan acak.
 */
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);

/**
 * Fungsi helper untuk mencari objek kosakata berdasarkan kode bahasa.
 * @param {object} entry - Objek entri kosakata.
 * @param {string} lang - Kode bahasa ('id', 'su', 'en').
 * @returns {object | null} Objek kosakata atau null.
 */
const findVocab = (entry, lang) => entry?.entryVocabularies?.find(v => v.language.languageCode === lang) || entry?.entryVocabularies?.[0];

// Varian animasi untuk modal hasil kuis
const modalContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const modalItemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

// ====================================================================
// KOMPONEN UTAMA HALAMAN KUIS
// ====================================================================
const QuizPage = () => {
    // State hooks
    const { topicId } = useParams(); // Ambil ID topik dari URL
    const { i18n } = useTranslation(); // Hook i18n untuk bahasa UI
    const navigate = useNavigate(); // Hook navigasi
    const audioRef = useRef(null); // Ref untuk objek audio pertanyaan
    const { playCorrectSound, playIncorrectSound } = useAudioFeedback(); // Hook audio feedback benar/salah
    
    // State Data Kuis
    const [topicName, setTopicName] = useState(''); // Nama topik
    const [allEntries, setAllEntries] = useState([]); // Semua kosakata dalam topik
    const [questions, setQuestions] = useState([]); // Daftar pertanyaan (subset dari allEntries, maks 5)
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Index pertanyaan saat ini
    const [options, setOptions] = useState([]); // Pilihan jawaban untuk pertanyaan saat ini
    
    // State Skor & Progress
    const [score, setScore] = useState(0); // Skor benar
    const [wrongCount, setWrongCount] = useState(0); // Jumlah pertanyaan yang dijawab salah (setelah 3x coba)
    const [wrongAttempts, setWrongAttempts] = useState(0); // Jumlah percobaan salah untuk pertanyaan saat ini
    
    // State UI & Feedback
    const [feedback, setFeedback] = useState({ show: false, correct: false, selectedId: null }); // Feedback border di pilihan jawaban
    const [quizState, setQuizState] = useState('loading'); // Status kuis: 'loading', 'playing', 'finished', 'not_enough_data', 'error'
    const [feedbackPopup, setFeedbackPopup] = useState({ isOpen: false, type: null, imageUrl: null }); // State modal feedback benar/salah
    const [isAnswering, setIsAnswering] = useState(false); // Mencegah klik ganda saat menjawab
    const [error, setError] = useState(null); // Menyimpan pesan error fetch data

    /**
     * Memutar audio pertanyaan (kosakata).
     * Dibungkus useCallback agar referensinya stabil.
     * @param {string | null} audioUrl - Path relatif audio.
     */
    const playQuestionAudio = useCallback((audioUrl) => {
        if (!audioUrl || audioUrl.endsWith('#')) return; // Jangan putar jika URL tidak valid
        // Hentikan audio sebelumnya jika ada
        if (audioRef.current) {
            audioRef.current.pause();
        }
        // Buat objek Audio baru
        const audio = new Audio(getImageUrl(audioUrl)); // Gunakan getImageUrl helper
        audioRef.current = audio; // Simpan referensi
        // Putar audio, tangani error (misal AbortError jika diinterupsi)
        audio.play().catch(e => e.name !== 'AbortError' && console.error("Gagal memutar audio pertanyaan:", e));
    }, []);

    // Efek cleanup: Hentikan audio saat komponen di-unmount
    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    /**
     * Menyiapkan pertanyaan saat ini: memilih opsi jawaban salah dan memutar audio.
     * Dibungkus useCallback karena menjadi dependensi useEffect.
     * @param {number} questionIndex - Index pertanyaan yang akan disiapkan.
     * @param {Array} allEntriesSource - Sumber semua entri untuk memilih opsi salah.
     */
    const setupQuestion = useCallback((questionIndex, allEntriesSource) => {
        // Pastikan pertanyaan ada dan sumber entri tersedia
        if (!questions[questionIndex] || !allEntriesSource || allEntriesSource.length === 0) return;
        
        const currentQ = questions[questionIndex]; // Pertanyaan (jawaban benar) saat ini
        // Filter entri lain sebagai kandidat jawaban salah
        const wrongOptionsPool = allEntriesSource.filter(e => e._id !== currentQ._id);
        // Ambil 3 opsi salah secara acak
        const shuffledWrongOptions = shuffleArray(wrongOptionsPool).slice(0, 3);
        // Gabungkan jawaban benar dan salah, lalu acak urutannya
        setOptions(shuffleArray([currentQ, ...shuffledWrongOptions]));
        // Ambil URL audio pertanyaan sesuai bahasa UI
        const audioUrl = findVocab(currentQ, i18n.language)?.audioUrl;
        // Putar audio pertanyaan
        playQuestionAudio(audioUrl);
    }, [questions, i18n.language, playQuestionAudio]); // Dependensi

    // Efek: Inisialisasi data kuis saat komponen dimuat atau topicId berubah
    useEffect(() => {
        const initializeQuiz = async () => {
            try {
                setQuizState('loading'); // Set status loading
                setError(null); // Reset error
                
                // Ambil data topik dan kosakata secara paralel
                const [topicData, entriesData] = await Promise.all([
                    getTopicById(topicId), 
                    getEntriesByTopicId(topicId)
                ]);
                const entries = entriesData.entries || []; // Ambil daftar kosakata
                
                // Cek apakah jumlah kosakata cukup untuk kuis (minimal 4)
                if (entries.length < 4) {
                    setQuizState('not_enough_data'); // Set status jika tidak cukup
                    return;
                }
                
                // Ambil nama topik utama (bahasa Indonesia)
                const mainTopicName = topicData.topic.topicName.find(t => t.lang === 'id')?.value || 'Kuis';
                setTopicName(mainTopicName); // Simpan nama topik
                setAllEntries(entries); // Simpan semua kosakata
                // Acak kosakata dan ambil 5 untuk pertanyaan
                setQuestions(shuffleArray(entries).slice(0, 5)); 
                setQuizState('playing'); // Set status kuis dimulai
                
            } catch (err) { // Tangani error fetch data
                console.error("Gagal memuat kuis:", err);
                // Set pesan error berdasarkan tipe error
                if (err.response && err.response.status >= 500) {
                    setError("Server sedang mengalami gangguan. Silakan coba lagi nanti.");
                } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                    setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
                } else { // Termasuk 404 atau error klien lainnya
                    setError("Topik tidak ditemukan atau data tidak tersedia.");
                }
                setQuizState('error'); // Set status error
            }
        };
        
        initializeQuiz(); // Panggil fungsi inisialisasi
    }, [topicId]); // Jalankan ulang jika topicId berubah

    // Efek: Siapkan pertanyaan setiap kali index berubah atau kuis dimulai
    useEffect(() => {
        // Hanya jalankan jika status 'playing' dan ada pertanyaan
        if (quizState === 'playing' && questions.length > 0) {
            setupQuestion(currentQuestionIndex, allEntries); // Panggil fungsi setup
        }
    }, [currentQuestionIndex, questions, quizState, setupQuestion, allEntries]); // Dependensi

    /**
     * Handler saat salah satu opsi jawaban diklik.
     * @param {object} selectedEntry - Objek entri kosakata yang dipilih.
     */
    const handleAnswerClick = async (selectedEntry) => {
        // Cegah klik ganda jika sedang memproses jawaban
        if (isAnswering) return; 
        setIsAnswering(true); // Mulai proses jawaban

        // Cek apakah jawaban benar
        const isCorrect = selectedEntry._id === questions[currentQuestionIndex]._id;
        // Tampilkan feedback border pada pilihan yang diklik
        setFeedback({ show: true, correct: isCorrect, selectedId: selectedEntry._id });

        if (isCorrect) { // Jika jawaban benar
            setScore(s => s + 1); // Tambah skor
            // Tampilkan popup feedback benar dengan gambar karakter happy
            setFeedbackPopup({ 
                isOpen: true, 
                type: 'correct',
                imageUrl: '/assets/images/char/char-happy.png' // Gambar karakter
            });
            await playCorrectSound(); // Putar audio feedback benar
            handleNextQuestion(); // Lanjut ke pertanyaan berikutnya
        } else { // Jika jawaban salah
            const newWrongAttempts = wrongAttempts + 1; // Increment percobaan salah
            setWrongAttempts(newWrongAttempts);
            
            // Tampilkan popup feedback salah dengan gambar karakter sad
            setFeedbackPopup({ 
                isOpen: true, 
                type: 'incorrect',
                imageUrl: '/assets/images/char/char-sad.png' // Gambar karakter
            });
            await playIncorrectSound(); // Putar audio feedback salah
            
            // Jika sudah salah 3x untuk pertanyaan ini
            if (newWrongAttempts >= 3) {
                setWrongCount(w => w + 1); // Tambah hitungan pertanyaan salah
                handleNextQuestion(); // Lanjut ke pertanyaan berikutnya
            } else { // Jika belum 3x salah
                // Tutup popup feedback setelah audio selesai (implisit dari await)
                setFeedbackPopup({ isOpen: false, type: null, imageUrl: null });
                // Reset feedback border agar pengguna bisa mencoba lagi
                setFeedback({ show: false, correct: false, selectedId: null });
            }
        }
        
        setIsAnswering(false); // Selesai proses jawaban
    };

    /**
     * Handler untuk lanjut ke pertanyaan berikutnya atau menyelesaikan kuis.
     */
    const handleNextQuestion = () => {
        // Reset state feedback dan percobaan salah
        setFeedback({ show: false, correct: false, selectedId: null });
        setFeedbackPopup({ isOpen: false, type: null, imageUrl: null });
        setWrongAttempts(0);
        // Jika ini pertanyaan terakhir
        if (currentQuestionIndex + 1 >= questions.length) {
            setQuizState('finished'); // Set status kuis selesai
        } else { // Jika masih ada pertanyaan
            setCurrentQuestionIndex(i => i + 1); // Pindah ke index berikutnya
        }
    };
    
    /**
     * Handler untuk tombol "Coba Lagi" di modal hasil kuis.
     */
    const restartQuiz = () => {
        // Reset semua state ke nilai awal
        setScore(0);
        setWrongCount(0);
        setWrongAttempts(0);
        setCurrentQuestionIndex(0);
        // Acak ulang pertanyaan dari semua entri
        setQuestions(shuffleArray(allEntries).slice(0, 5)); 
        setQuizState('playing'); // Set status kembali ke 'playing'
        setIsAnswering(false);
    };

    // Ambil data pertanyaan saat ini
    const currentQuestion = questions[currentQuestionIndex];
    // Ambil URL audio untuk pertanyaan saat ini
    const questionAudio = currentQuestion ? findVocab(currentQuestion, i18n.language)?.audioUrl : null;

    // Render kondisi Loading
    if (quizState === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }
    
    // Render Halaman Kuis
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex flex-col h-screen overflow-hidden" // Layout utama flex column
        >
            {/* Header Halaman (Sticky) */}
            <div className="sticky top-0 z-10 bg-background border-b border-background"> {/* Pastikan background konsisten */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-5"> {/* Padding header */}
                        <PageHeader title={`Kuis Topik ${topicName}`}> {/* Judul halaman */}
                            {/* Tombol Kembali ke Topik */}
                            <Link 
                                to={`/topik/${topicId}`} 
                                state={{ fromQuiz: true }} // Kirim state untuk mencegah audio opening di KosakataPage
                                className="flex items-center justify-center gap-2 bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap border border-gray-300 dark:border-gray-600" // Styling tombol kembali
                            >
                                <span>←</span>
                                <span>Kembali ke Topik</span>
                            </Link>
                        </PageHeader>
                    </div>
                </div>
            </div>

            {/* Area Konten Scrollable */}
            <div className="flex-1 overflow-y-auto">
                {/* Tampilan Error */}
                {error && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md mx-auto px-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
                                <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
                                <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Terjadi Kesalahan</h2>
                                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                                {/* Tombol Aksi Error */}
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold">Coba Lagi</button>
                                    <Link to="/home" className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-bold text-center">Kembali ke Beranda</Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Konten Utama (jika tidak ada error) */}
                {!error && (
                    <>
                        {/* Tampilan jika kosakata tidak cukup */}
                        {quizState === 'not_enough_data' && (
                           <div className="flex items-center justify-center h-full">
                               <div className="text-center max-w-md mx-auto px-4">
                                   <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
                                       <div className="text-yellow-600 dark:text-yellow-400 text-6xl mb-4">📝</div>
                                       <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Kuis Tidak Tersedia</h2>
                                       <p className="text-yellow-600 dark:text-yellow-400 mb-4">
                                           Kuis membutuhkan minimal 4 kosakata. Topik ini belum memiliki cukup kosakata untuk membuat kuis.
                                       </p>
                                       <Link 
                                           to={`/topik/${topicId}`} 
                                           state={{ fromQuiz: true }}
                                           className="bg-yellow-600 text-white px-6 py-3 rounded-lg hover:bg-yellow-700 font-bold inline-block"
                                       >
                                           Kembali ke Topik
                                       </Link>
                                   </div>
                               </div>
                           </div>
                        )}

                        {/* Tampilan Kuis Sedang Berlangsung */}
                        {quizState === 'playing' && currentQuestion && (
                            <div className="flex flex-col items-center py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                                {/* Instruksi */}
                                <h3 className="text-xl md:text-2xl font-semibold text-text-secondary text-center mb-6">
                                    Dengarkan audio, lalu pilih gambar yang tepat!
                                </h3>
                                {/* Petunjuk Tambahan */}
                                {/* <ul className="list-disc text-text-secondary mb-6 pl-6 text-sm">
                                    <li>Klik ikon volume untuk mendengarkan kosakata</li>
                                    <li>Jika salah 3 kali, akan berganti ke pertanyaan selanjutnya</li>
                                </ul> */}
                                
                                {/* Tombol Putar Audio Pertanyaan */}
                                <motion.button 
                                    whileHover={{ scale: 1.1 }} 
                                    whileTap={{ scale: 0.9 }} 
                                    onClick={() => playQuestionAudio(questionAudio)} 
                                    className="mb-6 w-32 h-32 bg-accent/20 text-accent rounded-2xl flex items-center justify-center text-5xl shadow-lg"
                                    aria-label="Putar audio pertanyaan" // Aksesibilitas
                                >
                                    🔊
                                </motion.button>
                                
                                {/* Tampilan Skor */}
                                <div className="flex justify-center items-center gap-4 mb-8 text-sm sm:text-base">
                                    <p className="font-bold text-text">Nilai kamu: </p>
                                    <div className="bg-secondary/20 text-secondary font-bold px-4 py-2 rounded-lg">
                                        Benar: {score}
                                    </div>
                                    <div className="bg-red-500/10 text-red-500 font-bold px-4 py-2 rounded-lg">
                                        Salah: {wrongCount}
                                    </div>
                                </div>
                                
                                {/* Pemisah */}
                                <hr className="w-full mb-8 border-background-secondary" />
                                
                                {/* Grid Pilihan Jawaban */}
                                <div className="w-full">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                        {/* Mapping opsi jawaban */}
                                        {options.map(opt => (
                                            <motion.div 
                                                key={opt._id} // Key unik
                                                onClick={() => !feedback.show && handleAnswerClick(opt)} // Handler klik, nonaktifkan jika feedback tampil
                                                role="button" // Aksesibilitas
                                                tabIndex={feedback.show ? -1 : 0} // Aksesibilitas
                                                // Styling kartu pilihan
                                                className={`
                                                    relative aspect-square bg-background-secondary rounded-2xl overflow-hidden shadow-md border-4 transition-all duration-300 
                                                    ${isAnswering ? 'cursor-wait opacity-70' : 'cursor-pointer'}
                                                    ${feedback.show && feedback.selectedId === opt._id 
                                                        ? (feedback.correct ? 'border-secondary scale-105 shadow-xl' : 'border-red-500') // Feedback border & scale
                                                        : 'border-transparent hover:scale-105 hover:shadow-lg' // Efek hover normal
                                                    }
                                                `}
                                                // Animasi saat kartu muncul (jika diperlukan, bisa dihapus)
                                                // initial={{ scale: 0.8, opacity: 0 }}
                                                // animate={{ scale: 1, opacity: 1 }}
                                                // transition={{ delay: index * 0.1 }} // Animasi stagger kecil
                                            >
                                                <img 
                                                    src={getImageUrl(opt.entryImagePath)} // URL gambar
                                                    className="w-full h-full object-cover p-2" // Styling gambar
                                                    alt="Pilihan Jawaban" 
                                                    // Fallback jika gambar gagal dimuat
                                                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x200/e2e8f0/4a5568?text=?' }}
                                                />
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Hasil Kuis (ditampilkan saat quizState === 'finished') */}
            <AnimatePresence>
                {quizState === 'finished' && (
                    // Overlay modal
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        {/* Konten Modal */}
                        <motion.div 
                            variants={modalContainerVariants} // Varian animasi container
                            initial="hidden" 
                            animate="visible" 
                            className="bg-background-secondary p-8 rounded-2xl text-center shadow-2xl w-full max-w-md"
                        >
                            {/* Judul Modal */}
                            <motion.h2 
                                variants={modalItemVariants} // Varian animasi item
                                className="text-3xl font-bold mb-4 text-text"
                            >
                                Kuis Selesai!
                            </motion.h2>
                            {/* Teks Skor */}
                            <motion.p 
                                variants={modalItemVariants} 
                                className="text-xl text-text-secondary"
                            >
                                Skor akhir kamu adalah:
                            </motion.p>
                            {/* Skor */}
                            <motion.p 
                                variants={modalItemVariants} 
                                className="text-6xl font-bold my-4 text-primary"
                            >
                                {score} / {questions.length}
                            </motion.p>
                            {/* Tombol Aksi */}
                            <motion.div 
                                variants={modalItemVariants} 
                                className="flex flex-col sm:flex-row gap-4 mt-6"
                            >
                                {/* Tombol Coba Lagi */}
                                <button 
                                    onClick={restartQuiz} 
                                    className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 font-bold"
                                >
                                    Coba Lagi
                                </button>
                                {/* Tombol Kembali ke Topik */}
                                <button 
                                    onClick={() => navigate(`/topik/${topicId}`, { state: { fromQuiz: true } })} // Kirim state agar tidak ada audio opening
                                    className="w-full bg-background text-text px-6 py-3 rounded-lg hover:bg-background/80 font-bold border border-gray-300 dark:border-gray-600" // Styling tombol sekunder
                                >
                                    Kembali ke Topik
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Popup Feedback Jawaban (Benar/Salah) */}
            <QuizFeedbackPopup 
                isOpen={feedbackPopup.isOpen} 
                type={feedbackPopup.type}
                imageUrl={feedbackPopup.imageUrl}
            />
        </motion.div>
    );
};

export default QuizPage;