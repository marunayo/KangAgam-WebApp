import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen Ikon 'Close' (X)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

/**
 * Komponen modal "bottom sheet" untuk menampilkan detail admin dan opsi manajemen.
 * @param {object} admin - Objek data admin yang akan ditampilkan.
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {function} onEdit - Fungsi yang dipanggil saat tombol 'Edit' diklik.
 * @param {function} onDelete - Fungsi yang dipanggil saat tombol 'Hapus' diklik.
 */
const ManageAdminDetailModal = ({ admin, onClose, onEdit, onDelete }) => {
    return (
        <AnimatePresence>
            {admin && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end"
                    onClick={onClose} // Klik di luar area modal akan menutupnya
                >
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="bg-white w-full rounded-t-2xl flex flex-col pb-4"
                        onClick={(e) => e.stopPropagation()} // Mencegah klik di dalam modal menutupnya
                    >
                        <header className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h2 className="text-lg font-bold text-gray-800">{admin.adminName}</h2>
                            <button onClick={onClose} className="p-2 text-gray-700 hover:text-black">
                                <CloseIcon />
                            </button>
                        </header>

                        {/* Bagian isi detail admin */}
                        <div className="p-4 space-y-3">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-base font-semibold">{admin.adminEmail}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Role</p>
                                <p className="text-base font-semibold capitalize">{admin.role}</p>
                            </div>
                        </div>

                        {/* Tombol aksi (Edit, Hapus) */}
                        <footer className="p-4 pt-0 grid grid-cols-2 gap-3">
                            <button onClick={onEdit} className="bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 text-sm">Edit</button>
                            <button onClick={onDelete} className="bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 text-sm">Hapus</button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ManageAdminDetailModal;