import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllCultureTopics } from '../services/cultureService';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import { motion } from 'framer-motion';
import Pagination from '../components/ui/Pagination';

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

// Helper untuk mendapatkan nama berdasarkan bahasa
const getLocalizedName = (nameData, lang = 'id') => {
    if (!nameData || !Array.isArray(nameData)) return 'Nama Tidak Tersedia';
    const translation = nameData.find(n => n.lang === lang);
    return translation ? translation.value : nameData[0]?.value || 'Nama Tidak Tersedia';
};

// Varian animasi
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: 'spring',
            stiffness: 100,
        },
    },
};

const TOPICS_PER_PAGE = 8;

const CultureTopicsPage = () => {
    const [topics, setTopics] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchTopics = async () => {
            try {
                const response = await getAllCultureTopics();
                setTopics(response.data || []);
            } catch (err) {
                setError('Gagal memuat data topik budaya. Coba lagi nanti.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchTopics();
    }, []);

    const filteredTopics = topics.filter(topic =>
        getLocalizedName(topic.name, 'id').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * TOPICS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - TOPICS_PER_PAGE;
    const currentTopics = filteredTopics.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredTopics.length / TOPICS_PER_PAGE);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><LoadingIndicator /></div>;
    }

    if (error) {
        return <p className="text-center text-red-500 mt-10">{error}</p>;
    }

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text">Kamus Budaya</h1>
                    <p className="text-text-secondary mt-1">Jelajahi kekayaan budaya melalui artikel, gambar, dan video.</p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Cari topik..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border rounded-lg bg-background-secondary"
                        />
                    </div>
                    <Link
                        to="/home"
                        className="bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    >
                        Kembali
                    </Link>
                </div>
            </div>

            {filteredTopics.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">
                        {searchTerm ? `Topik dengan nama "${searchTerm}" tidak ditemukan.` : "Topik budaya belum tersedia."}
                    </p>
                </div>
            ) : (
                <>
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mt-8"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {currentTopics.map(topic => (
                            <motion.div key={topic._id} variants={cardVariants}>
                                <Link
                                    to={`/kamus-budaya/${topic._id}`}
                                    className="flex flex-col h-full bg-background-secondary rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-shadow duration-300"
                                >
                                    <div className="relative h-48 w-full overflow-hidden">
                                        <img
                                            src={`http://10.10.48.38:5000/${topic.imagePath.replace(/\\/g, '/').replace('public/', '')}`}
                                            alt={getLocalizedName(topic.name)}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-4 flex-grow flex flex-col">
                                        <h3 className="font-bold text-lg text-text truncate group-hover:text-primary transition-colors">
                                            {getLocalizedName(topic.name)}
                                        </h3>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>

                    <div className="mt-12">
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            totalItems={filteredTopics.length}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default CultureTopicsPage;