import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getCultureEntryById } from '../services/cultureService';
import LoadingIndicator from '../components/ui/LoadingIndicator';
import ReactPlayer from 'react-player';

const getLocalizedText = (textData, lang = 'id') => {
    if (!textData || !Array.isArray(textData)) return '';
    const translation = textData.find(t => t.lang === lang);
    return translation ? translation.value : textData[0]?.value || '';
};

const CultureEntryDetailPage = () => {
    const { topicId, entryId } = useParams();
    const [entry, setEntry] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Panggil dengan topicId dan entryId
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
        return <div className="flex justify-center items-center h-96"><LoadingIndicator /></div>;
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

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
                {/* ✅ 1. WRAPPER UNTUK HEADER (BREADCRUMB + TOMBOL KEMBALI) */}
                <div className="flex justify-between items-center mb-4">
                    <nav className="text-sm text-text-secondary">
                        <Link to="/kamus-budaya" className="hover:underline">Kamus Budaya</Link>
                        {entry.cultureTopic?._id && (
                            <>
                                <span className="mx-2">&gt;</span>
                                <Link to={`/kamus-budaya/${entry.cultureTopic._id}`} className="hover:underline">
                                    {getLocalizedText(entry.cultureTopic.name)}
                                </Link>
                            </>
                        )}
                    </nav>
                    {/* Tombol Kembali */}
                    <Link 
                        to={`/kamus-budaya/${topicId}`}
                        className="bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        Kembali
                    </Link>
                </div>

                <article>
                    <h1 className="text-3xl sm:text-4xl font-bold text-text mb-6">{title}</h1>
                    
                    {/* ✅ 2. KONTROL UKURAN GAMBAR */}
                    <div className="my-6 w-full max-h-[500px] aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                        <img 
                            src={`http://localhost:5000/${entry.imagePath.replace(/\\/g, '/').replace('public/', '')}`} 
                            alt={title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    <div className="prose dark:prose-invert max-w-none text-text text-lg leading-relaxed">
                        {description.split('\n').map((paragraph, index) => (
                            <p key={index}>{paragraph}</p>
                        ))}
                    </div>

                    {entry.videoUrl && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold text-text mb-4">Video Terkait</h2>
                            {/* ✅ 3. KONTROL UKURAN VIDEO */}
                            <div className="w-full max-h-[500px] aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
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
    );
};

export default CultureEntryDetailPage;