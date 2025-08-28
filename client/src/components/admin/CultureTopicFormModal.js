import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
    </svg>
);

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
);

const createNewTopicSection = () => ({
    id: Date.now() + Math.random(),
    names: { id: '', su: '', en: '' },
    imageFile: null,
    imagePreview: null,
    status: 'published',
    errors: {}
});

const CultureTopicFormModal = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
    const [topics, setTopics] = useState([createNewTopicSection()]);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                const names = { id: '', su: '', en: '' };
                if (Array.isArray(initialData.name)) {
                    initialData.name.forEach(item => {
                        if (names.hasOwnProperty(item.lang)) {
                            names[item.lang] = item.value;
                        }
                    });
                }
                
                let imagePreview = null;
                if (initialData.imagePath) {
                    const correctedPath = initialData.imagePath.replace(/\\/g, '/').replace('public/', '');
                    imagePreview = `http://10.10.48.38:5000/${correctedPath}`;
                }

                setTopics([{
                    id: initialData._id || Date.now(),
                    names,
                    imageFile: null,
                    imagePreview,
                    status: initialData.status || 'published',
                    errors: {}
                }]);
            } else {
                setTopics([createNewTopicSection()]);
            }
        } else {
            // Cleanup blob URLs when modal closes
            topics.forEach(topic => {
                if (topic.imagePreview && topic.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(topic.imagePreview);
                }
            });
        }
    }, [isOpen, mode, initialData]);

    const handleFieldChange = (topicId, field, value, subField = null) => {
        setTopics(prevTopics => 
            prevTopics.map(topic => {
                if (topic.id === topicId) {
                    const updatedTopic = { ...topic };
                    const newErrors = { ...topic.errors };
                    
                    if (subField) {
                        updatedTopic[field] = { ...topic[field], [subField]: value };
                        // Clear name error if Indonesian name is filled
                        if (field === 'names' && subField === 'id' && value.trim() !== '') {
                            delete newErrors.names;
                        }
                    } else {
                        updatedTopic[field] = value;
                    }
                    
                    return { ...updatedTopic, errors: newErrors };
                }
                return topic;
            })
        );
    };
    
    const handleImageChange = (topicId, e) => {
        const file = e.target.files[0];
        if (file) {
            setTopics(prevTopics => 
                prevTopics.map(topic => {
                    if (topic.id === topicId) {
                        const newErrors = { ...topic.errors };
                        delete newErrors.imageFile;
                        
                        // Cleanup previous blob URL
                        if (topic.imagePreview && topic.imagePreview.startsWith('blob:')) {
                            URL.revokeObjectURL(topic.imagePreview);
                        }
                        
                        return { 
                            ...topic, 
                            imageFile: file, 
                            imagePreview: URL.createObjectURL(file), 
                            errors: newErrors 
                        };
                    }
                    return topic;
                })
            );
        }
    };

    const addNewTopic = () => {
        setTopics(prev => [...prev, createNewTopicSection()]);
    };

    const removeTopic = (topicId) => {
        if (topics.length > 1) {
            setTopics(prev => {
                const topicToRemove = prev.find(topic => topic.id === topicId);
                if (topicToRemove?.imagePreview && topicToRemove.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(topicToRemove.imagePreview);
                }
                return prev.filter(topic => topic.id !== topicId);
            });
        }
    };

    const validateAllTopics = () => {
        let allSectionsAreValid = true;
        const validatedTopics = topics.map(topic => {
            const newErrors = {};
            
            if (!topic.names.id.trim()) {
                newErrors.names = 'Nama topik (Indonesia) wajib diisi.';
                allSectionsAreValid = false;
            }
            
            if (mode === 'add' && !topic.imageFile) {
                newErrors.imageFile = 'Gambar wajib diunggah.';
                allSectionsAreValid = false;
            }
            
            return { ...topic, errors: newErrors };
        });
        
        setTopics(validatedTopics);
        return allSectionsAreValid;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateAllTopics()) return;

        // Check if any language fields are empty
        const hasEmptyLanguages = topics.some(topic => 
            !topic.names.su.trim() || !topic.names.en.trim()
        );

        if (hasEmptyLanguages) {
            const proceed = window.confirm("Beberapa kolom bahasa (Sunda/Inggris) masih kosong. Tetap lanjutkan?");
            if (!proceed) {
                return;
            }
        }

        if (mode === 'edit') {
            // For edit mode, only send the first topic
            const topic = topics[0];
            const formData = new FormData();
            const namesArray = Object.keys(topic.names)
                .filter(lang => topic.names[lang])
                .map(lang => ({ lang, value: topic.names[lang] }));
            
            const topicData = { 
                name: namesArray,
                status: topic.status 
            };
            formData.append('topicData', JSON.stringify(topicData));

            if (topic.imageFile) {
                formData.append('topicImage', topic.imageFile);
            }
            
            onSubmit(formData);
        } else {
            // For add mode, send all topics
            const topicsData = topics.map(topic => {
                const formData = new FormData();
                const namesArray = Object.keys(topic.names)
                    .filter(lang => topic.names[lang])
                    .map(lang => ({ lang, value: topic.names[lang] }));
                
                const topicData = { 
                    name: namesArray,
                    status: topic.status 
                };
                formData.append('topicData', JSON.stringify(topicData));

                if (topic.imageFile) {
                    formData.append('topicImage', topic.imageFile);
                }
                
                return formData;
            });
            
            onSubmit(topicsData);
        }
    };

    const canRender = isOpen && (mode === 'add' || (mode === 'edit' && topics.length > 0));

    return (
        <AnimatePresence>
            {canRender && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-background-secondary rounded-2xl shadow-xl w-full max-w-2xl flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-background">
                                <h2 className="text-xl font-bold text-text">
                                    {mode === 'edit' ? 'Edit Topik Budaya' : 'Tambah Topik Budaya'}
                                </h2>
                                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-background">
                                    <CloseIcon />
                                </button>
                            </header>
                            
                            <main className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
                                {topics.map((topic, index) => (
                                    <div key={topic.id} className="p-4 bg-background rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 relative">
                                        {/* Remove button for multiple topics in add mode */}
                                        {topics.length > 1 && mode === 'add' && (
                                            <button
                                                type="button"
                                                onClick={() => removeTopic(topic.id)}
                                                className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600"
                                            >
                                                <TrashIcon />
                                            </button>
                                        )}

                                        <p className="font-bold text-text">Topik #{index + 1}</p>

                                        {/* Language inputs */}
                                        <div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">
                                                        Indonesia
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nama Topik..."
                                                        value={topic.names.id}
                                                        onChange={(e) => handleFieldChange(topic.id, 'names', e.target.value, 'id')}
                                                        className={`w-full px-3 py-2 border rounded-lg bg-background text-text ${
                                                            topic.errors.names 
                                                                ? 'border-red-500' 
                                                                : 'border-gray-300 dark:border-gray-600'
                                                        }`}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">
                                                        Sunda
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Ngaran Topik..."
                                                        value={topic.names.su}
                                                        onChange={(e) => handleFieldChange(topic.id, 'names', e.target.value, 'su')}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">
                                                        Inggris
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="Topic Name..."
                                                        value={topic.names.en}
                                                        onChange={(e) => handleFieldChange(topic.id, 'names', e.target.value, 'en')}
                                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text"
                                                    />
                                                </div>
                                            </div>
                                            {topic.errors.names && (
                                                <p className="text-red-500 text-xs mt-1">{topic.errors.names}</p>
                                            )}
                                        </div>

                                        {/* Image and Status row */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                                    Gambar {mode === 'edit' && '(Opsional)'}
                                                </label>
                                                {topic.imagePreview && (
                                                    <div className="mt-2 mb-2">
                                                        <img 
                                                            src={topic.imagePreview} 
                                                            alt="Pratinjau" 
                                                            className="w-20 h-20 object-cover rounded-lg" 
                                                        />
                                                    </div>
                                                )}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleImageChange(topic.id, e)}
                                                    className="w-full text-sm text-text-secondary file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                                />
                                                {topic.errors.imageFile && (
                                                    <p className="text-red-500 text-xs mt-1">{topic.errors.imageFile}</p>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">
                                                    Status
                                                </label>
                                                <select
                                                    value={topic.status}
                                                    onChange={(e) => handleFieldChange(topic.id, 'status', e.target.value)}
                                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text"
                                                >
                                                    <option value="published">Published</option>
                                                    <option value="draft">Draft</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Add new topic section (only in add mode) */}
                                {mode === 'add' && (
                                    <button
                                        type="button"
                                        onClick={addNewTopic}
                                        className="w-full mt-4 px-4 py-2 border-2 border-dashed border-primary/50 text-primary text-sm font-semibold rounded-lg hover:bg-primary/10 flex items-center justify-center gap-2"
                                    >
                                        <PlusIcon />
                                        Tambah Section Topik Baru
                                    </button>
                                )}
                            </main>
                            
                            <footer className="flex-shrink-0 p-4 bg-background rounded-b-2xl border-t border-background">
                                <button 
                                    type="submit" 
                                    className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90"
                                >
                                    {mode === 'edit' 
                                        ? 'Simpan Perubahan' 
                                        : `Tambah ${topics.length} Topik${topics.length > 1 ? '' : ''}`
                                    }
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default CultureTopicFormModal;