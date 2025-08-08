import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getCultureEntryById } from '../services/cultureService';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import ReactPlayer from 'react-player';

const getLocalizedText = (textData, lang = 'id') => {
    if (!textData || !Array.isArray(textData)) return '';
    const translation = textData.find(t => t.lang === lang);
    return translation ? translation.value : textData[0]?.value || '';
};

// ✅ 1. Komponen Modal Gambar
const ImageModal = ({ isOpen, onClose, imageUrl, altText }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div className="relative max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img src={imageUrl} alt={altText} className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" />
                <button 
                    onClick={onClose}
                    className="absolute top-0 right-0 -mt-4 -mr-4 text-white bg-gray-800 rounded-full p-1 w-8 h-8 flex items-center justify-center text-xl leading-none hover:bg-gray-700 focus:outline-none"
                    aria-label="Tutup"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

const CultureEntryDetailPage = () => {
    const { topicId, entryId } = useParams();
    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ✅ 2. State untuk mengontrol modal
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await getCultureEntryById(topicId, entryId);
                setEntry(response.data);
            } catch (err) {
                setError('Gagal memuat data entri budaya. Halaman mungkin tidak ada atau terjadi kesalahan server.');
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [topicId, entryId]);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen"><LoadingIndicator /></div>;
    }

    if (error) {
        return <p className="text-center text-red-500 mt-10">{error}</p>;
    }

    if (!entry) {
        return <p className="text-center text-xl text-gray-500 mt-10">Entri budaya tidak ditemukan.</p>;
    }

    const title = getLocalizedText(entry.title);
    const description = getLocalizedText(entry.description);
    const isYouTubeLink = entry.videoUrl && (entry.videoUrl.includes('youtube.com') || entry.videoUrl.includes('youtu.be'));
    const imageUrl = `http://localhost:5000/${entry.imagePath.replace(/\\/g, '/').replace('public/', '')}`;

    return (
        <>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                        <nav className="text-sm text-text-secondary truncate">
                            <Link to="/kamus-budaya" className="hover:underline">Kamus Budaya</Link>
                            {entry.cultureTopic?._id && (
                                <>
                                    <span className="mx-2">/</span>
                                    <Link to={`/kamus-budaya/${entry.cultureTopic._id}`} className="hover:underline">
                                        {getLocalizedText(entry.cultureTopic.name)}
                                    </Link>
                                </>
                            )}
                        </nav>
                        <Link 
                            to={`/kamus-budaya/${topicId}`}
                            className="bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 self-end sm:self-auto"
                        >
                            Kembali
                        </Link>
                    </div>

                    <article>
                        <h1 className="text-3xl sm:text-4xl font-bold text-text mb-6 break-words">{title}</h1>
                        
                        {/* ✅ 3. Tambahkan onClick dan cursor-pointer */}
                        <div 
                            className="my-6 w-full max-h-[250px] sm:max-h-[500px] aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer group"
                            onClick={() => setIsImageModalOpen(true)}
                        >
                            <img 
                                src={imageUrl} 
                                alt={title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                        </div>

                        <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed">
                            {description.split('\n').map((paragraph, index) => (
                                <p key={index} className="mb-4">{paragraph}</p>
                            ))}
                        </div>

                        {entry.videoUrl && (
                            <div className="mt-8">
                                <h2 className="text-2xl sm:text-3xl font-bold text-text mb-4">Video Terkait</h2>
                                <div className="w-full max-h-[250px] sm:max-h-[500px] aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                                    {isYouTubeLink ? (
                                        <ReactPlayer url={entry.videoUrl} width="100%" height="100%" controls />
                                    ) : (
                                        <video 
                                            src={`http://localhost:5000/${entry.videoUrl.replace(/\\/g, '/').replace('public/', '')}`} 
                                            controls 
                                            className="w-full h-full object-cover"
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </article>
                </div>
            </div>
            
            {/* ✅ 4. Render komponen modal */}
            <ImageModal 
                isOpen={isImageModalOpen}
                onClose={() => setIsImageModalOpen(false)}
                imageUrl={imageUrl}
                altText={title}
            />
        </>
    );
};

export default CultureEntryDetailPage;