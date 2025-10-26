import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Hook otentikasi
import learnerService from '../../services/learnerService'; // Service API pengguna
import PageHeader from '../../components/ui/PageHeader'; // Komponen header (tidak digunakan di sini tapi import ada)
import Pagination from '../../components/ui/Pagination'; // Komponen pagination
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'; // Modal konfirmasi hapus
import LoadingIndicator from '../../components/ui/LoadingIndicator'; // Indikator loading
import ManageLearnerDetailModal from '../../components/admin/ManageLearnerDetailModal'; // Modal detail pengguna (mobile)
import Select from 'react-select'; // Komponen dropdown select

// Konstanta jumlah item per halaman
const ITEMS_PER_PAGE = 8;

// Komponen ikon pencarian internal
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

/**
 * Komponen halaman untuk mengelola data pengguna (learner).
 * Memungkinkan pencarian berdasarkan nama/domisili, filter berdasarkan domisili,
 * dan melihat detail pengguna.
 * Penghapusan pengguna saat ini dinonaktifkan via tombol alert.
 */
const ManageLearnersPage = () => {
    const { user } = useAuth(); // Ambil data admin yang login (terutama token)
    const [learners, setLearners] = useState([]); // State untuk menyimpan daftar pengguna
    const [isLoading, setIsLoading] = useState(true); // State status loading data
    const [error, setError] = useState(null); // State pesan error fetch data
    
    // State untuk filter dan pencarian
    const [searchTerm, setSearchTerm] = useState(''); // State input pencarian
    const [currentPage, setCurrentPage] = useState(1); // State halaman pagination saat ini
    
    // State untuk modal
    const [learnerToDelete, setLearnerToDelete] = useState(null); // State data pengguna yang akan dihapus (trigger modal konfirmasi)
    const [detailModalLearner, setDetailModalLearner] = useState(null); // State data pengguna untuk modal detail (mobile)

    // State untuk filter domisili
    const [cityFilter, setCityFilter] = useState(null); // State filter domisili yang dipilih
    const [cityOptions, setCityOptions] = useState([]); // State opsi domisili untuk dropdown

    // Fungsi untuk mengambil data pengguna dari API
    // Dibungkus useCallback agar tidak dibuat ulang kecuali dependensi (user) berubah
    const fetchLearners = useCallback(async () => {
        if (!user?.token) return; // Jangan fetch jika token tidak ada
        setIsLoading(true); // Mulai loading
        try {
            // Tambahkan delay minimum 1 detik
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
            // Panggil API get all learners
            const dataFetch = learnerService.getAllLearners(user.token);
            // Tunggu data dan delay selesai
            const [response] = await Promise.all([dataFetch, minDelay]);
            
            const learnersData = response.data || []; // Ambil data pengguna atau array kosong
            setLearners(learnersData); // Simpan data ke state
            
            // Ekstrak domisili unik dari data pengguna
            const uniqueCities = [...new Set(learnersData.map(l => l.learnerCity))];
            // Siapkan opsi untuk dropdown filter domisili
            setCityOptions([
                { value: 'all', label: 'Semua Domisili' }, // Opsi default
                ...uniqueCities.map(city => ({ value: city, label: city })) // Opsi untuk setiap kota unik
            ]);
            
            setError(null); // Bersihkan error jika berhasil
        } catch (err) {
            setError('Gagal memuat data pengguna.'); // Set error jika gagal
            console.error(err);
        } finally {
            setIsLoading(false); // Selesai loading
        }
    }, [user]); // Dependensi: user (terutama token)

    // Panggil fetchLearners saat komponen dimuat atau fetchLearners berubah
    useEffect(() => {
        fetchLearners();
    }, [fetchLearners]);

    // Handler untuk konfirmasi penghapusan pengguna (saat ini hanya menampilkan alert)
    const handleDeleteConfirm = async () => {
        if (!learnerToDelete || !user?.token) return; // Validasi dasar
        try {
            // Seharusnya memanggil service delete, tapi dinonaktifkan
            // await learnerService.deleteLearner(learnerToDelete._id, user.token);
            alert('Fitur hapus pengguna untuk sementara dinonaktifkan.'); // Tampilkan alert
            // fetchLearners(); // Refresh data jika penghapusan berhasil
        } catch (err) {
            alert('Gagal menghapus pengguna.'); // Alert jika gagal (meskipun service tidak dipanggil)
            console.error(err);
        } finally {
            setLearnerToDelete(null); // Tutup modal konfirmasi
            setDetailModalLearner(null); // Tutup modal detail jika terbuka
        }
    };

    // Filter pengguna berdasarkan searchTerm (nama/domisili) dan cityFilter
    const filteredLearners = learners.filter(learner => {
        // Cek kecocokan dengan searchTerm
        const matchesSearch = learner.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (learner.learnerCity && learner.learnerCity.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Cek kecocokan dengan cityFilter
        const matchesCity = !cityFilter || cityFilter.value === 'all' || learner.learnerCity === cityFilter.value;

        // Kembalikan true jika cocok dengan kedua kriteria
        return matchesSearch && matchesCity;
    });

    // Logika pagination
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    // Ambil data untuk halaman saat ini
    const currentItems = filteredLearners.slice(indexOfFirstItem, indexOfLastItem);
    // Hitung total halaman
    const totalPages = Math.ceil(filteredLearners.length / ITEMS_PER_PAGE);

    // Hitung jumlah baris kosong yang perlu ditambahkan agar tinggi tabel konsisten
    const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - currentItems.length);
    const emptyRows = Array(emptyRowsCount).fill(null); // Buat array untuk baris kosong

    return (
        <div>
            {/* Header Halaman dan Kontrol Filter */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-text">Daftar Pengguna</h1>
                {/* Kontrol Pencarian dan Filter Domisili */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Input Pencarian */}
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input
                            type="text"
                            placeholder="Cari nama..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text"
                        />
                    </div>
                    {/* Dropdown Filter Domisili */}
                    <Select
                        options={cityOptions} // Opsi domisili
                        value={cityFilter} // Nilai terpilih
                        onChange={setCityFilter} // Handler saat nilai berubah
                        placeholder="Filter Domisili"
                        className="w-full sm:w-48 text-sm" // Styling
                        classNamePrefix="react-select" // Prefix class untuk styling internal react-select
                    />
                </div>
            </div>

            {/* Tabel Data Pengguna */}
            <div className="bg-background-secondary rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    {/* Header Tabel */}
                    <thead className="bg-slate-50 dark:bg-gray-700/50">
                        {/* Beri tinggi tetap pada header agar konsisten */}
                        <tr style={{ height: '60px' }}>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[5%]">No.</th>
                            <th className="p-3 px-6 font-bold text-text-secondary">Nama Lengkap</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[25%]">Domisili</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[20%]">Nomor Telepon</th>
                            {/* Kolom aksi dihapus karena hanya ada detail di mobile */}
                        </tr>
                    </thead>
                    {/* Body Tabel */}
                    <tbody>
                        {isLoading ? ( // Tampilkan loading jika sedang fetch data
                            // Baris loading mencakup tinggi total tabel
                            <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="5" className="text-center align-middle"><LoadingIndicator /></td></tr>
                        ) : error ? ( // Tampilkan error jika fetch gagal
                            <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="5" className="text-center align-middle text-red-500">{error}</td></tr>
                        ) : filteredLearners.length === 0 ? ( // Tampilkan pesan jika tidak ada data
                            // Baris pesan "tidak ada data" mencakup tinggi total tabel
                            <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}>
                                <td colSpan="5" className="text-center align-middle text-text-secondary">Tidak ada pengguna yang ditemukan.</td>
                            </tr>
                        ) : ( // Tampilkan data pengguna jika ada
                            <>
                                {currentItems.map((learner, index) => (
                                    // Beri tinggi tetap pada setiap baris data
                                    <tr key={learner._id} className="border-b border-background hover:bg-background" style={{ height: '60px' }}>
                                        <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                        <td className="p-3 px-6 text-text font-semibold">{learner.learnerName}</td>
                                        <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{learner.learnerCity}</td>
                                        <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{learner.learnerPhone || '-'}</td>
                                        {/* Kolom aksi hanya berisi tombol detail di mobile */}
                                        <td className="p-3 px-6 text-right">
                                            <div className="sm:hidden">
                                                <button onClick={() => setDetailModalLearner(learner)} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-200">
                                                    Detail
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* Render baris kosong untuk mengisi sisa ruang agar tinggi tabel konsisten */}
                                {emptyRows.map((_, index) => (
                                    <tr key={`empty-${index}`} className="border-b border-background" style={{ height: '60px' }}><td colSpan="5"></td></tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
                {/* Footer Tabel (Pagination) */}
                <div className="p-4 border-t border-background">
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={(page) => setCurrentPage(page)} 
                        totalItems={filteredLearners.length} 
                    />
                </div>
            </div>

            {/* Modal Konfirmasi Hapus (saat ini hanya menampilkan alert) */}
            <ConfirmDeleteModal
                isOpen={!!learnerToDelete} // Buka jika learnerToDelete ada isinya
                onClose={() => setLearnerToDelete(null)} // Handler tutup modal
                onConfirm={handleDeleteConfirm} // Handler konfirmasi hapus
                title="Hapus Pengguna"
                message={`Apakah Anda yakin ingin menghapus pengguna "${learnerToDelete?.learnerName}"? Aksi ini tidak dapat dibatalkan.`}
            />
            {/* Modal Detail Pengguna (Mobile) */}
            <ManageLearnerDetailModal
                learner={detailModalLearner} // Data pengguna yang ditampilkan
                onClose={() => setDetailModalLearner(null)} // Handler tutup modal
                onDelete={() => setLearnerToDelete(detailModalLearner)} // Handler tombol hapus di modal detail
                hideDeleteButton={true} // Sembunyikan tombol hapus permanen di modal ini
            />
        </div>
    );
};

export default ManageLearnersPage;