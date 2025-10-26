import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen internal untuk ikon 'Close' (X)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

/**
 * Komponen modal untuk menampilkan pratinjau gambar (lightbox).
 * @param {string} imageUrl - URL gambar yang akan ditampilkan.
 * @param {function} onClose - Fungsi untuk menutup modal.
 */
const ImageModal = ({ imageUrl, onClose }) => {
    if (!imageUrl) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose} // Modal bisa ditutup dengan klik di luar gambar
            >
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors z-10"
                    aria-label="Tutup gambar"
                >
                    <CloseIcon />
                </button>
                <motion.img
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                    src={imageUrl}
                    alt="Pratinjau Gambar"
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onClick={(e) => e.stopPropagation()} // Mencegah modal tertutup saat gambar diklik
                />
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageModal;