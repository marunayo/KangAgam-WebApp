import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Icon component
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const getLocalizedName = (nameData, lang = 'id') => {
    if (!nameData || !Array.isArray(nameData)) return 'N/A';
    const translation = nameData.find(n => n.lang === lang);
    return translation ? translation.value : nameData[0]?.value || 'N/A';
};

const ManageCultureTopicDetailModal = ({ topic, onClose, onEdit, onDelete }) => {
    return (
        <AnimatePresence>
            {topic && (
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
                            <h2 className="text-lg font-bold text-gray-800">{getLocalizedName(topic.name)}</h2>
                            <button onClick={onClose} className="p-2 text-gray-700 hover:text-black">
                                <CloseIcon />
                            </button>
                        </header>

                        <div className="p-4 space-y-3">
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Nama Topik (Sunda)</p>
                                <p className="text-base font-semibold">{getLocalizedName(topic.name, 'su')}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Nama Topik (Inggris)</p>
                                <p className="text-base font-semibold">{getLocalizedName(topic.name, 'en')}</p>
                            </div>
                            <div className="bg-gray-100 p-3 rounded-lg">
                                <p className="text-xs text-gray-500">Total Entri</p>
                                <p className="text-base font-semibold">{topic.entryCount || 0}</p>
                            </div>
                        </div>

                        <footer className="p-4 pt-0 space-y-3 border-t-0">
                            {/* Full width Pratinjau button */}
                            <Link 
                                to={`/kamus-budaya/${topic._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-gray-500 text-white text-center font-bold py-3 rounded-lg hover:bg-gray-600 flex items-center justify-center text-sm w-full"
                            >
                                Pratinjau
                            </Link>
                            
                            {/* Three buttons in a row */}
                            <div className="grid grid-cols-3 gap-3">
                                <Link 
                                    to={`/admin/manage-culture-topics/${topic._id}/entries`}
                                    className="bg-blue-500 text-white text-center font-bold py-3 rounded-lg hover:bg-blue-600 flex items-center justify-center text-sm"
                                >
                                    Kelola Entri
                                </Link>
                                <button onClick={onEdit} className="bg-yellow-500 text-white font-bold py-3 rounded-lg hover:bg-yellow-600 text-sm">
                                    Edit
                                </button>
                                <button onClick={onDelete} className="bg-red-500 text-white font-bold py-3 rounded-lg hover:bg-red-600 text-sm">
                                    Hapus
                                </button>
                            </div>
                        </footer>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ManageCultureTopicDetailModal;