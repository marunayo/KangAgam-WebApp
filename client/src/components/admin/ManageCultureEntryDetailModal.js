import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const getLocalizedText = (textData, lang = 'id') => {
    if (!textData || !Array.isArray(textData)) return 'N/A';
    const translation = textData.find(t => t.lang === lang);
    return translation ? translation.value : textData[0]?.value || 'N/A';
};

const ManageCultureEntryDetailModal = ({ entry, onClose, onEdit, onDelete }) => {
    if (!entry) return null;

    const languages = [
        { code: 'id', name: 'Indonesia' },
        { code: 'su', name: 'Sunda' },
        { code: 'en', name: 'Inggris' }
    ];

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    exit={{ y: "100%" }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-background-secondary rounded-t-2xl shadow-xl w-full max-w-md flex flex-col max-h-[85vh]"
                    onClick={(e) => e.stopPropagation()}
                >
                    <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-background">
                        <h2 className="text-xl font-bold text-text truncate pr-4">Detail Entri</h2>
                        <button 
                            type="button" 
                            onClick={onClose} 
                            className="p-1 rounded-full hover:bg-background transition-colors"
                        >
                            <CloseIcon />
                        </button>
                    </header>

                    <main className="p-4 space-y-4 flex-1 overflow-y-auto">
                        {/* Image Preview */}
                        {entry.imagePath && (
                            <div className="bg-background p-3 rounded-lg">
                                <p className="text-xs text-text-secondary mb-2">Gambar</p>
                                <img 
                                    src={`http://10.10.48.38:5000/${entry.imagePath.replace(/\\/g, '/').replace('public/', '')}`}
                                    alt={getLocalizedText(entry.title)}
                                    className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                                />
                            </div>
                        )}

                        {/* Title Section */}
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-text-secondary">Judul</p>
                            {languages.map(({ code, name }) => (
                                <div key={code} className="bg-background p-3 rounded-lg">
                                    <p className="text-xs text-text-secondary mb-1">{name}</p>
                                    <p className="text-text font-medium break-words">
                                        {getLocalizedText(entry.title, code)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Description Section */}
                        <div className="space-y-3">
                            <p className="text-sm font-semibold text-text-secondary">Deskripsi</p>
                            {languages.map(({ code, name }) => (
                                <div key={code} className="bg-background p-3 rounded-lg">
                                    <p className="text-xs text-text-secondary mb-1">{name}</p>
                                    <p className="text-text text-sm leading-relaxed break-words">
                                        {getLocalizedText(entry.description, code)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Video Information */}
                        {(entry.videoPath || entry.videoUrl) && (
                            <div className="bg-background p-3 rounded-lg">
                                <p className="text-xs text-text-secondary mb-1">Video</p>
                                <p className="text-text text-sm">
                                    {entry.videoUrl ? (
                                        <span className="text-blue-600">Link URL: {entry.videoUrl}</span>
                                    ) : (
                                        <span>File: {entry.videoPath?.split('/').pop()}</span>
                                    )}
                                </p>
                            </div>
                        )}

                        {/* Media Status */}
                        <div className="bg-background p-3 rounded-lg">
                            <p className="text-xs text-text-secondary mb-2">Status Media</p>
                            <div className="flex flex-wrap gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${entry.imagePath ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    Gambar: {entry.imagePath ? '✓' : '✗'}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${(entry.videoPath || entry.videoUrl) ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                    Video: {(entry.videoPath || entry.videoUrl) ? '✓' : '✗'}
                                </span>
                            </div>
                        </div>
                    </main>

                    <footer className="flex-shrink-0 p-4 grid grid-cols-2 gap-3 bg-background rounded-b-2xl border-t border-background">
                        <Link 
                            to={`/kamus-budaya/entry/${entry._id}`} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-center bg-gray-500/10 text-text-secondary font-bold py-3 px-4 rounded-lg hover:bg-gray-500/20 transition-colors"
                        >
                            Pratinjau
                        </Link>
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={onEdit} 
                                className="bg-yellow-500/10 text-yellow-600 font-bold py-3 px-4 rounded-lg hover:bg-yellow-500/20 transition-colors text-sm"
                            >
                                Edit
                            </button>
                            <button 
                                onClick={onDelete} 
                                className="bg-red-500/10 text-red-500 font-bold py-3 px-4 rounded-lg hover:bg-red-500/20 transition-colors text-sm"
                            >
                                Delete
                            </button>
                        </div>
                    </footer>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ManageCultureEntryDetailModal;