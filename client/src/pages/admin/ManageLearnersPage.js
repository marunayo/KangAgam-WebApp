import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import learnerService from '../../services/learnerService';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import ManageLearnerDetailModal from '../../components/admin/ManageLearnerDetailModal';
import Select from 'react-select';

const ITEMS_PER_PAGE = 8;

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;

const ManageLearnersPage = () => {
    const { user } = useAuth();
    const [learners, setLearners] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [learnerToDelete, setLearnerToDelete] = useState(null);
    const [detailModalLearner, setDetailModalLearner] = useState(null);

    const [cityFilter, setCityFilter] = useState(null);
    const [cityOptions, setCityOptions] = useState([]);

    const fetchLearners = useCallback(async () => {
        if (!user?.token) return;
        setIsLoading(true);
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
            const dataFetch = learnerService.getAllLearners(user.token);
            const [response] = await Promise.all([dataFetch, minDelay]);
            
            const learnersData = response.data || [];
            setLearners(learnersData);
            
            const uniqueCities = [...new Set(learnersData.map(l => l.learnerCity))];
            setCityOptions([
                { value: 'all', label: 'Semua Domisili' },
                ...uniqueCities.map(city => ({ value: city, label: city }))
            ]);
            
            setError(null);
        } catch (err) {
            setError('Gagal memuat data pengguna.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchLearners();
    }, [fetchLearners]);

    const handleDeleteConfirm = async () => {
        if (!learnerToDelete || !user?.token) return;
        try {
            await learnerService.deleteLearner(learnerToDelete._id, user.token);
            alert('Pengguna berhasil dihapus.');
            fetchLearners();
        } catch (err) {
            alert('Gagal menghapus pengguna.');
            console.error(err);
        } finally {
            setLearnerToDelete(null);
            setDetailModalLearner(null);
        }
    };

    const filteredLearners = learners.filter(learner => {
        const matchesSearch = learner.learnerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (learner.learnerCity && learner.learnerCity.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCity = !cityFilter || cityFilter.value === 'all' || learner.learnerCity === cityFilter.value;

        return matchesSearch && matchesCity;
    });

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredLearners.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLearners.length / ITEMS_PER_PAGE);

    // ✅ 1. Tambahkan logika untuk menghitung baris kosong
    const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - currentItems.length);
    const emptyRows = Array(emptyRowsCount).fill(null);

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-text">Daftar Pengguna</h1>
                <div className="flex items-center gap-2 w-full sm:w-auto">
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
                    <Select
                        options={cityOptions}
                        value={cityFilter}
                        onChange={setCityFilter}
                        placeholder="Filter Domisili"
                        className="w-full sm:w-48 text-sm"
                        classNamePrefix="react-select"
                    />
                </div>
            </div>

            <div className="bg-background-secondary rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-gray-700/50">
                        {/* ✅ 2. Beri tinggi tetap pada header tabel */}
                        <tr style={{ height: '60px' }}>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[5%]">No.</th>
                            <th className="p-3 px-6 font-bold text-text-secondary">Nama Lengkap</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[25%]">Domisili</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[20%]">Nomor Telepon</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="5" className="text-center align-middle"><LoadingIndicator /></td></tr>
                        ) : error ? (
                            <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="5" className="text-center align-middle text-red-500">{error}</td></tr>
                        ) : filteredLearners.length === 0 ? (
                            // ✅ 3. Tampilkan pesan "tidak ada data" dengan tinggi penuh
                            <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}>
                                <td colSpan="5" className="text-center align-middle text-text-secondary">Tidak ada pengguna yang ditemukan.</td>
                            </tr>
                        ) : (
                            <>
                                {currentItems.map((learner, index) => (
                                    <tr key={learner._id} className="border-b border-background hover:bg-background" style={{ height: '60px' }}>
                                        <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                        <td className="p-3 px-6 text-text font-semibold">{learner.learnerName}</td>
                                        <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{learner.learnerCity}</td>
                                        <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{learner.learnerPhone || '-'}</td>
                                        <td className="p-3 px-6 text-right">

                                            <div className="sm:hidden">
                                                <button onClick={() => setDetailModalLearner(learner)} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-200">
                                                    Detail
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {/* ✅ 4. Render baris kosong untuk mengisi sisa ruang */}
                                {emptyRows.map((_, index) => (
                                    <tr key={`empty-${index}`} className="border-b border-background" style={{ height: '60px' }}><td colSpan="5"></td></tr>
                                ))}
                            </>
                        )}
                    </tbody>
                </table>
                <div className="p-4 border-t border-background">
                    <Pagination 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPageChange={(page) => setCurrentPage(page)} 
                        totalItems={filteredLearners.length} 
                    />
                </div>
            </div>

            <ConfirmDeleteModal
                isOpen={!!learnerToDelete}
                onClose={() => setLearnerToDelete(null)}
                onConfirm={handleDeleteConfirm}
                title="Hapus Pengguna"
                message={`Apakah Anda yakin ingin menghapus pengguna "${learnerToDelete?.learnerName}"? Aksi ini tidak dapat dibatalkan.`}
            />
            {/* ✅ Modified: Pass hideDeleteButton prop to hide delete button */}
            <ManageLearnerDetailModal
                learner={detailModalLearner}
                onClose={() => setDetailModalLearner(null)}
                onDelete={() => setLearnerToDelete(detailModalLearner)}
                hideDeleteButton={true} // Add this prop to hide the delete button
            />
        </div>
    );
};

export default ManageLearnersPage;