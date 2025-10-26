import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Komponen modal untuk konfirmasi penghapusan.
 * @param {boolean} isOpen - Status modal (terbuka/tertutup).
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {function} onConfirm - Fungsi yang dipanggil saat tombol 'Hapus' diklik.
 * @param {string} title - Judul modal (cth: "Hapus Admin?").
 * @param {string} message - Pesan detail konfirmasi.
 */
const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        // PERBAIKAN: Menggunakan warna tema untuk latar belakang modal
                        className="bg-background-secondary rounded-2xl shadow-xl w-full max-w-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <main className="p-8 text-center">
                            {/* PERBAIKAN: Menggunakan warna tema untuk teks */}
                            <h2 className="text-xl font-bold text-text">{title}</h2>
                            <p className="text-text-secondary mt-2">{message}</p>
                        </main>
                        {/* PERBAIKAN: Menggunakan warna tema untuk footer dan tombol */}
                        <footer className="p-4 grid grid-cols-2 gap-3 bg-background rounded-b-2xl">
                            <button
                                onClick={onClose}
                                className="bg-background-secondary text-text font-bold py-3 px-4 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={onConfirm}
                                className="bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                            >
                                Hapus
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDeleteModal;