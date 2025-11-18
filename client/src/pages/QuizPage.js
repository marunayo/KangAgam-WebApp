import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import useAudioFeedback from '../hooks/useAudioFeedback';
import { getEntriesByTopicId } from '../services/entryService';
import { getTopicById } from '../services/topicService';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import PageHeader from '../components/ui/PageHeader';

// Icon components dengan dukungan theme
const CheckIcon = () => ( 
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
);

const ExclamationIcon = () => ( 
    <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg> 
);

const QuizFeedbackPopup = ({ isOpen, type, imageUrl }) => {
    const content = {
        correct: { 
            icon: <CheckIcon />, 
            text: "Hebat!", 
            bgColor: "bg-green-100 dark:bg-green-900/30",
            borderColor: "border-green-300 dark:border-green-700",
            textColor: "text-green-800 dark:text-green-100",
            defaultImage: "https://via.placeholder.com/200x200/22c55e/ffffff?text=✓"
        },
        incorrect: { 
            icon: <ExclamationIcon />, 
            text: "Coba lagi, ya!", 
            bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
            borderColor: "border-yellow-300 dark:border-yellow-700", 
            textColor: "text-yellow-800 dark:text-yellow-100",
            defaultImage: "https://via.placeholder.com/200x200/eab308/ffffff?text=?"
        },
    };
    const selectedContent = content[type] || content.correct;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                >
                    <motion.div 
                        initial={{ scale: 0.5, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.5, opacity: 0 }} 
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }} 
                        className={`
                            p-8 rounded-2xl flex flex-col items-center gap-4 
                            border-2 backdrop-blur-sm shadow-2xl max-w-sm w-full
                            ${selectedContent.bgColor} 
                            ${selectedContent.borderColor}
                        `}
                    >
                        <div className={`${selectedContent.textColor}`}>
                            {selectedContent.icon}
                        </div>
                        <p className={`text-2xl font-bold ${selectedContent.textColor}`}>
                            {selectedContent.text}
                        </p>
                        
                        {/* Image Section */}
                        <div className="w-full flex justify-center mt-2">
                            <img 
                                src={imageUrl || selectedContent.defaultImage}
                                alt={type === 'correct' ? 'Jawaban Benar' : 'Jawaban Salah'}
                                className="w-48 h-48 object-cover rounded-xl"
                            />
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

// Helper functions and variants
const shuffleArray = (array) => [...array].sort(() => Math.random() - 0.5);
const findVocab = (entry, lang) => entry?.entryVocabularies?.find(v => v.language.languageCode === lang) || entry?.entryVocabularies?.[0];
const modalContainerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
const modalItemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

const QuizPage = () => {
    // State hooks
    const { topicId } = useParams();
    const { i18n } = useTranslation();
    const navigate = useNavigate();
    const audioRef = useRef(null);
    const { playCorrectSound, playIncorrectSound } = useAudioFeedback();
    
    const [topicName, setTopicName] = useState('');
    const [allEntries, setAllEntries] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [options, setOptions] = useState([]);
    const [score, setScore] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [wrongAttempts, setWrongAttempts] = useState(0);
    const [feedback, setFeedback] = useState({ show: false, correct: false, selectedId: null });
    const [quizState, setQuizState] = useState('loading');
    const [feedbackPopup, setFeedbackPopup] = useState({ isOpen: false, type: null, imageUrl: null });
    const [isAnswering, setIsAnswering] = useState(false);
    
    // ✅ Simplified error state - route guard handles invalid IDs
    const [error, setError] = useState(null);

    // Audio handling
    const playQuestionAudio = useCallback((audioUrl) => {
        if (!audioUrl) return;
        if (audioRef.current) audioRef.current.pause();
        const audio = new Audio(`${process.env.REACT_APP_API_URL}${audioUrl}`);
        audioRef.current = audio;
        audio.play().catch(e => e.name !== 'AbortError' && console.error(e));
    }, []);

    useEffect(() => {
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);

    const setupQuestion = useCallback((questionIndex, allEntriesSource) => {
        if (!questions[questionIndex]) return;
        const currentQ = questions[questionIndex];
        const wrongOptionsPool = allEntriesSource.filter(e => e._id !== currentQ._id);
        const shuffledWrongOptions = shuffleArray(wrongOptionsPool).slice(0, 3);
        setOptions(shuffleArray([currentQ, ...shuffledWrongOptions]));
        const audioUrl = findVocab(currentQ, i18n.language)?.audioUrl;
        playQuestionAudio(audioUrl);
    }, [questions, i18n.language, playQuestionAudio]);

    useEffect(() => {
        const initializeQuiz = async () => {
            try {
                setQuizState('loading');
                setError(null);
                
                const [topicData, entriesData] = await Promise.all([
                    getTopicById(topicId), 
                    getEntriesByTopicId(topicId)
                ]);
                const entries = entriesData.entries || [];
                
                if (entries.length < 4) {
                    setQuizState('not_enough_data');
                    return;
                }
                
                const mainTopicName = topicData.topic.topicName.find(t => t.lang === 'id')?.value || 'Kuis';
                setTopicName(mainTopicName);
                setAllEntries(entries);
                setQuestions(shuffleArray(entries).slice(0, 5));
                setQuizState('playing');
                
            } catch (err) {
                console.error("Gagal memuat kuis:", err);
                
                // ✅ Simplified error handling - route guard handles invalid topic IDs
                if (err.response && err.response.status >= 500) {
                    setError("Server sedang mengalami gangguan. Silakan coba lagi nanti.");
                } else if (err.code === 'NETWORK_ERROR' || !err.response) {
                    setError("Tidak dapat terhubung ke server. Periksa koneksi internet Anda.");
                } else {
                    // For topic not found or other API errors
                    setError("Topik tidak ditemukan atau data tidak tersedia.");
                }
                setQuizState('error');
            }
        };
        
        initializeQuiz();
    }, [topicId]);

    useEffect(() => {
        if (quizState === 'playing' && questions.length > 0) {
            setupQuestion(currentQuestionIndex, allEntries);
        }
    }, [currentQuestionIndex, questions, quizState, setupQuestion, allEntries]);

    // Quiz logic
    const handleAnswerClick = async (selectedEntry) => {
        if (isAnswering) return;
        setIsAnswering(true);

        const isCorrect = selectedEntry._id === questions[currentQuestionIndex]._id;
        setFeedback({ show: true, correct: isCorrect, selectedId: selectedEntry._id });

        if (isCorrect) {
            setScore(s => s + 1);
            // Show correct answer with custom image
            setFeedbackPopup({ 
                isOpen: true, 
                type: 'correct',
                imageUrl: '/assets/images/char/char-happy.png'
            });
            await playCorrectSound();
            handleNextQuestion();
        } else {
            const newWrongAttempts = wrongAttempts + 1;
            setWrongAttempts(newWrongAttempts);
            
            // Show incorrect feedback with custom image
            setFeedbackPopup({ 
                isOpen: true, 
                type: 'incorrect',
                imageUrl: '/assets/images/char/char-sad.png'
            });
            await playIncorrectSound();
            
            if (newWrongAttempts >= 3) {
                setWrongCount(w => w + 1);
                handleNextQuestion();
            } else {
                setFeedbackPopup({ isOpen: false, type: null, imageUrl: null });
                setFeedback({ show: false, correct: false, selectedId: null });
            }
        }
        
        setIsAnswering(false);
    };

    const handleNextQuestion = () => {
        setFeedback({ show: false, correct: false, selectedId: null });
        setFeedbackPopup({ isOpen: false, type: null, imageUrl: null });
        setWrongAttempts(0);
        if (currentQuestionIndex + 1 >= questions.length) {
            setQuizState('finished');
        } else {
            setCurrentQuestionIndex(i => i + 1);
        }
    };
    
    const restartQuiz = () => {
        setScore(0);
        setWrongCount(0);
        setWrongAttempts(0);
        setCurrentQuestionIndex(0);
        setQuestions(shuffleArray(allEntries).slice(0, 5));
        setQuizState('playing');
        setIsAnswering(false);
    };

    const currentQuestion = questions[currentQuestionIndex];
    const questionAudio = currentQuestion ? findVocab(currentQuestion, i18n.language)?.audioUrl : null;

    // Render conditions
    if (quizState === 'loading') {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="flex flex-col h-screen overflow-hidden"
        >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background border-b border-background">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="py-5">
                        <PageHeader title={`Kuis Topik ${topicName}`}>
                            <Link 
                                to={`/topik/${topicId}`} 
                                state={{ fromQuiz: true }}
                                className="flex items-center justify-center gap-2 bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 whitespace-nowrap"
                            >
                                <span>←</span>
                                <span>Kembali ke Topik</span>
                            </Link>
                        </PageHeader>
                    </div>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
                {/* Error State */}
                {error && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center max-w-md mx-auto px-4">
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-6">
                                <div className="text-red-600 dark:text-red-400 text-6xl mb-4">⚠️</div>
                                <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                                    Terjadi Kesalahan
                                </h2>
                                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                    <button 
                                        onClick={() => window.location.reload()} 
                                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold"
                                    >
                                        Coba Lagi
                                    </button>
                                    <Link 
                                        to="/home" 
                                        className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 font-bold text-center"
                                    >
                                        Kembali ke Beranda
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Content */}
                {!error && (
                    <>
                        {/* Not enough data state */}
                        {quizState === 'not_enough_data' && (
                            <div className="flex items-center justify-center h-full">
                                <div className="text-center max-w-md mx-auto px-4">
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-6">
                                        <div className="text-yellow-600 dark:text-yellow-400 text-6xl mb-4">📝</div>
                                        <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">
                                            Kuis Tidak Tersedia
                                        </h2>
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

                        {/* Playing state */}
                        {quizState === 'playing' && currentQuestion && (
                            <div className="flex flex-col items-center py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                                <h3 className="text-2xl font-semibold text-text-secondary text-center mb-6">
                                    Dengarkan pertanyaan melalui audio ini
                                </h3>
                                
                                <ul className="list-disc text-text-secondary mb-6 pl-6">
                                    <li>Klik ikon volume untuk mendengarkan kosakata</li>
                                    <li>Jika salah 3 kali di pertanyaan yang sama, akan berganti ke pertanyaan selanjutnya</li>
                                </ul>
                                
                                <motion.button 
                                    whileHover={{ scale: 1.1 }} 
                                    whileTap={{ scale: 0.9 }} 
                                    onClick={() => playQuestionAudio(questionAudio)} 
                                    className="mb-6 w-32 h-32 bg-accent/20 text-accent rounded-2xl flex items-center justify-center text-5xl shadow-lg"
                                >
                                    🔊
                                </motion.button>
                                
                                <div className="flex justify-center items-center gap-4 mb-8">
                                    <p className="font-bold text-text">Nilai kamu: </p>
                                    <div className="bg-secondary/20 text-secondary font-bold px-4 py-2 rounded-lg">
                                        Benar: {score}
                                    </div>
                                    <div className="bg-red-500/10 text-red-500 font-bold px-4 py-2 rounded-lg">
                                        Salah: {wrongCount}
                                    </div>
                                </div>
                                
                                <hr className="w-full mb-8 border-background-secondary" />
                                
                                <div className="w-full">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                        {options.map(opt => (
                                            <motion.div 
                                                key={opt._id} 
                                                onClick={() => handleAnswerClick(opt)} 
                                                className={`
                                                    relative aspect-square bg-background-secondary rounded-2xl overflow-hidden shadow-md cursor-pointer border-4 transition-all duration-300 
                                                    ${feedback.show && feedback.selectedId === opt._id 
                                                        ? (feedback.correct ? 'border-secondary scale-105' : 'border-red-500') 
                                                        : 'border-transparent'
                                                    }
                                                `}
                                            >
                                                <img 
                                                    src={`${process.env.REACT_APP_API_URL}${opt.entryImagePath}`} 
                                                    className="w-full h-full object-cover" 
                                                    alt="Pilihan Jawaban" 
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

            {/* Quiz Finished Modal */}
            <AnimatePresence>
                {quizState === 'finished' && (
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    >
                        <motion.div 
                            variants={modalContainerVariants} 
                            initial="hidden" 
                            animate="visible" 
                            className="bg-background-secondary p-8 rounded-2xl text-center shadow-2xl w-full max-w-md"
                        >
                            <motion.h2 
                                variants={modalItemVariants} 
                                className="text-3xl font-bold mb-4 text-text"
                            >
                                Kuis Selesai!
                            </motion.h2>
                            <motion.p 
                                variants={modalItemVariants} 
                                className="text-xl text-text-secondary"
                            >
                                Skor akhir kamu adalah:
                            </motion.p>
                            <motion.p 
                                variants={modalItemVariants} 
                                className="text-6xl font-bold my-4 text-primary"
                            >
                                {score} / {questions.length}
                            </motion.p>
                            <motion.div 
                                variants={modalItemVariants} 
                                className="flex flex-col sm:flex-row gap-4 mt-6"
                            >
                                <button 
                                    onClick={restartQuiz} 
                                    className="w-full bg-primary text-white px-6 py-3 rounded-lg hover:opacity-90 font-bold"
                                >
                                    Coba Lagi
                                </button>
                                <button 
                                    onClick={() => navigate(`/topik/${topicId}`, { state: { fromQuiz: true } })} 
                                    className="w-full bg-background text-text px-6 py-3 rounded-lg hover:bg-background/80 font-bold"
                                >
                                    Kembali ke Topik
                                </button>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            
            {/* Feedback Popup */}
            <QuizFeedbackPopup 
                isOpen={feedbackPopup.isOpen} 
                type={feedbackPopup.type}
                imageUrl={feedbackPopup.imageUrl}
            />
        </motion.div>
    );
};

export default QuizPage;