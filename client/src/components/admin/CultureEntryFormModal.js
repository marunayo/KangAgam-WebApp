import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

const createNewEntrySection = () => ({
    id: Date.now() + Math.random(),
    title: { id: '', su: '', en: '' },
    description: { id: '', su: '', en: '' },
    imageFile: null,
    videoFile: null,
    videoUrl: '',
    videoInputType: 'file',
    imagePreview: null,
    errors: {}
});

const CultureEntryFormModal = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
    const [entries, setEntries] = useState([createNewEntrySection()]);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                const title = { id: '', su: '', en: '' };
                const description = { id: '', su: '', en: '' };
                initialData.title.forEach(t => { if (title.hasOwnProperty(t.lang)) title[t.lang] = t.value; });
                initialData.description.forEach(d => { if (description.hasOwnProperty(d.lang)) description[d.lang] = d.value; });
                
                const isYouTubeLink = initialData.videoUrl && (initialData.videoUrl.includes('youtube.com') || initialData.videoUrl.includes('youtu.be'));

                // Fix image path for preview
                let imagePreview = null;
                if (initialData.imagePath) {
                    const correctedPath = initialData.imagePath.replace(/\\/g, '/').replace('public/', '');
                    imagePreview = `http://10.10.48.38:5000/${correctedPath}`;
                }

                setEntries([{
                    id: initialData._id,
                    title,
                    description,
                    imageFile: null,
                    videoFile: null,
                    videoUrl: isYouTubeLink ? initialData.videoUrl : '',
                    videoInputType: isYouTubeLink ? 'url' : 'file',
                    imagePreview: imagePreview,
                    errors: {}
                }]);
            } else {
                setEntries([createNewEntrySection()]);
            }
        } else {
            // Cleanup blob URLs when modal closes
            entries.forEach(entry => {
                if (entry.imagePreview && entry.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(entry.imagePreview);
                }
            });
        }
    }, [isOpen, mode, initialData]);

    const handleFieldChange = (id, field, value, subField) => {
        setEntries(prev => prev.map(entry => {
            if (entry.id === id) {
                const newEntry = { ...entry };
                if (subField) {
                    newEntry[field] = { ...entry[field], [subField]: value };
                } else {
                    newEntry[field] = value;
                }
                // Clear related errors when field is updated
                const newErrors = { ...newEntry.errors };
                if (field === 'title' && subField === 'id') delete newErrors.title;
                if (field === 'description' && subField === 'id') delete newErrors.description;
                if (field === 'videoUrl') delete newErrors.video;
                newEntry.errors = newErrors;
                return newEntry;
            }
            return entry;
        }));
    };

    const handleFileChange = (id, fileType, e) => {
        const file = e.target.files[0];
        if (file) {
            setEntries(prev => prev.map(entry => {
                if (entry.id === id) {
                    const newEntry = { ...entry, [`${fileType}File`]: file };
                    const newErrors = { ...entry.errors };
                    
                    if (fileType === 'image') {
                        // Cleanup previous blob URL
                        if (entry.imagePreview && entry.imagePreview.startsWith('blob:')) {
                            URL.revokeObjectURL(entry.imagePreview);
                        }
                        newEntry.imagePreview = URL.createObjectURL(file);
                        delete newErrors.image;
                    }
                    
                    if (fileType === 'video') {
                        delete newErrors.video;
                    }
                    
                    newEntry.errors = newErrors;
                    return newEntry;
                }
                return entry;
            }));
        }
    };

    const addSection = () => setEntries(prev => [...prev, createNewEntrySection()]);
    
    const removeSection = (id) => {
        setEntries(prev => {
            const entryToRemove = prev.find(entry => entry.id === id);
            if (entryToRemove?.imagePreview && entryToRemove.imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(entryToRemove.imagePreview);
            }
            return prev.filter(entry => entry.id !== id);
        });
    };

    const validateAllEntries = () => {
        let allIsValid = true;
        const validatedEntries = entries.map(entry => {
            const newErrors = {};
            
            if (!entry.title.id.trim()) {
                newErrors.title = 'Judul (Indonesia) wajib diisi.';
                allIsValid = false;
            }
            
            if (!entry.description.id.trim()) {
                newErrors.description = 'Deskripsi (Indonesia) wajib diisi.';
                allIsValid = false;
            }
            
            if (mode === 'add' && !entry.imageFile) {
                newErrors.image = 'Gambar wajib diunggah.';
                allIsValid = false;
            }
            
            if (entry.videoInputType === 'file' && !entry.videoFile && mode === 'add') {
                newErrors.video = 'Berkas video wajib diunggah.';
                allIsValid = false;
            }
            
            if (entry.videoInputType === 'url' && !entry.videoUrl.trim()) {
                newErrors.video = 'Link URL video wajib diisi.';
                allIsValid = false;
            }
            
            return { ...entry, errors: newErrors };
        });
        
        setEntries(validatedEntries);
        return allIsValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateAllEntries()) return;

        const allFormData = entries.map(entry => {
            const formData = new FormData();
            const titleArray = Object.keys(entry.title).filter(lang => entry.title[lang]).map(lang => ({ lang, value: entry.title[lang] }));
            const descArray = Object.keys(entry.description).filter(lang => entry.description[lang]).map(lang => ({ lang, value: entry.description[lang] }));
            
            const entryData = { 
                title: titleArray, 
                description: descArray,
                videoUrl: entry.videoInputType === 'url' ? entry.videoUrl : undefined
            };
            formData.append('entryData', JSON.stringify(entryData));

            if (entry.imageFile) formData.append('entryImage', entry.imageFile);
            if (entry.videoInputType === 'file' && entry.videoFile) {
                formData.append('entryVideo', entry.videoFile);
            }
            
            return formData;
        });
        
        onSubmit(allFormData);
    };

    const languageNames = { id: 'Indonesia', su: 'Sunda', en: 'Inggris' };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
                    onClick={onClose}
                >
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} 
                        animate={{ scale: 1, opacity: 1 }} 
                        exit={{ scale: 0.9, opacity: 0 }} 
                        className="bg-background-secondary rounded-2xl shadow-xl w-full max-w-4xl flex flex-col" 
                        onClick={e => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-background">
                                <h2 className="text-xl font-bold text-text">{mode === 'edit' ? 'Edit Entri Budaya' : 'Tambah Entri Budaya'}</h2>
                                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-background">
                                    <CloseIcon />
                                </button>
                            </header>
                            
                            <main className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
                                {entries.map((entry, index) => (
                                    <div key={entry.id} className="p-4 bg-background rounded-xl border border-gray-200 dark:border-gray-700 relative space-y-4">
                                        {entries.length > 1 && mode === 'add' && (
                                            <button 
                                                type="button" 
                                                onClick={() => removeSection(entry.id)} 
                                                className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}
                                        
                                        <p className="font-bold text-text">Entri #{index + 1}</p>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Title Section */}
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-text-secondary">Judul</label>
                                                {Object.entries(languageNames).map(([langCode, langName]) => (
                                                    <input 
                                                        key={langCode}
                                                        type="text" 
                                                        placeholder={langName} 
                                                        value={entry.title[langCode]} 
                                                        onChange={e => handleFieldChange(entry.id, 'title', e.target.value, langCode)} 
                                                        className={`w-full px-4 py-2 border rounded-lg bg-background text-text ${entry.errors.title && langCode === 'id' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`} 
                                                    />
                                                ))}
                                                {entry.errors.title && <p className="text-red-500 text-xs">{entry.errors.title}</p>}
                                            </div>
                                            
                                            {/* Description Section */}
                                            <div className="space-y-3">
                                                <label className="block text-sm font-medium text-text-secondary">Deskripsi</label>
                                                {Object.entries(languageNames).map(([langCode, langName]) => (
                                                    <textarea 
                                                        key={langCode}
                                                        placeholder={langName} 
                                                        value={entry.description[langCode]} 
                                                        onChange={e => handleFieldChange(entry.id, 'description', e.target.value, langCode)} 
                                                        className={`w-full px-4 py-2 border rounded-lg bg-background text-text h-20 resize-none ${entry.errors.description && langCode === 'id' ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                                                    />
                                                ))}
                                                {entry.errors.description && <p className="text-red-500 text-xs">{entry.errors.description}</p>}
                                            </div>
                                        </div>
                                        
                                        <hr className="border-background"/>
                                        
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Image Section */}
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                                    Gambar {mode === 'edit' && '(Opsional)'}
                                                </label>
                                                {entry.imagePreview && (
                                                    <div className="mb-3">
                                                        <img 
                                                            src={entry.imagePreview} 
                                                            alt="Preview" 
                                                            className="w-32 h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700" 
                                                        />
                                                    </div>
                                                )}
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={e => handleFileChange(entry.id, 'image', e)} 
                                                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" 
                                                />
                                                {entry.errors.image && <p className="text-red-500 text-xs mt-1">{entry.errors.image}</p>}
                                            </div>
                                            
                                            {/* Video Section */}
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-2">Video</label>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleFieldChange(entry.id, 'videoInputType', 'file')} 
                                                        className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${entry.videoInputType === 'file' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                                    >
                                                        Unggah File
                                                    </button>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleFieldChange(entry.id, 'videoInputType', 'url')} 
                                                        className={`px-3 py-1.5 text-sm rounded-full font-medium transition-colors ${entry.videoInputType === 'url' ? 'bg-primary text-white' : 'bg-gray-200 dark:bg-gray-700 text-text-secondary hover:bg-gray-300 dark:hover:bg-gray-600'}`}
                                                    >
                                                        Link URL
                                                    </button>
                                                </div>
                                                {entry.videoInputType === 'file' ? (
                                                    <input 
                                                        type="file" 
                                                        accept="video/*" 
                                                        onChange={e => handleFileChange(entry.id, 'video', e)} 
                                                        className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/10 file:text-blue-600 hover:file:bg-blue-500/20" 
                                                    />
                                                ) : (
                                                    <input 
                                                        type="url" 
                                                        placeholder="https://www.youtube.com/watch?v=..." 
                                                        value={entry.videoUrl} 
                                                        onChange={e => handleFieldChange(entry.id, 'videoUrl', e.target.value)} 
                                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text" 
                                                    />
                                                )}
                                                {entry.errors.video && <p className="text-red-500 text-xs mt-1">{entry.errors.video}</p>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                
                                {mode === 'add' && (
                                    <button 
                                        type="button" 
                                        onClick={addSection} 
                                        className="w-full mt-4 px-4 py-3 border-2 border-dashed border-primary/50 text-primary text-sm font-semibold rounded-lg hover:bg-primary/10 transition-colors"
                                    >
                                        + Tambah Section Entri Baru
                                    </button>
                                )}
                            </main>
                            
                            <footer className="flex-shrink-0 p-4 bg-background rounded-b-2xl border-t border-background">
                                <button 
                                    type="submit" 
                                    className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90 transition-opacity"
                                >
                                    {mode === 'edit' ? 'Simpan Perubahan' : `Tambah ${entries.length} Entri`}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CultureEntryFormModal;