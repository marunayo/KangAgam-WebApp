import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen internal untuk ikon 'Close' (X)
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
// Komponen internal untuk ikon Gambar
const ImageIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>;
// Komponen internal untuk ikon Audio
const AudioIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>;

/**
 * Komponen modal "full page" untuk menampilkan detail kosakata (versi admin/manajemen).
 * @param {object} word - Objek data kosakata.
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {function} onEdit - Fungsi untuk edit.
 * @param {function} onDelete - Fungsi untuk hapus.
 */
const WordDetailModal = ({ word, onClose, onEdit, onDelete }) => {
    // Efek untuk mencegah scrolling body saat modal terbuka
    useEffect(() => {
        if (word) {
            document.body.style.overflow = 'hidden';
        }
        // Cleanup function untuk mengembalikan scrolling
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [word]);

    return (
        <AnimatePresence>
            {word && (
                <motion.div
                    key="backdrop" // Kunci unik untuk animasi backdrop
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
                    onClick={onClose} // Klik backdrop akan menutup modal
                >
                    <motion.div
                        key="panel" // Kunci unik untuk animasi panel modal
                        initial={{ y: "100vh" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100vh" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-[#DAE4EE] w-full h-full flex flex-col" // Background abu-abu muda
                        onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutupnya
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-300">
                            <h2 className="text-xl font-bold text-gray-800">{word.indonesia}</h2>
                            <button onClick={onClose} className="p-2 text-gray-700 hover:text-black">
                                <CloseIcon />
                            </button>
                        </header>

                        {/* Bagian isi detail kosakata */}
                        <div className="p-6 space-y-4 flex-grow overflow-y-auto">
                            <div className="bg-white/70 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Sunda</p>
                                <p className="text-lg font-semibold">{word.sunda}</p>
                            </div>
                            <div className="bg-white/70 p-4 rounded-lg">
                                <p className="text-sm text-gray-500">Inggris</p>
                                <p className="text-lg font-semibold">{word.inggris}</p>
                            </div>
                            {/* Tombol Lihat Gambar */}
                            <div className="bg-white/70 p-4 rounded-lg flex justify-between items-center">
                                <p className="text-lg font-semibold">Gambar</p>
                                <button className="flex items-center bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1.5 rounded-md hover:bg-gray-300">
                                    <ImageIcon />
                                    <span>Lihat</span>
                                </button>
                            </div>
                            {/* Tombol Putar Audio */}
                            <div className="bg-white/70 p-4 rounded-lg flex justify-between items-center">
                                <p className="text-lg font-semibold">Audio</p>
                                 <button className="flex items-center bg-gray-200 text-gray-700 text-sm font-bold px-3 py-1.5 rounded-md hover:bg-gray-300">
                                    <AudioIcon />
                                    <span>Putar</span>
                                </button>
                            </div>
                        </div>

                        {/* Tombol aksi (Edit, Delete) */}
                        <footer className="p-4 grid grid-cols-2 gap-3 border-t border-gray-300">
                            <button onClick={onEdit} className="bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600">Edit</button>
                            <button onClick={onDelete} className="bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600">Delete</button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WordDetailModal;