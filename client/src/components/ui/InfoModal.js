import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Komponen modal sederhana untuk menampilkan informasi kepada pengguna.
 * Memiliki judul, pesan, dan tombol "Mengerti" untuk menutup.
 * @param {boolean} isOpen - Status modal (terbuka/tertutup).
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {string} title - Judul modal.
 * @param {string} message - Pesan yang ditampilkan di modal.
 */
const InfoModal = ({ isOpen, onClose, title, message }) => {
    // Jangan render apa pun jika modal tidak terbuka
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {/* AnimatePresence diperlukan agar animasi exit bekerja */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={onClose} // Klik backdrop menutup modal
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    // Gunakan warna tema dari tailwind.config.js
                    className="bg-background-secondary rounded-2xl shadow-xl w-full max-w-sm"
                    onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutupnya
                >
                    {/* Konten utama modal */}
                    <main className="p-8 text-center">
                        <h2 className="text-xl font-bold text-text">{title}</h2>
                        <p className="text-text-secondary mt-2">{message}</p>
                    </main>

                    {/* Footer dengan tombol tutup */}
                    <footer className="p-4 bg-background rounded-b-2xl">
                        <button
                            onClick={onClose}
                            // Tombol menggunakan warna primer
                            className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                        >
                            Mengerti
                        </button>
                    </footer>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default InfoModal;