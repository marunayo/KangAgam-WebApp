import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen internal untuk ikon 'Close' (X)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

/**
 * Komponen modal "bottom sheet" untuk menampilkan detail kosakata (word).
 * @param {object} word - Objek data kosakata.
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {function} onEdit - Fungsi untuk edit.
 * @param {function} onDelete - Fungsi untuk hapus.
 * @param {function} onViewImage - Fungsi untuk melihat gambar.
 * @param {function} onPlayAudio - Fungsi untuk memutar audio.
 * @param {function} findVocab - Fungsi helper untuk mencari vocab berdasarkan kode bahasa.
 */
const ManageWordDetailModal = ({ word, onClose, onEdit, onDelete, onViewImage, onPlayAudio, findVocab }) => {
    return (
        <AnimatePresence>
            {word && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white w-full rounded-t-2xl flex flex-col pb-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">{findVocab(word, 'id')}</h2>
                            <button onClick={onClose} className="p-2 text-gray-700 hover:text-black">
                                <CloseIcon />
                            </button>
                        </header>

                        {/* Bagian isi detail kosakata */}
                        <div className="p-4 space-y-3">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Indonesia</p>
                                <p className="text-base font-semibold">{findVocab(word, 'id')}</p>
                            </div>
                            
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Sunda</p>
                                <p className="text-base font-semibold">{findVocab(word, 'su')}</p>
                            </div>
                            
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">English</p>
                                <p className="text-base font-semibold">{findVocab(word, 'en')}</p>
                            </div>
                        </div>

                        {/* Tombol aksi media dan manajemen */}
                        <footer className="p-4 pt-0 space-y-3 border-t-0">
                            {/* Tombol media (Gambar, Audio) */}
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={onViewImage}
                                    className="bg-blue-500 text-white text-center font-bold py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center text-sm"
                                >
                                    Lihat Gambar
                                </button>
                                <button 
                                    onClick={onPlayAudio}
                                    className="bg-blue-500 text-white text-center font-bold py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center text-sm"
                                >
                                    Putar Audio
                                </button>
                            </div>
                            
                            {/* Tombol manajemen (Edit, Hapus) */}
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={onEdit} className="bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 text-sm">Edit</button>
                                <button onClick={onDelete} className="bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 text-sm">Hapus</button>
                            </div>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ManageWordDetailModal;