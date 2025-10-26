import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen internal untuk ikon 'Close' (X)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

/**
 * Fungsi helper untuk membuat objek section topik baru.
 * @returns {object} Objek section topik baru.
 */
const createNewTopicSection = () => ({
    id: Date.now() + Math.random(), // ID unik sementara
    topicNames: { id: '', su: '', en: '' },
    imageFile: null,
    imagePreview: null,
    status: 'Published',
    errors: {},
});

/**
 * Komponen modal untuk menambah atau mengedit data topik.
 * @param {boolean} isOpen - Status modal (terbuka/tertutup).
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {function} onSubmit - Fungsi yang dipanggil saat form disubmit.
 * @param {string} mode - Mode modal ('add' atau 'edit').
 * @param {object} initialData - Data topik (digunakan saat mode 'edit').
 */
const TopicFormModal = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
    // State untuk menyimpan daftar section topik (bisa > 1 saat 'add')
    const [topics, setTopics] = useState([createNewTopicSection()]);

    // Efek untuk inisialisasi form saat modal dibuka
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                // Mode 'edit': isi form dengan data yang ada
                const names = { id: '', su: '', en: '' };
                const namesArray = initialData.allTopicNames || initialData.topicName || [];
                namesArray.forEach(item => {
                    if (names.hasOwnProperty(item.lang)) {
                        names[item.lang] = item.value;
                    }
                });
                setTopics([{
                    id: initialData._id,
                    topicNames: names,
                    imageFile: null,
                    imagePreview: initialData.topicImagePath ? `http://localhost:5000${initialData.topicImagePath}` : null,
                    status: initialData.status || 'Published',
                    errors: {},
                }]);
            } else {
                // Mode 'add': reset form
                setTopics([createNewTopicSection()]);
            }
        } else {
            // Cleanup: Hapus URL blob preview saat modal ditutup
            topics.forEach(topic => {
                if (topic.imagePreview && topic.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(topic.imagePreview);
                }
            });
        }
    }, [isOpen, mode, initialData]);

    // Fungsi untuk menambah section form topik baru (hanya di mode 'add')
    const handleAddTopicSection = () => setTopics(prev => [...prev, createNewTopicSection()]);

    // Fungsi untuk menghapus section form topik (hanya di mode 'add')
    const handleRemoveTopicSection = (topicId) => setTopics(prev => prev.filter(topic => topic.id !== topicId));

    /**
     * Handler untuk memperbarui data pada section topik tertentu.
     * @param {string|number} topicId - ID unik section topik.
     * @param {string} field - Nama field (cth: 'topicNames', 'status').
     * @param {*} value - Nilai baru.
     * @param {string|null} [subField=null] - Sub-field jika field adalah objek (cth: 'id' untuk 'topicNames').
     */
    const handleFieldChange = (topicId, field, value, subField = null) => {
        setTopics(prevTopics => 
            prevTopics.map(topic => {
                if (topic.id === topicId) {
                    const updatedTopic = { ...topic };
                    const newErrors = { ...topic.errors };
                    if (subField) {
                        // Update sub-field (cth: topicNames.id)
                        updatedTopic[field] = { ...topic[field], [subField]: value };
                        // Hapus error jika field wajib (nama ID) diisi
                        if (field === 'topicNames' && subField === 'id' && value.trim() !== '') {
                            delete newErrors.topicNames;
                        }
                    } else {
                        // Update field biasa (cth: status)
                        updatedTopic[field] = value;
                    }
                    return { ...updatedTopic, errors: newErrors };
                }
                return topic;
            })
        );
    };
    
    /**
     * Handler untuk memperbarui file gambar dan preview-nya.
     * @param {string|number} topicId - ID unik section topik.
     * @param {Event} e - Event dari input file.
     */
    const handleImageChange = (topicId, e) => {
        const file = e.target.files[0];
        if (file) {
            setTopics(prevTopics => 
                prevTopics.map(topic => {
                    if (topic.id === topicId) {
                        const newErrors = { ...topic.errors };
                        delete newErrors.imageFile; // Hapus error gambar
                        // Hapus blob preview lama jika ada
                        if (topic.imagePreview && topic.imagePreview.startsWith('blob:')) {
                            URL.revokeObjectURL(topic.imagePreview);
                        }
                        // Set file baru dan buat blob preview baru
                        return { ...topic, imageFile: file, imagePreview: URL.createObjectURL(file), errors: newErrors };
                    }
                    return topic;
                })
            );
        }
    };

    /**
     * Fungsi untuk memvalidasi semua section topik sebelum submit.
     * @returns {boolean} True jika semua valid, false jika ada error.
     */
    const validateAllTopics = () => {
        let allSectionsAreValid = true;
        const validatedTopics = topics.map(topic => {
            const newErrors = {};
            // Validasi nama topik (Indonesia)
            if (!topic.topicNames.id.trim()) {
                newErrors.topicNames = 'Nama topik (Indonesia) wajib diisi.';
                allSectionsAreValid = false;
            }
            // Validasi gambar (hanya wajib di mode 'add')
            if (mode === 'add' && !topic.imageFile) {
                newErrors.imageFile = 'Gambar wajib diunggah.';
                allSectionsAreValid = false;
            }
            return { ...topic, errors: newErrors };
        });
        setTopics(validatedTopics);
        return allSectionsAreValid;
    };

    /**
     * Handler utama untuk submit form.
     * @param {Event} e - Event form submit.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateAllTopics()) return; // Hentikan jika validasi gagal

        // Cek jika ada bahasa yang kosong
        const hasEmptyLanguages = topics.some(topic => !topic.topicNames.su.trim() || !topic.topicNames.en.trim());

        if (hasEmptyLanguages) {
            // Tampilkan dialog konfirmasi (idealnya diganti modal kustom)
            const proceed = true; // Asumsikan 'OK' karena window.confirm dihapus
            if (!proceed) {
                return; // Batalkan submit jika pengguna menekan 'Cancel'
            }
        }

        // Ubah data state menjadi array FormData
        const allFormData = topics.map(topic => {
            const formData = new FormData();
            // Konversi objek nama menjadi array JSON string
            const topicNamesArray = Object.keys(topic.topicNames)
                .filter(lang => topic.topicNames[lang]) // Hanya kirim bahasa yang diisi
                .map(lang => ({ lang, value: topic.topicNames[lang] }));
            
            formData.append('topicNames', JSON.stringify(topicNamesArray));
            formData.append('status', topic.status);
            if (topic.imageFile) formData.append('topicImage', topic.imageFile);
            if (mode === 'edit') formData.append('topicId', topic.id);
            
            return formData;
        });
        
        onSubmit(allFormData); // Kirim array FormData ke parent
    };

    // Tentukan apakah modal bisa dirender
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
                                <h2 className="text-xl font-bold text-text">{mode === 'edit' ? 'Edit Topik' : 'Tambah Topik'}</h2>
                                <button typeM="button" onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon /></button>
                            </header>
                            
                            {/* Main content (scrollable) */}
                            <main className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
                                {topics.map((topic, index) => (
                                    <div key={topic.id} className="p-4 bg-background rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 relative">
                                        {/* Tombol Hapus Section (hanya di mode 'add' > 1) */}
                                        {topics.length > 1 && mode === 'add' && (
                                            <button type="button" onClick={() => handleRemoveTopicSection(topic.id)}
                                                className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}
                                        <p className="font-bold text-text">Topik #{index + 1}</p>
                                        
                                        {/* Input Nama Topik (Multi-bahasa) */}
                                        <div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">Indonesia</label>
                                                    <input type="text" placeholder="Nama Topik..." value={topic.topicNames.id} onChange={(e) => handleFieldChange(topic.id, 'topicNames', e.target.value, 'id')} className={`w-full px-3 py-2 border rounded-lg bg-background text-text ${topic.errors.topicNames ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">Sunda</label>
                                                    <input type="text" placeholder="Ngaran Topik..." value={topic.topicNames.su} onChange={(e) => handleFieldChange(topic.id, 'topicNames', e.target.value, 'su')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text"/>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-text-secondary mb-1">Inggris</label>
                                                    <input type="text" placeholder="Topic Name..." value={topic.topicNames.en} onChange={(e) => handleFieldChange(topic.id, 'topicNames', e.target.value, 'en')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text"/>
                                                </div>
                                            </div>
                                            {topic.errors.topicNames && <p className="text-red-500 text-xs mt-1">{topic.errors.topicNames}</p>}
                                        </div>
                                        
                                        {/* Input Gambar dan Status */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                            <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Gambar</label>
                                                {topic.imagePreview && (
                                                    <div className="mt-2 mb-2"><img src={topic.imagePreview} alt="Pratinjau" className="w-20 h-20 object-cover rounded-lg" /></div>
                                                )}
                                                {/* Input file kustom */}
                                                <div className="relative">
                                                    <input 
                                                        type="file" 
                                                        accept="image/*" 
                                                        onChange={(e) => handleImageChange(topic.id, e)}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        id={`file-input-${topic.id}`}
                                                    />
                                                    <div className="flex items-center justify-between w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {topic.imageFile ? topic.imageFile.name : 'Tidak ada berkas yang dipilih'}
                                                        </span>
                                                        <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                                                            Pilih berkas
                                                        </span>
                                                    </div>
                                                </div>
                                                {topic.errors.imageFile && <p className="text-red-500 text-xs mt-1">{topic.errors.imageFile}</p>}
                                            </div>
                                            {/* Input Status (Saat ini disembunyikan/dihapus) */}
                                            {/* <div>
                                                <label className="block text-sm font-medium text-text-secondary mb-1">Status</label>
                                                <select value={topic.status} onChange={(e) => handleFieldChange(topic.id, 'status', e.target.value)} className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-background text-text">
                                                    <option value="Published">Published</option>
                                                    <option value="Draft">Draft</option>
                                                </select>
                                            </div> */}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Tombol Tambah Section (hanya mode 'add') */}
                                {mode === 'add' && (
                                    <button
                                        type="button"
                                        onClick={handleAddTopicSection}
                                        className="w-full mt-4 px-4 py-2 border-2 border-dashed border-primary/50 text-primary text-sm font-semibold rounded-lg hover:bg-primary/10">
                                        + Tambah Section Topik Baru
                                    </button>
                                )}
                            </main>
                            
                            {/* Tombol Submit Utama */}
                            <footer className="flex-shrink-0 p-4 bg-background rounded-b-2xl border-t border-background">
                                <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90">
                                    {mode === 'edit' ? 'Simpan Perubahan' : `Tambah ${topics.length} Topik`}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default TopicFormModal;