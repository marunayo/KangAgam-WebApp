import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import Pagination from '../../components/ui/Pagination'; // Komponen pagination
import WordFormModal from '../../components/admin/WordFormModal'; // Modal form tambah/edit kosakata
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'; // Modal konfirmasi hapus
import ManageWordDetailModal from '../../components/admin/ManageWordDetailModal'; // Modal detail kosakata (mobile)
import ImageModal from '../../components/admin/ImageModal'; // Modal pratinjau gambar
import AudioPlayerModal from '../../components/admin/AudioPlayerModal'; // Modal pemutar audio
import StatusModal from '../../components/admin/StatusModal'; // Modal notifikasi status
import { getEntriesByTopicId, addEntry, updateEntry, deleteEntry } from '../../services/entryService'; // Service API entri/kosakata
import { getTopicById } from '../../services/topicService'; // Service API topik (untuk nama)
import { useAuth } from '../../context/AuthContext'; // Hook otentikasi
import LoadingIndicator from '../../components/ui/LoadingIndicator'; // Indikator loading

// Konstanta jumlah item per halaman
const ITEMS_PER_PAGE = 7;

// ====================================================================
// FUNGSI SORTING PINTAR (INTELLIGENT SORTING)
// ====================================================================

// Kata kunci angka inti untuk deteksi dasar (mapping minimal)
const coreNumbers = {
    // Indonesia
    'nol': 0, 'satu': 1, 'dua': 2, 'tiga': 3, 'empat': 4, 'lima': 5,
    'enam': 6, 'tujuh': 7, 'delapan': 8, 'sembilan': 9, 'sepuluh': 10,
    // Sunda (hanya yang berbeda dari Indonesia atau sering digunakan)
    'hiji': 1, 'tilu': 3, 'opat': 4, 'genep': 6, 'dalapan': 8, 'salapan': 9, 'sapuluh': 10,
    // English
    'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
    'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
};

/**
 * Mengekstrak nilai numerik dari string kosakata.
 * Mendeteksi angka langsung, digit, dan beberapa pola angka majemuk (Indonesia & Inggris).
 * @param {string} str - String kosakata.
 * @returns {number | null} Nilai numerik atau null jika tidak terdeteksi sebagai angka.
 */
const extractNumericValue = (str) => {
    if (!str || typeof str !== 'string') return null; // Validasi input
    
    const cleanStr = str.toLowerCase().trim(); // Bersihkan string
    
    // 1. Cek mapping langsung dari coreNumbers
    if (coreNumbers[cleanStr] !== undefined) {
        return coreNumbers[cleanStr];
    }
    
    // 2. Cek apakah string adalah digit angka (misal: "1", "25")
    if (/^\d+$/.test(cleanStr)) {
        return parseInt(cleanStr);
    }
    
    // 3. Deteksi pola angka majemuk Indonesia (misal: "dua puluh satu", "sebelas") - Disederhanakan
    // Pola ini mencakup -belas dan -puluh
    const indonesianPattern = /^(se|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)?[\s]*(puluh|belas)?[\s]*(satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan)?$/;
    if (indonesianPattern.test(cleanStr)) {
        // Coba parse (fungsi parseIndonesianNumber bisa ditambahkan jika perlu akurasi tinggi)
        // Untuk sorting, kadang direct mapping atau digit cukup. Jika ingin lebih akurat, implementasikan parser.
        // Sementara, return null agar fallback ke alphabetical jika parsing kompleks tidak ada.
        // return parseIndonesianNumber(cleanStr); // Jika fungsi parser ada
    }
    
    // 4. Deteksi pola angka majemuk Inggris (misal: "twenty-one", "ninety")
    const englishPattern = /^(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s\-]?(one|two|three|four|five|six|seven|eight|nine)?$/;
    if (englishPattern.test(cleanStr)) {
        // return parseEnglishNumber(cleanStr); // Jika fungsi parser ada
    }
    
    // 5. Deteksi angka belasan Inggris (eleven, twelve, ..., nineteen)
    const englishTeens = {
        'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
        'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19
    };
    if (englishTeens[cleanStr]) {
        return englishTeens[cleanStr];
    }
    
    return null; // Return null jika tidak ada pola angka yang cocok
};

// Fungsi opsional untuk parsing angka majemuk Indonesia (contoh sederhana)
// const parseIndonesianNumber = (str) => { ... implementasi ... };
// Fungsi opsional untuk parsing angka majemuk Inggris (contoh sederhana)
// const parseEnglishNumber = (str) => { ... implementasi ... };

/**
 * Mendeteksi apakah mayoritas entri dalam sampel awal adalah angka.
 * Digunakan untuk menentukan apakah sorting numerik harus diprioritaskan.
 * @param {Array<object>} entries - Array entri kosakata.
 * @param {number} sampleSize - Jumlah sampel awal yang diperiksa.
 * @returns {boolean} True jika kemungkinan besar topik angka, false jika tidak.
 */
const isNumberTopic = (entries, sampleSize = 5) => {
    if (!entries || entries.length === 0) return false; // Cek jika array kosong
    
    // Ambil sampel awal
    const sample = entries.slice(0, Math.min(sampleSize, entries.length));
    // Hitung berapa banyak kosakata (versi Indonesia) dalam sampel yang merupakan angka
    const numberCount = sample.filter(entry => {
        const vocab = findVocab(entry, 'id'); // Dapatkan kosakata Bhs. Indonesia
        return extractNumericValue(vocab) !== null; // Cek apakah bisa diekstrak sebagai angka
    }).length;
    
    // Jika lebih dari 70% sampel adalah angka, anggap ini topik angka
    return sample.length > 0 && (numberCount / sample.length) > 0.7;
};

/**
 * Fungsi sorting utama yang cerdas.
 * Memprioritaskan sorting numerik jika topik terdeteksi sebagai topik angka,
 * jika tidak, melakukan sorting alfabetis (localeCompare).
 * @param {object} a - Entri kosakata pertama.
 * @param {object} b - Entri kosakata kedua.
 * @param {string} order - Urutan sorting ('asc' atau 'desc').
 * @param {Array<object>} allEntries - Seluruh daftar entri (untuk deteksi tipe topik).
 * @returns {number} Hasil perbandingan untuk fungsi sort().
 */
const intelligentSort = (a, b, order = 'asc', allEntries = []) => {
    // Ambil kosakata Bahasa Indonesia dari kedua entri
    const vocabA = findVocab(a, 'id');
    const vocabB = findVocab(b, 'id');
    
    // Cek apakah ini topik angka berdasarkan sampel
    const isNumericTopic = isNumberTopic(allEntries);
    
    if (isNumericTopic) { // Jika topik angka
        // Coba ekstrak nilai numerik
        const numA = extractNumericValue(vocabA);
        const numB = extractNumericValue(vocabB);
        
        // Kasus 1: Keduanya adalah angka -> sort numerik
        if (numA !== null && numB !== null) {
            return order === 'asc' ? numA - numB : numB - numA;
        }
        
        // Kasus 2: Hanya A angka -> A diutamakan (lebih kecil jika asc)
        if (numA !== null && numB === null) {
            return order === 'asc' ? -1 : 1;
        }
        // Kasus 3: Hanya B angka -> B diutamakan (lebih kecil jika asc)
        if (numA === null && numB !== null) {
            return order === 'asc' ? 1 : -1;
        }
        // Kasus 4: Keduanya bukan angka (meskipun di topik angka) -> fallback ke alfabetis
    }
    
    // Fallback: Sorting alfabetis (case-insensitive) menggunakan localeCompare
    const result = vocabA.toLowerCase().localeCompare(vocabB.toLowerCase());
    return order === 'asc' ? result : -result; // Balik hasil jika descending
};

/**
 * Helper function untuk mencari kosakata dalam bahasa tertentu dari sebuah entri.
 * @param {object} entry - Objek entri kosakata.
 * @param {string} lang - Kode bahasa ('id', 'su', 'en').
 * @returns {string} Kosakata yang ditemukan atau 'N/A'.
 */
const findVocab = (entry, lang) => {
    // Validasi input
    if (!entry || !entry.entryVocabularies) return 'N/A'; 
    // Cari kosakata dengan kode bahasa yang cocok
    const vocab = entry.entryVocabularies.find(v => v.language.languageCode === lang);
    // Kembalikan vocab jika ditemukan, jika tidak 'N/A'
    return vocab ? vocab.vocab : 'N/A'; 
};

// ====================================================================
// KOMPONEN IKON INTERNAL (tidak berubah)
// ====================================================================
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>;

// ====================================================================
// KOMPONEN UTAMA HALAMAN MANAGE WORDS
// ====================================================================

/**
 * Komponen halaman untuk mengelola kosakata dalam satu topik tertentu.
 * Menampilkan daftar kosakata, memungkinkan pencarian, sorting (pintar),
 * penambahan, pengeditan, penghapusan (tunggal/multi), pratinjau gambar, dan pemutaran audio.
 */
const ManageWordsPage = () => {
    const { user } = useAuth(); // Ambil data user (token)
    const { topicId } = useParams(); // Ambil ID topik dari URL
    const [topicName, setTopicName] = useState(''); // State nama topik saat ini
    const [wordsData, setWordsData] = useState([]); // State daftar kosakata (entri)
    const [isLoading, setIsLoading] = useState(true); // State status loading
    const [error, setError] = useState(null); // State pesan error
    const [searchTerm, setSearchTerm] = useState(''); // State input pencarian
    const [sortOrder, setSortOrder] = useState('asc'); // State urutan sorting
    const [currentPage, setCurrentPage] = useState(1); // State halaman pagination
    // State untuk modal-modal
    const [imageModalUrl, setImageModalUrl] = useState(null); // URL gambar untuk modal pratinjau
    const [audioModalEntry, setAudioModalEntry] = useState(null); // Data entri untuk modal audio player
    const [formModalState, setFormModalState] = useState({ isOpen: false, mode: 'add', data: null }); // State modal form
    const [deleteModalWord, setDeleteModalWord] = useState(null); // Data kosakata untuk modal konfirmasi hapus
    const [detailModalWord, setDetailModalWord] = useState(null); // Data kosakata untuk modal detail (mobile)
    // State untuk ID kosakata yang dipilih (checkbox)
    const [selectedWords, setSelectedWords] = useState([]); 
    // State modal notifikasi status
    const [statusModal, setStatusModal] = useState({ isOpen: false, message: '', type: 'success' });

    // Fungsi untuk mengambil data topik dan kosakata
    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true); // Mulai loading
            // Tambahkan delay minimum
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
            // Ambil info topik dan data entri/kosakata secara paralel
            const topicInfoFetch = getTopicById(topicId);
            const entriesDataFetch = getEntriesByTopicId(topicId);
            const [topicInfo, entriesData] = await Promise.all([topicInfoFetch, entriesDataFetch, minDelay]);
            // Ambil nama topik versi Indonesia
            const mainTopicName = topicInfo.topic.topicName.find(t => t.lang === 'id')?.value || 'Topik';
            setTopicName(mainTopicName); // Set nama topik
            setWordsData(entriesData.entries || []); // Set data kosakata
            setError(null); // Bersihkan error
        } catch (err) {
            setError("Gagal memuat data kosakata."); // Set error jika gagal
        } finally {
            setIsLoading(false); // Selesai loading
        }
    }, [topicId]); // Dependensi: topicId

    // Panggil fetchData saat komponen dimuat atau topicId berubah
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handler submit form (tambah/edit kosakata) - logika mirip ManageTopicsPage
    const handleFormSubmit = async (data) => {
        const token = user?.token;
        if (!token) {
            setStatusModal({ isOpen: true, message: "Otentikasi gagal. Silakan login kembali.", type: 'error' });
            return;
        }
        const isMultiAdd = Array.isArray(data);
        const submissions = isMultiAdd ? data : [data];
        try {
            if (formModalState.mode === 'add') {
                await Promise.all(submissions.map(formData => addEntry(topicId, formData, token)));
                setStatusModal({ isOpen: true, message: `Berhasil menambahkan ${submissions.length} kosakata!`, type: 'success' });
            } else if (formModalState.mode === 'edit') {
                await updateEntry(topicId, formModalState.data._id, submissions[0], token);
                setStatusModal({ isOpen: true, message: 'Kosakata berhasil diperbarui!', type: 'success' });
            }
            fetchData(); // Refresh data
        } catch (err) {
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan pada server.';
            setStatusModal({ isOpen: true, message: `Gagal: ${errorMessage}`, type: 'error' });
        } finally {
            setFormModalState({ isOpen: false, mode: 'add', data: null }); // Tutup modal form
            setDetailModalWord(null); // Tutup modal detail
        }
    };

    // Handler konfirmasi hapus kosakata - logika mirip ManageTopicsPage
    const handleDeleteConfirm = async () => {
        if (!deleteModalWord) return;
        const token = user?.token;
        if (!token) {
            setStatusModal({ isOpen: true, message: "Otentikasi gagal. Silakan login kembali.", type: 'error' });
            return;
        }
        try {
            const idsToDelete = selectedWords.length > 0 ? selectedWords : [deleteModalWord._id];
            await Promise.all(idsToDelete.map(id => deleteEntry(topicId, id, token)));
            setStatusModal({ isOpen: true, message: `Berhasil menghapus ${idsToDelete.length} kosakata!`, type: 'success' });
            fetchData(); // Refresh data
            setSelectedWords([]); // Kosongkan pilihan
        } catch (err) {
            setStatusModal({ isOpen: true, message: 'Gagal menghapus kosakata.', type: 'error' });
        } finally {
            setDeleteModalWord(null); // Tutup modal delete
            setDetailModalWord(null); // Tutup modal detail
        }
    };

    // Handler pilih/batal pilih kosakata (checkbox)
    const handleSelectWord = (wordId) => {
        setSelectedWords(prev =>
            prev.includes(wordId)
                ? prev.filter(id => id !== wordId)
                : [...prev, wordId]
        );
    };

    // Handler ganti urutan sorting
    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1); // Reset ke halaman 1
    };

    // Filter dan sort kosakata menggunakan fungsi intelligentSort
    const filteredAndSortedWords = wordsData
        // Filter berdasarkan searchTerm (cek di semua bahasa)
        .filter(entry => {
            const searchLower = searchTerm.toLowerCase();
            return findVocab(entry, 'id').toLowerCase().includes(searchLower) ||
                   findVocab(entry, 'su').toLowerCase().includes(searchLower) ||
                   findVocab(entry, 'en').toLowerCase().includes(searchLower);
        })
        // Sort menggunakan intelligentSort
        .sort((a, b) => intelligentSort(a, b, sortOrder, wordsData)); // Kirim semua data untuk deteksi tipe

    // Logika pagination
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredAndSortedWords.slice(indexOfFirstItem, indexOfLastItem);

    // Handler checkbox "Pilih Semua"
    const handleSelectAll = () => {
        const allVisibleIds = currentItems.map(item => item._id);
        const allSelectedOnPage = allVisibleIds.every(id => selectedWords.includes(id));
        if (allSelectedOnPage) { // Jika semua terpilih -> batal pilih semua
            setSelectedWords(prev => prev.filter(id => !allVisibleIds.includes(id)));
        } else { // Jika belum semua -> pilih semua
            setSelectedWords(prev => [...new Set([...prev, ...allVisibleIds])]);
        }
    };

    // Hitung total halaman dan baris kosong
    const totalPages = Math.ceil(filteredAndSortedWords.length / ITEMS_PER_PAGE);
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);
    const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - currentItems.length);
    const emptyRows = Array(emptyRowsCount).fill(null);

    return (
        <div>
            {/* Header Halaman (Breadcrumb, Judul, Kontrol) */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
                {/* Breadcrumb dan Judul */}
                <div>
                    <nav className="text-sm text-text-secondary mb-1">
                        <Link to="/admin/manage-topics" className="hover:underline">Daftar Topik</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="font-semibold text-text">{topicName}</span>
                    </nav>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text">Kosakata Topik {topicName}</h1>
                </div>
                {/* Kontrol (Search, Back, Sort, Delete Multi, Add) */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    {/* Input Pencarian */}
                    <div className="relative w-full sm:w-auto sm:flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input type="text" placeholder="Cari kosakata..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text"/>
                    </div>
                    {/* Tombol Kontrol (Kembali, Sort, Hapus, Tambah) */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link to="/admin/manage-topics" className="bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 flex-grow sm:flex-grow-0 justify-center text-sm border border-gray-300 dark:border-gray-600">
                            <span>Kembali</span>
                        </Link>
                        <button 
                            onClick={toggleSortOrder}
                            className="bg-gray-500/10 text-text-secondary font-bold px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-500/20 flex-shrink-0 text-sm"
                            title={`Urut ${sortOrder === 'asc' ? 'A-Z/1-9' : 'Z-A/9-1'}`}
                        >
                            {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                            <span className="hidden sm:inline">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                        </button>
                        {/* Tombol Hapus Multi */}
                        {selectedWords.length > 0 && (
                             <button onClick={() => setDeleteModalWord({ multi: true })} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 flex-grow sm:flex-grow-0 justify-center text-sm">
                                 <TrashIcon />
                                 <span>Hapus ({selectedWords.length})</span>
                             </button>
                        )}
                        <button onClick={() => setFormModalState({ isOpen: true, mode: 'add', data: null })} className="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 flex-grow sm:flex-grow-0 justify-center text-sm">
                            <PlusIcon />
                            <span>Tambah</span>
                        </button>
                    </div>
                </div>
            </div>
            {/* Tabel Data Kosakata */}
            <div className="bg-background-secondary rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        {/* Header Tabel */}
                        <thead className="bg-slate-50 dark:bg-gray-700/50">
                            <tr style={{ height: '60px' }}>
                                {/* Checkbox Pilih Semua */}
                                <th className="p-3 px-6 w-4">
                                    <input type="checkbox" className="rounded" onChange={handleSelectAll} checked={currentItems.length > 0 && currentItems.every(item => selectedWords.includes(item._id))} />
                                </th>
                                {/* No */}
                                <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[5%]">No.</th>
                                {/* Indonesia (dengan tombol sort mobile) */}
                                <th className="p-3 px-6 font-bold text-text-secondary">
                                    <div className="flex items-center gap-2">
                                        Indonesia
                                        <button 
                                            onClick={toggleSortOrder}
                                            className="sm:hidden p-1 hover:bg-gray-500/10 rounded" // Tombol sort hanya mobile
                                            title={`Urut ${sortOrder === 'asc' ? 'A-Z/1-9' : 'Z-A/9-1'}`}
                                        >
                                            {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                                        </button>
                                    </div>
                                </th>
                                {/* Sunda */}
                                <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[20%]">Sunda</th>
                                {/* Inggris */}
                                <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[20%]">Inggris</th>
                                {/* Aksi */}
                                <th className="p-3 px-6 font-bold text-text-secondary text-right">Aksi</th>
                            </tr>
                        </thead>
                        {/* Body Tabel */}
                        <tbody>
                            {isLoading ? ( // Loading
                                <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="6" className="text-center align-middle"><LoadingIndicator /></td></tr>
                            ) : error ? ( // Error
                                <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="6" className="text-center align-middle text-red-500">{error}</td></tr>
                            ) : filteredAndSortedWords.length === 0 ? ( // Tidak ada data
                                <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="6" className="text-center align-middle text-text-secondary">Belum ada kosakata di topik ini.</td></tr>
                            ) : ( // Tampilkan data
                                <>
                                    {currentItems.map((entry, index) => (
                                        <tr key={entry._id} className={`border-b border-background hover:bg-background/50 ${selectedWords.includes(entry._id) ? 'bg-primary/10' : ''}`} style={{ height: '60px' }}>
                                            {/* Checkbox */}
                                            <td className="p-3 px-6">
                                                <input type="checkbox" className="rounded" checked={selectedWords.includes(entry._id)} onChange={() => handleSelectWord(entry._id)} />
                                            </td>
                                            {/* No */}
                                            <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                            {/* Indonesia */}
                                            <td className="p-3 px-6 text-text font-semibold truncate">{findVocab(entry, 'id')}</td>
                                            {/* Sunda */}
                                            <td className="hidden sm:table-cell p-3 px-6 text-text-secondary truncate">{findVocab(entry, 'su')}</td>
                                            {/* Inggris */}
                                            <td className="hidden sm:table-cell p-3 px-6 text-text-secondary truncate">{findVocab(entry, 'en')}</td>
                                            {/* Aksi */}
                                            <td className="p-3 px-6 text-right">
                                                {/* Aksi Desktop */}
                                                <div className="hidden sm:flex justify-end items-center gap-2">
                                                    {/* Tombol Pratinjau Topik */}
                                                    <Link 
                                                        to={`/topik/${topicId}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="bg-gray-500/10 text-text-secondary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-500/20"
                                                    >
                                                        Pratinjau
                                                    </Link>
                                                    {/* Tombol lihat Gambar */}
                                                    <button onClick={() => setImageModalUrl(`http://localhost:5000${entry.entryImagePath}`)} className="bg-gray-500/10 text-text-secondary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-500/20">Gambar</button>
                                                    {/* Tombol putar Audio */}
                                                    <button onClick={() => setAudioModalEntry(entry)} className="bg-gray-500/10 text-text-secondary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-500/20">Audio</button>
                                                    {/* Tombol Edit */}
                                                    <button onClick={() => setFormModalState({ isOpen: true, mode: 'edit', data: entry })} className="bg-yellow-500/10 text-yellow-600 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-yellow-500/20">Edit</button>
                                                    {/* Tombol Hapus */}
                                                    <button onClick={() => setDeleteModalWord(entry)} className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-red-500/20">Hapus</button>
                                                </div>
                                                {/* Aksi Mobile (Detail) */}
                                                <div className="sm:hidden">
                                                    <button onClick={() => setDetailModalWord(entry)} className="bg-background text-text-secondary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-background/80">Detail</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {/* Baris Kosong */}
                                    {currentItems.length > 0 && emptyRows.map((_, index) => (
                                        <tr key={`empty-${index}`} className="border-b border-background" style={{ height: '60px' }}><td colSpan="6"></td></tr>
                                    ))}
                                </>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Footer Tabel (Pagination) */}
                <div className="p-4 border-t border-background">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} totalItems={filteredAndSortedWords.length} />
                </div>
            </div>
            {/* Modal-modal */}
            <ImageModal imageUrl={imageModalUrl} onClose={() => setImageModalUrl(null)} />
            <AudioPlayerModal entry={audioModalEntry} onClose={() => setAudioModalEntry(null)} />
            <WordFormModal
                isOpen={formModalState.isOpen}
                onClose={() => setFormModalState({ isOpen: false, mode: 'add', data: null })}
                onSubmit={handleFormSubmit}
                mode={formModalState.mode}
                initialData={formModalState.data}
            />
            <ConfirmDeleteModal
                isOpen={!!deleteModalWord}
                onClose={() => setDeleteModalWord(null)}
                onConfirm={handleDeleteConfirm}
                title={selectedWords.length > 0 ? "Hapus Kosakata yang Dipilih" : "Hapus Kosakata"}
                message={
                    selectedWords.length > 0 
                    ? `Apakah Anda yakin ingin menghapus ${selectedWords.length} kosakata yang dipilih?`
                    : deleteModalWord ? `Apakah Anda yakin ingin menghapus kosakata "${findVocab(deleteModalWord, 'id')}"?` : ''
                }
            />
            <ManageWordDetailModal
                word={detailModalWord}
                onClose={() => setDetailModalWord(null)}
                onEdit={() => setFormModalState({ isOpen: true, mode: 'edit', data: detailModalWord })}
                onDelete={() => setDeleteModalWord(detailModalWord)}
                onViewImage={() => setImageModalUrl(`http://localhost:5000${detailModalWord.entryImagePath}`)}
                onPlayAudio={() => setAudioModalEntry(detailModalWord)}
                findVocab={findVocab} // Kirim helper function
            />
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                message={statusModal.message}
                type={statusModal.type}
            />
        </div>
    );
};

export default ManageWordsPage;