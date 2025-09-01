import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

// Komponen AudioPlayerModal yang sudah disempurnakan
const AudioPlayerModal = ({ entry, onClose }) => {
    const [nowPlaying, setNowPlaying] = useState(null);
    const [audioDuration, setAudioDuration] = useState(0);
    
    // State untuk menyimpan objek audio agar bisa dihentikan
    const [audioObject, setAudioObject] = useState(null);

    // Hentikan audio jika modal ditutup
    useEffect(() => {
        return () => {
            if (audioObject) {
                audioObject.pause();
            }
        };
    }, [audioObject]);


    if (!entry) return null;

    const playAudio = (vocab) => {
        // Jika ada audio yang sedang diputar, hentikan dulu
        if (audioObject) {
            audioObject.pause();
            setNowPlaying(null);
        }

        const audioUrl = `${process.env.REACT_APP_API_URL}${vocab.audioUrl}`;
        if (!vocab.audioUrl || vocab.audioUrl.endsWith('#')) {
            alert('Audio untuk bahasa ini tidak tersedia.');
            return;
        }

        const newAudio = new Audio(audioUrl);
        setAudioObject(newAudio); // Simpan objek audio ke state

        newAudio.onloadedmetadata = () => {
            setAudioDuration(newAudio.duration);
        };
        newAudio.onplay = () => setNowPlaying(vocab._id);
        newAudio.onended = () => {
            setNowPlaying(null);
            setAudioObject(null);
        };
        newAudio.onerror = () => {
            console.error("Gagal memutar audio:", audioUrl);
            setNowPlaying(null);
            setAudioObject(null);
        };
        newAudio.play().catch(err => console.error("Gagal memutar audio:", err));
    };

    const languageNames = { id: 'Indonesia', su: 'Sunda', en: 'Inggris' };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white rounded-2xl shadow-xl w-full max-w-sm"
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="flex items-center justify-between p-4 border-b">
                        <h3 className="font-bold text-gray-800">Putar Audio</h3>
                        <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><CloseIcon /></button>
                    </header>
                    <div className="p-4 space-y-2">
                        {entry.entryVocabularies.map(vocab => {
                            const isPlaying = nowPlaying === vocab._id;
                            return (
                                // FIX: Tambahkan 'relative' dan 'overflow-hidden' untuk progress bar
                                <button 
                                    key={vocab._id}
                                    onClick={() => playAudio(vocab)}
                                    className={`relative overflow-hidden w-full flex items-center text-left p-3 rounded-lg transition-colors ${
                                        isPlaying ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
                                    }`}
                                    disabled={nowPlaying && !isPlaying}
                                >
                                    <PlayIcon />
                                    <span>{languageNames[vocab.language.languageCode] || vocab.language.languageCode}</span>
                                    <span className="ml-auto text-sm text-gray-500">{vocab.vocab}</span>
                                    
                                    {/* FIX: Animasi garis horizontal sebagai progress bar */}
                                    {isPlaying && (
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-1 bg-blue-500"
                                            initial={{ width: '0%' }}
                                            animate={{ width: '100%' }}
                                            transition={{ duration: audioDuration, ease: 'linear' }}
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AudioPlayerModal;