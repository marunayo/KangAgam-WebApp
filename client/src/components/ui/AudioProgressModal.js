import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Komponen modal untuk menampilkan status progress audio (misalnya saat memproses).
 * Menampilkan pesan, gambar ilustrasi, dan indikator loading.
 * @param {boolean} isOpen - Status modal (terbuka/tertutup).
 * @param {string} message - Pesan yang ditampilkan di modal.
 * @param {string} imageUrl - URL gambar ilustrasi (opsional, ada fallback).
 */
const AudioProgressModal = ({ isOpen, message, imageUrl }) => {
    return (
        <AnimatePresence>
            {isOpen && ( // Hanya render jika isOpen true
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    // Tidak ada onClick onClose di backdrop, modal ini biasanya menutup otomatis
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full"
                        // Mencegah klik di dalam modal menutupnya (meskipun backdrop tidak menutup)
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Pesan Status */}
                        <div className="text-center text-gray-800 text-lg font-medium mb-4">
                            {message}
                        </div>
                        
                        {/* Gambar Ilustrasi */}
                        <div className="flex justify-center mb-4">
                            <img 
                                // Gunakan imageUrl jika ada, jika tidak gunakan placeholder
                                src={imageUrl || "https://placehold.co/200x200/e0e7ff/4338ca?text=Processing..."}
                                alt="Progress illustration"
                                className="w-48 h-48 object-cover rounded-lg"
                                // Fallback jika imageUrl gagal dimuat
                                onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x200/e0e7ff/4338ca?text=Processing...' }}
                            />
                        </div>
                        
                        {/* Indikator Loading (Spinner) */}
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AudioProgressModal;