import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCultureTopicById, getEntriesByCultureTopic } from '../services/cultureService';
import PageHeader from '../components/ui/PageHeader';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import { motion } from 'framer-motion';
import Pagination from '../components/ui/Pagination';

// ✅ 1. Tambahkan ikon search
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const getLocalizedText = (textData, lang = 'id') => {
    if (!textData || !Array.isArray(textData)) return 'Teks Tidak Tersedia';
    const translation = textData.find(t => t.lang === lang);
    return translation ? translation.value : textData[0]?.value || 'Teks Tidak Tersedia';
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } },
};

const ENTRIES_PER_PAGE = 8;

const CultureEntriesPage = () => {
    const { topicId } = useParams();
    const [topic, setTopic] = useState(null);
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    
    // ✅ 2. Tambahkan state untuk search term
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [topicResponse, entriesResponse] = await Promise.all([
                    getCultureTopicById(topicId),
                    getEntriesByCultureTopic(topicId)
                ]);
                setTopic(topicResponse.data);
                setEntries(entriesResponse.data || []);
            } catch (err) {
                setError('Gagal memuat data. Pastikan Anda memiliki koneksi internet dan coba lagi.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [topicId]);

    // ✅ 3. Logika untuk memfilter entri berdasarkan search term
    const filteredEntries = entries.filter(entry =>
        getLocalizedText(entry.title, 'id').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ✅ 4. Ubah kalkulasi pagination agar berdasarkan `filteredEntries`
    const indexOfLastItem = currentPage * ENTRIES_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ENTRIES_PER_PAGE;
    const currentEntries = filteredEntries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredEntries.length / ENTRIES_PER_PAGE);

    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><LoadingIndicator /></div>;
    }

    if (error) {
        return <p className="text-center text-red-500 mt-10">{error}</p>;
    }

    const topicName = topic ? getLocalizedText(topic.name) : 'Memuat...';

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* ✅ 5. Layout header baru dengan flexbox */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <nav className="text-sm text-text-secondary mb-1">
                        <Link to="/kamus-budaya" className="hover:underline">Kamus Budaya</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="font-semibold text-text">{topicName}</span>
                    </nav>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text">{topicName}</h1>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Cari entri..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border rounded-lg bg-background-secondary"
                        />
                    </div>
                    <Link
                        to="/kamus-budaya"
                        className="bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm border border-gray-300 dark:border-gray-600 flex-shrink-0"
                    >
                        Kembali
                    </Link>
                </div>
            </div>

            {filteredEntries.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-xl text-gray-500">
                        {searchTerm ? `Entri dengan nama "${searchTerm}" tidak ditemukan.` : "Belum ada entri budaya di topik ini."}
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
                        {currentEntries.map(entry => (
                           // ... (kode kartu tidak berubah)
                           <motion.div key={entry._id} variants={cardVariants}>
                               <Link
                                   to={`/kamus-budaya/${topicId}/entry/${entry._id}`}
                                   className="flex flex-col h-full bg-background-secondary rounded-xl shadow-md overflow-hidden group hover:shadow-lg transition-shadow duration-300"
                               >
                                   <div className="relative h-48 w-full overflow-hidden">
                                       <img
                                           src={`/public/${entry.imagePath.replace(/\\/g, '/').replace('public/', '')}`}
                                           alt={getLocalizedText(entry.title)}
                                           className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                       />
                                   </div>
                                   <div className="p-4 flex-grow flex flex-col">
                                       <h3 className="font-bold text-lg text-text truncate group-hover:text-primary transition-colors">
                                           {getLocalizedText(entry.title)}
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
                            totalItems={filteredEntries.length}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default CultureEntriesPage;