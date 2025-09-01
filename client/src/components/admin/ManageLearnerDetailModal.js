import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen Ikon
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const ManageLearnerDetailModal = ({ learner, onClose, onDelete, hideDeleteButton = false }) => {
    return (
        <AnimatePresence>
            {learner && (
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
                            <h2 className="text-lg font-bold text-gray-800">{learner.learnerName}</h2>
                            <button onClick={onClose} className="p-2 text-gray-700 hover:text-black">
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="p-4 space-y-3">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Domisili</p>
                                <p className="text-base font-semibold">{learner.learnerCity}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">No. Telepon</p>
                                <p className="text-base font-semibold">{learner.learnerPhone || '-'}</p>
                            </div>
                        </div>

                        {/* Conditionally render the footer with delete button */}
                        {!hideDeleteButton && (
                            <footer className="p-4 pt-0">
                                <button onClick={onDelete} className="w-full bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 text-sm">
                                    Hapus Pengguna
                                </button>
                            </footer>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ManageLearnerDetailModal;