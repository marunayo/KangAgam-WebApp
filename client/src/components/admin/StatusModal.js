// StatusModal.js (New Component)
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const StatusModal = ({ isOpen, onClose, message, type = 'success' }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-background-secondary rounded-2xl shadow-xl w-full max-w-md flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-background">
                            <h2 className="text-xl font-bold text-text">{type === 'success' ? 'Sukses' : 'Error'}</h2>
                            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon /></button>
                        </header>
                        <main className="p-6 flex flex-col items-center space-y-4">
                            {type === 'success' ? <SuccessIcon /> : <ErrorIcon />}
                            <p className="text-text text-center">{message}</p>
                        </main>
                        <footer className="flex-shrink-0 p-4 bg-background rounded-b-2xl border-t border-background">
                            <button 
                                type="button" 
                                onClick={onClose} 
                                className={`w-full font-bold py-3 px-4 rounded-lg hover:opacity-90 ${
                                    type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                }`}
                            >
                                OK
                            </button>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StatusModal;