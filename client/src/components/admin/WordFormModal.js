import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Komponen internal untuk ikon 'Close' (X)
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Komponen internal untuk ikon 'Play'
const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
);

/**
 * Fungsi helper untuk membuat objek section entri kosakata baru.
 * @returns {object} Objek section entri baru.
 */
const createNewEntrySection = () => ({
    id: Date.now() + Math.random(), // ID unik sementara
    entryImage: null,
    imagePreview: null,
    vocabularies: [ // Struktur default untuk 3 bahasa
        { languageCode: 'id', vocab: '', audioFile: null },
        { languageCode: 'su', vocab: '', audioFile: null },
        { languageCode: 'en', vocab: '', audioFile: null },
    ],
    errors: {}, // Objek untuk menyimpan pesan error validasi
});

/**
 * Komponen modal untuk menambah atau mengedit data kosakata (word entry).
 * @param {boolean} isOpen - Status modal (terbuka/tertutup).
 * @param {function} onClose - Fungsi untuk menutup modal.
 * @param {function} onSubmit - Fungsi yang dipanggil saat form disubmit.
 * @param {string} mode - Mode modal ('add' atau 'edit').
 * @param {object} initialData - Data kosakata (digunakan saat mode 'edit').
 */
const WordFormModal = ({ isOpen, onClose, onSubmit, mode, initialData }) => {
    // State untuk menyimpan daftar section entri (bisa > 1 saat 'add')
    const [entries, setEntries] = useState([createNewEntrySection()]);
    // Ref untuk mengontrol pemutaran audio preview
    const audioPlayer = useRef(null);
    // Mapping kode bahasa ke nama lengkap
    const languageNames = { id: 'Indonesia', su: 'Sunda', en: 'Inggris' };

    // Efek untuk inisialisasi form saat modal dibuka atau data berubah
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                // Mode 'edit': isi form dengan data yang ada
                const languageOrder = ['id', 'su', 'en']; // Pastikan urutan bahasa konsisten
                // Map data kosakata yang ada ke struktur state
                const initialVocabs = languageOrder.map(langCode => {
                    const existing = initialData.entryVocabularies.find(v => v.language.languageCode === langCode);
                    return {
                        _id: existing?._id, // ID dari database (jika ada)
                        languageCode: langCode,
                        vocab: existing?.vocab || '',
                        audioFile: null, // File audio baru (diisi saat user memilih)
                        existingAudioUrl: existing?.audioUrl || null, // URL audio lama
                    };
                });
                setEntries([{
                    id: initialData._id, // ID entri utama dari database
                    entryImage: null, // File gambar baru
                    imagePreview: initialData.entryImagePath ? `http://localhost:5000${initialData.entryImagePath}` : null, // URL gambar lama
                    vocabularies: initialVocabs,
                    errors: {},
                }]);
            } else {
                // Mode 'add': reset form ke state awal
                setEntries([createNewEntrySection()]);
            }
        } else {
            // Cleanup saat modal ditutup: hentikan audio dan hapus blob URL
            if (audioPlayer.current) {
                audioPlayer.current.pause();
                audioPlayer.current = null;
            }
            entries.forEach(entry => {
                if (entry.imagePreview && entry.imagePreview.startsWith('blob:')) {
                    URL.revokeObjectURL(entry.imagePreview);
                }
            });
        }
    }, [isOpen, mode, initialData]); // Jalankan efek saat props ini berubah

    // Fungsi untuk menambah section form entri baru (hanya di mode 'add')
    const handleAddEntrySection = () => setEntries(prev => [...prev, createNewEntrySection()]);

    // Fungsi untuk menghapus section form entri (hanya di mode 'add')
    const handleRemoveEntrySection = (entryId) => setEntries(prev => prev.filter(entry => entry.id !== entryId));

    /**
     * Handler untuk memperbarui data kosakata (teks atau file audio).
     * @param {string|number} entryId - ID unik section entri.
     * @param {number} vocabIndex - Index kosakata dalam array vocabularies.
     * @param {string} field - Nama field ('vocab' atau 'audioFile').
     * @param {*} value - Nilai baru (string teks atau objek File).
     */
    const handleVocabChange = (entryId, vocabIndex, field, value) => {
        setEntries(prevEntries =>
            prevEntries.map(entry => {
                if (entry.id === entryId) {
                    const newVocabs = [...entry.vocabularies];
                    newVocabs[vocabIndex] = { ...newVocabs[vocabIndex], [field]: value };
                    
                    // Hapus pesan error individual saat pengguna mulai mengetik/memilih file
                    const newErrors = { ...entry.errors };
                    if (field === 'vocab') {
                        delete newErrors[`vocab_${vocabIndex}`];
                    } else if (field === 'audioFile') {
                        delete newErrors[`audio_${vocabIndex}`];
                    }
                    
                    return { ...entry, vocabularies: newVocabs, errors: newErrors };
                }
                return entry;
            })
        );
    };

    /**
     * Handler untuk memperbarui file gambar dan preview-nya.
     * @param {string|number} entryId - ID unik section entri.
     * @param {Event} e - Event dari input file gambar.
     */
    const handleImageChange = (entryId, e) => {
        const file = e.target.files[0];
        if (file) {
            setEntries(prevEntries =>
                prevEntries.map(entry => {
                    if (entry.id === entryId) {
                        const newErrors = { ...entry.errors };
                        delete newErrors.entryImage; // Hapus error gambar
                        // Hapus blob preview lama jika ada
                        if (entry.imagePreview && entry.imagePreview.startsWith('blob:')) {
                            URL.revokeObjectURL(entry.imagePreview);
                        }
                        // Set file baru dan buat blob preview baru
                        return { ...entry, entryImage: file, imagePreview: URL.createObjectURL(file), errors: newErrors };
                    }
                    return entry;
                })
            );
        }
    };

    /**
     * Handler untuk memutar audio preview (audio yang sudah ada di server).
     * @param {string} audioUrl - URL relatif audio.
     */
    const handlePlayAudio = (audioUrl) => {
        if (audioPlayer.current) audioPlayer.current.pause(); // Hentikan audio sebelumnya
        const newAudio = new Audio(`http://localhost:5000${audioUrl}`); // Buat objek Audio baru
        audioPlayer.current = newAudio; // Simpan di ref
        newAudio.play(); // Putar audio
    };

    /**
     * Fungsi untuk memvalidasi semua section entri sebelum submit.
     * @returns {boolean} True jika semua valid, false jika ada error.
     */
    const validateAllEntries = () => {
        let allIsValid = true;
        const validatedEntries = entries.map(entry => {
            const newErrors = {};
            
            // Validasi gambar (wajib di mode 'add')
            if (mode === 'add' && !entry.entryImage) {
                newErrors.entryImage = 'Gambar wajib diunggah.';
                allIsValid = false;
            }
            
            // Validasi minimal satu kosakata harus diisi
            const filledVocabs = entry.vocabularies.filter(v => v.vocab.trim() !== '');
            if (filledVocabs.length === 0) {
                newErrors.vocabularies = 'Minimal satu kosakata harus diisi.';
                allIsValid = false;
            }
            
            // Validasi: jika teks diisi, audio wajib; jika audio dipilih, teks wajib
            entry.vocabularies.forEach((v, index) => {
                const hasVocab = v.vocab.trim() !== '';
                const hasAudio = v.audioFile || v.existingAudioUrl; // Cek file baru atau URL lama
                
                // Hanya validasi jika salah satu (teks atau audio) ada isinya
                if (hasVocab || hasAudio) {
                    if (!hasVocab) {
                        newErrors[`vocab_${index}`] = `Teks kosakata ${languageNames[v.languageCode]} harus diisi.`;
                        allIsValid = false;
                    }
                    if (!hasAudio) {
                        newErrors[`audio_${index}`] = `Audio untuk ${languageNames[v.languageCode]} harus diisi.`;
                        allIsValid = false;
                    }
                }
            });
            
            return { ...entry, errors: newErrors };
        });
        setEntries(validatedEntries); // Update state dengan pesan error
        return allIsValid;
    };

    /**
     * Handler utama untuk submit form. Mengumpulkan data dan mengirimkannya ke parent.
     * @param {Event} e - Event form submit.
     */
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateAllEntries()) return; // Hentikan jika validasi gagal

        // Siapkan array FormData untuk dikirim (satu FormData per section entri)
        const allFormData = entries.map(entry => {
            const formData = new FormData();
            if (entry.entryImage) formData.append('entryImage', entry.entryImage); // Tambahkan file gambar jika ada

            // Filter kosakata yang diisi (punya teks atau file audio baru)
            const filledVocabs = entry.vocabularies.filter(v => v.vocab.trim() !== '' || v.audioFile);
            
            const audioFiles = []; // Array untuk menampung file audio baru
            let audioIndexCounter = 0; // Counter untuk menandai urutan file audio

            // Siapkan data JSON untuk kosakata
            const entryData = {
                entryVocabularies: filledVocabs.map(v => {
                    const vocabPayload = { 
                        _id: v._id, // Sertakan ID vocab jika mode edit
                        languageCode: v.languageCode, 
                        vocab: v.vocab 
                    };
                    // Jika ada file audio baru, tambahkan ke array audioFiles dan tandai indexnya
                    if (v.audioFile) {
                        audioFiles.push(v.audioFile);
                        vocabPayload.newAudioIndex = audioIndexCounter++; // Backend akan menggunakan index ini
                    }
                    return vocabPayload;
                })
            };
            
            // Append data JSON dan file-file audio ke FormData
            formData.append('entryData', JSON.stringify(entryData));
            audioFiles.forEach(file => formData.append('audioFiles', file)); // Backend akan menerima array 'audioFiles'
            
            // Sertakan ID entri utama jika mode edit
            if (mode === 'edit') formData.append('entryId', entry.id); 
            
            return formData;
        });

        onSubmit(allFormData); // Kirim array FormData ke parent component
    };

    // Tentukan apakah modal siap dirender
    const canRender = isOpen;

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
                        className="bg-background-secondary rounded-2xl shadow-xl w-full max-w-3xl flex flex-col" // Lebarkan modal
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <header className="flex-shrink-0 flex items-center justify-between p-4 border-b border-background">
                                <h2 className="text-xl font-bold text-text">{mode === 'edit' ? 'Edit Kosakata' : 'Tambah Kosakata'}</h2>
                                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-background"><CloseIcon /></button>
                            </header>
                            
                            {/* Main content (scrollable) */}
                            <main className="p-4 space-y-6 max-h-[75vh] overflow-y-auto">
                                {entries.map((entry, index) => (
                                    <div key={entry.id} className="p-4 bg-background rounded-xl border border-gray-200 dark:border-gray-700 space-y-4 relative">
                                        {/* Tombol Hapus Section (hanya di mode 'add' > 1) */}
                                        {entries.length > 1 && mode === 'add' && (
                                            <button type="button" onClick={() => handleRemoveEntrySection(entry.id)}
                                                className="absolute -top-3 -right-3 p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                                            </button>
                                        )}
                                        <p className="font-bold text-text">Kosakata #{index + 1}</p>
                                        
                                        {/* Input Gambar */}
                                        <div>
                                            <label className="block text-sm font-medium text-text-secondary mb-1">Gambar {mode === 'edit' && '(Opsional: Ganti gambar)'}</label>
                                            {entry.imagePreview && <div className="mt-2 mb-3"><img src={entry.imagePreview} alt="Pratinjau" className="w-24 h-24 object-cover rounded-lg" /></div>}
                                            {/* Input file kustom */}
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleImageChange(entry.id, e)}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    id={`image-input-${entry.id}`}
                                                />
                                                <div className={`flex items-center justify-between w-full px-4 py-2 border rounded-lg bg-background text-text cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                    entry.errors.entryImage ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                                }`}>
                                                    <span className="text-sm text-gray-600 dark:text-gray-400">
                                                        {entry.entryImage ? entry.entryImage.name : 'Tidak ada berkas yang dipilih'}
                                                    </span>
                                                    <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-semibold rounded-full">
                                                        Pilih berkas
                                                    </span>
                                                </div>
                                            </div>
                                            {entry.errors.entryImage && <p className="text-red-500 text-xs mt-1">{entry.errors.entryImage}</p>}
                                        </div>
                                        
                                        <hr className="border-background"/>
                                        
                                        {/* Input Kosakata dan Audio (Multi-bahasa) */}
                                        <div>
                                            {entry.errors.vocabularies && <p className="text-red-500 text-sm mb-2">{entry.errors.vocabularies}</p>}
                                            {entry.vocabularies.map((voc, vocIndex) => (
                                                <div key={voc.languageCode} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3 p-3 border border-background rounded-lg">
                                                    {/* Input Teks Kosakata */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                                            Teks Kosakata ({languageNames[voc.languageCode]})
                                                        </label>
                                                        <input 
                                                            type="text" 
                                                            value={voc.vocab} 
                                                            onChange={(e) => handleVocabChange(entry.id, vocIndex, 'vocab', e.target.value)} 
                                                            className={`w-full px-4 py-2 border rounded-lg bg-background text-text ${
                                                                entry.errors[`vocab_${vocIndex}`] 
                                                                    ? 'border-red-500 focus:border-red-500' 
                                                                    : 'border-gray-300 dark:border-gray-600'
                                                            }`}
                                                        />
                                                        {entry.errors[`vocab_${vocIndex}`] && (
                                                            <p className="text-red-500 text-xs mt-1">{entry.errors[`vocab_${vocIndex}`]}</p>
                                                        )}
                                                    </div>
                                                    {/* Input Audio */}
                                                    <div>
                                                        <label className="block text-sm font-medium text-text-secondary mb-1">
                                                            Berkas Audio {mode === 'edit' && '(Opsional: Ganti audio)'}
                                                        </label>
                                                        {/* Tampilkan info audio lama jika mode edit & belum ada file baru */}
                                                        {mode === 'edit' && voc.existingAudioUrl && !voc.audioFile && (
                                                            <div className="flex items-center justify-between text-xs text-text-secondary mt-1 mb-2 p-2 bg-background-secondary rounded-md">
                                                                <span className="truncate pr-2">Berkas: {voc.existingAudioUrl.split('/').pop()}</span>
                                                                <button type="button" onClick={() => handlePlayAudio(voc.existingAudioUrl)} className="p-1 rounded-full text-primary hover:bg-primary/10">
                                                                    <PlayIcon />
                                                                </button>
                                                            </div>
                                                        )}
                                                        {/* Input file audio kustom */}
                                                        <div className="relative">
                                                            <input 
                                                                type="file" 
                                                                accept="audio/*" 
                                                                onChange={(e) => handleVocabChange(entry.id, vocIndex, 'audioFile', e.target.files[0])}
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                id={`audio-input-${entry.id}-${vocIndex}`}
                                                            />
                                                            <div className={`flex items-center justify-between w-full px-4 py-2 border rounded-lg bg-background text-text cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                                                entry.errors[`audio_${vocIndex}`] 
                                                                    ? 'border-red-500' 
                                                                    : 'border-gray-300 dark:border-gray-600'
                                                            }`}>
                                                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                                                    {voc.audioFile ? voc.audioFile.name : 'Tidak ada berkas yang dipilih'}
                                                                </span>
                                                                <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-sm font-semibold rounded-full">
                                                                    Pilih berkas
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {entry.errors[`audio_${vocIndex}`] && (
                                                            <p className="text-red-500 text-xs mt-1">{entry.errors[`audio_${vocIndex}`]}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                {/* Tombol Tambah Section (hanya mode 'add') */}
                                {mode === 'add' && (
                                    <button
                                        type="button"
                                        onClick={handleAddEntrySection}
                                        className="w-full mt-4 px-4 py-2 border-2 border-dashed border-primary/50 text-primary text-sm font-semibold rounded-lg hover:bg-primary/10">
                                        + Tambah Section Kosakata Baru
                                    </button>
                                )}
                            </main>
                            
                            {/* Tombol Submit Utama */}
                            <footer className="flex-shrink-0 p-4 bg-background rounded-b-2xl border-t border-background">
                                <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:opacity-90">
                                    {mode === 'edit' ? 'Simpan Perubahan' : `Tambah ${entries.length} Kosakata`}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default WordFormModal;