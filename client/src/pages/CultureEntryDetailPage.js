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

// ✅ Fungsi untuk mengecek apakah URL adalah YouTube
const isYouTubeURL = (url) => {
    if (!url || typeof url !== 'string') return false;
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube.com/embed');
};

// ✅ Fungsi untuk mendapatkan URL video yang benar
const getVideoUrl = (videoUrl) => {
    if (!videoUrl) return null;
    
    // Jika sudah berupa URL YouTube/external, return langsung
    if (isYouTubeURL(videoUrl) || videoUrl.startsWith('http')) {
        return videoUrl;
    }
    
    // Jika berupa path lokal, buat URL lengkap
    return `http://10.10.48.38:5000/${videoUrl.replace(/\\/g, '/').replace('public/', '')}`;
};

// ✅ 1. Komponen Modal Gambar
const ImageModal = ({ isOpen, onClose, imageUrl, altText }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4"
            onClick={handleBackdropClick}
        >
            <div className="relative max-w-5xl max-h-[90vh]">
                <img 
                    src={imageUrl} 
                    alt={altText} 
                    className="w-auto h-auto max-w-full max-h-full object-contain rounded-lg" 
                />
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
    // ✅ Pastikan useParams digunakan dengan benar
    const params = useParams();
    const topicId = params.topicId;
    const entryId = params.entryId;
    
    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ✅ 2. State untuk mengontrol modal
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true);
                const response = await getCultureEntryById(topicId, entryId);
                console.log('Entry data:', response.data); // Debug log
                setEntry(response.data);
                setError(null);
            } catch (err) {
                setError('Gagal memuat data entri budaya. Halaman mungkin tidak ada atau terjadi kesalahan server.');
                console.error('Error fetching culture entry:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        if (topicId && entryId) {
            fetchData();
        }
    }, [topicId, entryId]);

    // Handle modal close with escape key
    useEffect(() => {
        const handleEscapeKey = (event) => {
            if (event.key === 'Escape' && isImageModalOpen) {
                setIsImageModalOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscapeKey);
        return () => document.removeEventListener('keydown', handleEscapeKey);
    }, [isImageModalOpen]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-red-500 text-lg mb-4">{error}</p>
                    <Link 
                        to="/kamus-budaya" 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
                    >
                        Kembali ke Kamus Budaya
                    </Link>
                </div>
            </div>
        );
    }

    if (!entry) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <p className="text-xl text-gray-500 mb-4">Entri budaya tidak ditemukan.</p>
                    <Link 
                        to="/kamus-budaya" 
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg inline-block"
                    >
                        Kembali ke Kamus Budaya
                    </Link>
                </div>
            </div>
        );
    }

    const title = getLocalizedText(entry.title);
    const description = getLocalizedText(entry.description);
    
    // ✅ Perbaikan logika video URL
    const videoUrl = getVideoUrl(entry.videoUrl);
    const isYouTube = isYouTubeURL(entry.videoUrl);
    
    console.log('Video URL from entry:', entry.videoUrl); // Debug log
    console.log('Processed video URL:', videoUrl); // Debug log
    console.log('Is YouTube:', isYouTube); // Debug log
    
    const imageUrl = entry.imagePath ? 
        `http://10.10.48.38:5000/${entry.imagePath.replace(/\\/g, '/').replace('public/', '')}` 
        : null;

    return (
        <>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center mb-4 gap-4">
                        <nav className="text-sm text-gray-600 dark:text-gray-400 truncate">
                            <Link to="/kamus-budaya" className="hover:underline">
                                Kamus Budaya
                            </Link>
                            {entry.cultureTopic?._id && (
                                <>
                                    <span className="mx-2">/</span>
                                    <Link 
                                        to={`/kamus-budaya/${entry.cultureTopic._id}`} 
                                        className="hover:underline"
                                    >
                                        {getLocalizedText(entry.cultureTopic.name)}
                                    </Link>
                                </>
                            )}
                        </nav>
                        <Link 
                            to={`/kamus-budaya/${topicId}`}
                            className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700 self-end sm:self-auto"
                        >
                            Kembali
                        </Link>
                    </div>

                    <article>
                        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-6 break-words">
                            {title}
                        </h1>
                        
                        {/* ✅ 3. Gambar dengan modal - hanya render jika imageUrl ada */}
                        {imageUrl && (
                            <div 
                                className="my-6 w-full max-h-[250px] sm:max-h-[500px] aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg cursor-pointer group"
                                onClick={() => setIsImageModalOpen(true)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        setIsImageModalOpen(true);
                                    }
                                }}
                                aria-label="Klik untuk memperbesar gambar"
                            >
                                <img 
                                    src={imageUrl} 
                                    alt={title}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            </div>
                        )}

                        <div className="prose dark:prose-invert max-w-none text-base sm:text-lg leading-relaxed">
                            {description && description.split('\n').map((paragraph, index) => (
                                paragraph.trim() && (
                                    <p key={index} className="mb-4 text-gray-800 dark:text-gray-200">
                                        {paragraph}
                                    </p>
                                )
                            ))}
                        </div>

                        {/* ✅ Perbaikan section video */}
                        {videoUrl && (
                            <div className="mt-8">
                                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                                    Video Terkait
                                </h2>
                                <div className="w-full aspect-video bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                                    {isYouTube ? (
                                        <ReactPlayer 
                                            url={videoUrl} 
                                            width="100%" 
                                            height="100%" 
                                            controls 
                                            playing={false}
                                            config={{
                                                youtube: {
                                                    playerVars: { 
                                                        showinfo: 1,
                                                        controls: 1,
                                                        modestbranding: 1,
                                                        rel: 0
                                                    }
                                                }
                                            }}
                                        />
                                    ) : (
                                        <video 
                                            src={videoUrl} 
                                            controls 
                                            className="w-full h-full object-cover"
                                            preload="metadata"
                                        >
                                            Browser Anda tidak mendukung video player.
                                        </video>
                                    )}
                                </div>
                                {/* Debug info - hapus setelah selesai debugging */}
                                <div className="mt-2 text-xs text-gray-500">
                                    <p>Original URL: {entry.videoUrl}</p>
                                    <p>Processed URL: {videoUrl}</p>
                                    <p>Is YouTube: {isYouTube ? 'Yes' : 'No'}</p>
                                </div>
                            </div>
                        )}
                    </article>
                </div>
            </div>
            
            {/* ✅ 4. Render komponen modal - hanya jika imageUrl ada */}
            {imageUrl && (
                <ImageModal 
                    isOpen={isImageModalOpen}
                    onClose={() => setIsImageModalOpen(false)}
                    imageUrl={imageUrl}
                    altText={title}
                />
            )}
        </>
    );
};

export default CultureEntryDetailPage;