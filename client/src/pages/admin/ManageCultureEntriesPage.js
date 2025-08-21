import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getCultureTopicById, getEntriesByCultureTopic, addCultureEntry, updateCultureEntry, deleteCultureEntry } from '../../services/cultureService';

import LoadingIndicator from '../../components/ui/LoadingIndicator';
import Pagination from '../../components/ui/Pagination';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import CultureEntryFormModal from '../../components/admin/CultureEntryFormModal';
import ManageCultureEntryDetailModal from '../../components/admin/ManageCultureEntryDetailModal';

const ITEMS_PER_PAGE = 5;

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>;
const SortAscIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>;
const SortDescIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" /></svg>;

const getLocalizedText = (textData, lang = 'id') => {
    if (!textData || !Array.isArray(textData)) return 'N/A';
    const translation = textData.find(t => t.lang === lang);
    return translation ? translation.value : textData[0]?.value || 'N/A';
};

const ManageCultureEntriesPage = () => {
    const { user } = useAuth();
    const { topicId } = useParams();
    const [topicName, setTopicName] = useState('');
    const [entries, setEntries] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedEntries, setSelectedEntries] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc' atau 'desc'
    
    const [formModal, setFormModal] = useState({ isOpen: false, mode: 'add', data: null });
    const [deleteModal, setDeleteModal] = useState(null);
    const [detailModalEntry, setDetailModalEntry] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [topicRes, entriesRes] = await Promise.all([
                getCultureTopicById(topicId),
                getEntriesByCultureTopic(topicId),
                new Promise(resolve => setTimeout(resolve, 1000))
            ]);
            setTopicName(getLocalizedText(topicRes.data.name));
            setEntries(entriesRes.data || []);
        } catch (err) {
            setError('Gagal memuat data entri budaya.');
        } finally {
            setIsLoading(false);
        }
    }, [topicId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleSortOrder = () => {
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        setCurrentPage(1); // Reset ke halaman pertama setelah sorting
    };

    const handleFormSubmit = async (data) => {
        const token = user?.token;
        if (!token) return alert("Otentikasi gagal.");

        const isMultiAdd = Array.isArray(data);
        const submissions = isMultiAdd ? data : [data];

        try {
            if (formModal.mode === 'add') {
                await Promise.all(submissions.map(formData => addCultureEntry(topicId, formData, token)));
                alert(`Berhasil menambahkan ${submissions.length} entri budaya!`);
            } else {
                await updateCultureEntry(topicId, formModal.data._id, submissions[0], token);
                alert('Entri budaya berhasil diperbarui!');
            }
            fetchData();
        } catch (err) {
            const errorMessage = err.response?.data?.error || 'Terjadi kesalahan pada server.';
            alert(`Gagal: ${errorMessage}`);
        } finally {
            setFormModal({ isOpen: false, mode: 'add', data: null });
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteModal) return;
        const token = user?.token;
        if (!token) return alert("Otentikasi gagal.");

        try {
            const idsToDelete = selectedEntries.length > 0 ? selectedEntries : [deleteModal._id];
            await Promise.all(idsToDelete.map(id => deleteCultureEntry(topicId, id, token)));
            alert(`Berhasil menghapus ${idsToDelete.length} entri budaya.`);
            fetchData();
            setSelectedEntries([]);
        } catch (err) {
            alert('Gagal menghapus entri budaya.');
        } finally {
            setDeleteModal(null);
        }
    };
    
    const handleSelect = (entryId) => {
        setSelectedEntries(prev => prev.includes(entryId) ? prev.filter(id => id !== entryId) : [...prev, entryId]);
    };

    // Filter dan sort entries berdasarkan judul bahasa Indonesia
    const filteredAndSortedEntries = entries
        .filter(entry =>
            getLocalizedText(entry.title, 'id').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const titleA = getLocalizedText(a.title, 'id').toLowerCase();
            const titleB = getLocalizedText(b.title, 'id').toLowerCase();
            
            if (sortOrder === 'asc') {
                return titleA.localeCompare(titleB);
            } else {
                return titleB.localeCompare(titleA);
            }
        });

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredAndSortedEntries.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAndSortedEntries.length / ITEMS_PER_PAGE);
    const emptyRowsCount = Math.max(0, ITEMS_PER_PAGE - currentItems.length);
    const emptyRows = Array(emptyRowsCount).fill(null);

    const handleSelectAll = () => {
        const allIdsOnPage = currentItems.map(item => item._id);
        if (allIdsOnPage.every(id => selectedEntries.includes(id))) {
            setSelectedEntries(prev => prev.filter(id => !allIdsOnPage.includes(id)));
        } else {
            setSelectedEntries(prev => [...new Set([...prev, ...allIdsOnPage])]);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <div>
                    <nav className="text-sm text-text-secondary mb-1">
                        <Link to="/admin/manage-culture-topics" className="hover:underline">Kelola Topik Budaya</Link>
                        <span className="mx-2">&gt;</span>
                        <span className="font-semibold text-text">{topicName}</span>
                    </nav>
                    <h1 className="text-2xl sm:text-3xl font-bold text-text">Kelola Entri Budaya</h1>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto sm:flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input type="text" placeholder="Cari entri..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text" />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Link to="/admin/manage-culture-topics" className="bg-background-secondary text-text-secondary font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-700 flex-grow sm:flex-grow-0 justify-center text-sm border border-gray-300 dark:border-gray-600">
                            <span>Kembali</span>
                        </Link>
                        {/* Sort Button - Desktop & Mobile */}
                        <button 
                            onClick={toggleSortOrder}
                            className="bg-gray-500/10 text-text-secondary font-bold px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-gray-500/20 flex-shrink-0 text-sm"
                            title={`Urut ${sortOrder === 'asc' ? 'A-Z' : 'Z-A'}`}
                        >
                            {sortOrder === 'asc' ? <SortAscIcon /> : <SortDescIcon />}
                            <span className="hidden sm:inline">{sortOrder === 'asc' ? 'A-Z' : 'Z-A'}</span>
                        </button>
                        {selectedEntries.length > 0 && (
                            <button onClick={() => setDeleteModal({ multi: true })} className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-600 flex-grow sm:flex-grow-0 justify-center text-sm">
                                <TrashIcon />
                                <span>Hapus ({selectedEntries.length})</span>
                            </button>
                        )}
                        <button onClick={() => setFormModal({ isOpen: true, mode: 'add', data: null })} className="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 flex-grow sm:flex-grow-0 justify-center text-sm">
                            <PlusIcon />
                            <span>Tambah</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-background-secondary rounded-xl shadow-md overflow-hidden">
                {/* Desktop Table */}
                <div className="hidden sm:block">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 dark:bg-gray-700/50">
                                <tr style={{ height: '60px' }}>
                                    <th className="p-3 px-6 w-4"><input type="checkbox" onChange={handleSelectAll} checked={currentItems.length > 0 && currentItems.every(item => selectedEntries.includes(item._id))} /></th>
                                    <th className="p-3 px-6 font-bold text-text-secondary w-[5%]">No.</th>
                                    <th className="p-3 px-6 font-bold text-text-secondary">Judul Entri</th>
                                    <th className="p-3 px-6 font-bold text-text-secondary text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="4" className="text-center"><LoadingIndicator /></td></tr>
                                ) : error ? (
                                    <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="4" className="text-center text-red-500">{error}</td></tr>
                                ) : currentItems.length === 0 ? (
                                    <tr style={{ height: `${ITEMS_PER_PAGE * 60}px` }}><td colSpan="4" className="text-center text-text-secondary">Belum ada entri budaya.</td></tr>
                                ) : (
                                    <>
                                        {currentItems.map((entry, index) => (
                                            <tr key={entry._id} className={`border-b border-background hover:bg-background/50 ${selectedEntries.includes(entry._id) ? 'bg-primary/10' : ''}`} style={{ height: '60px' }}>
                                                <td className="p-3 px-6"><input type="checkbox" checked={selectedEntries.includes(entry._id)} onChange={() => handleSelect(entry._id)} /></td>
                                                <td className="p-3 px-6 text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                                <td className="p-3 px-6 font-semibold text-text truncate">{getLocalizedText(entry.title)}</td>
                                                <td className="p-3 px-6 text-right">
                                                    <div className="flex justify-end items-center gap-2">
                                                        <Link to={`/kamus-budaya/entry/${entry._id}`} target="_blank" rel="noopener noreferrer" className="bg-gray-500/10 text-text-secondary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-500/20">Pratinjau</Link>
                                                        <button onClick={() => setFormModal({ isOpen: true, mode: 'edit', data: entry })} className="bg-yellow-500/10 text-yellow-600 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-yellow-500/20">Edit</button>
                                                        <button onClick={() => setDeleteModal(entry)} className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-red-500/20">Delete</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {emptyRows.map((_, i) => <tr key={`empty-${i}`} style={{ height: '60px' }} className="border-b border-background"><td colSpan="4"></td></tr>)}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                {/* Mobile Cards Layout */}
                <div className="sm:hidden">
                    {isLoading ? (
                        <div className="p-8 text-center"><LoadingIndicator /></div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500">{error}</div>
                    ) : currentItems.length === 0 ? (
                        <div className="p-8 text-center text-text-secondary">Belum ada entri budaya.</div>
                    ) : (
                        <div className="divide-y divide-background">
                            {currentItems.map((entry) => (
                                <div key={entry._id} className={`p-4 ${selectedEntries.includes(entry._id) ? 'bg-primary/10' : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            <input type="checkbox" className="rounded mt-1 flex-shrink-0" checked={selectedEntries.includes(entry._id)} onChange={() => handleSelect(entry._id)} />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-semibold text-text truncate">{getLocalizedText(entry.title)}</h3>
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    <span className="text-xs px-2 py-1 bg-background rounded-full text-text-secondary">
                                                        ID: {getLocalizedText(entry.title, 'id') !== 'N/A' ? '✓' : '✗'}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-background rounded-full text-text-secondary">
                                                        SU: {getLocalizedText(entry.title, 'su') !== 'N/A' ? '✓' : '✗'}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-background rounded-full text-text-secondary">
                                                        EN: {getLocalizedText(entry.title, 'en') !== 'N/A' ? '✓' : '✗'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setDetailModalEntry(entry)} className="bg-primary/10 text-primary text-xs font-bold px-3 py-1.5 rounded-md hover:bg-primary/20 flex-shrink-0 ml-2">
                                            Detail
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {emptyRowsCount > 0 && <div style={{ height: `${emptyRowsCount * 70}px` }}></div>}
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-background">
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} totalItems={filteredAndSortedEntries.length} />
                </div>
            </div>

            <CultureEntryFormModal
                isOpen={formModal.isOpen}
                onClose={() => setFormModal({ isOpen: false, mode: 'add', data: null })}
                onSubmit={handleFormSubmit}
                mode={formModal.mode}
                initialData={formModal.data}
            />
            <ConfirmDeleteModal
                isOpen={!!deleteModal}
                onClose={() => setDeleteModal(null)}
                onConfirm={handleDeleteConfirm}
                title="Hapus Entri Budaya"
                message={selectedEntries.length > 0 ? `Yakin ingin menghapus ${selectedEntries.length} entri?` : `Yakin ingin menghapus entri "${getLocalizedText(deleteModal?.title)}"?`}
            />
            <ManageCultureEntryDetailModal
                entry={detailModalEntry}
                onClose={() => setDetailModalEntry(null)}
                onEdit={() => {
                    setFormModal({ isOpen: true, mode: 'edit', data: detailModalEntry });
                    setDetailModalEntry(null);
                }}
                onDelete={() => {
                    setDeleteModal(detailModalEntry);
                    setDetailModalEntry(null);
                }}
            />
        </div>
    );
};

export default ManageCultureEntriesPage;