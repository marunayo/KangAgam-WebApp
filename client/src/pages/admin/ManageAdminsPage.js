import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import settingService from '../../services/settingService';
import PageHeader from '../../components/ui/PageHeader';
import Pagination from '../../components/ui/Pagination';
import AdminFormModal from '../../components/admin/AdminFormModal';
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal';
import LoadingIndicator from '../../components/ui/LoadingIndicator';
import AdminLimitSettings from '../../components/admin/AdminLimitSettings';
import ManageAdminDetailModal from '../../components/admin/ManageAdminDetailModal';

const ITEMS_PER_PAGE = 5;

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

const ManageAdminsPage = () => {
    const { user } = useAuth();
    const [adminsData, setAdminsData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({ type: null, mode: null, data: null });
    const [detailModalAdmin, setDetailModalAdmin] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [settings, setSettings] = useState({ maxAdmins: 5 });

    // ✅ TAMBAHAN: Fungsi untuk mengecek apakah user adalah superadmin
    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    const fetchData = useCallback(async () => {
        if (!user?.token) return;
        setIsLoading(true);
        try {
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
            const adminFetch = adminService.getAllAdmins(user.token);
            const settingsFetch = settingService.getSettings(user.token);

            const [adminResponse, settingsResponse] = await Promise.all([
                adminFetch,
                settingsFetch,
                minDelay
            ]);

            setAdminsData(adminResponse.data || []);
            setSettings(settingsResponse || { maxAdmins: 5 });
            setError(null);
        } catch (err) {
            setError('Gagal memuat data.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredAdmins = adminsData.filter(
        (admin) =>
            admin.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.adminName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentItems = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);

    const handleOpenModal = (type, mode, data = null) => {
        // ✅ TAMBAHAN: Cek permission sebelum membuka modal tambah admin
        if (mode === 'add' && !isSuperAdmin) {
            alert('Hanya Superadmin yang dapat menambah admin baru.');
            return;
        }
        setModalState({ type, mode, data });
    };
    
    const handleCloseActionModal = () => {
        setModalState({ type: null, mode: null, data: null });
    };

    const handleCloseAllModals = () => {
        setModalState({ type: null, mode: null, data: null });
        setDetailModalAdmin(null);
    };

    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    const handleFormSubmit = async (formData) => {
        // ✅ TAMBAHAN: Double check permission saat submit form
        if (modalState.mode === 'add' && !isSuperAdmin) {
            alert('Hanya Superadmin yang dapat menambah admin baru.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalState.mode === 'add') {
                await adminService.createAdmin(formData, user.token);
                alert('Admin baru berhasil ditambahkan!');
            } else if (modalState.mode === 'edit') {
                await adminService.updateAdmin(modalState.data._id, formData, user.token);
                alert('Admin berhasil diperbarui!');
            }
            fetchData();
            handleCloseAllModals();
        } catch (err) {
            console.error('Form submit error:', err);
            const errorMessage = err.message || 'Terjadi kesalahan.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteConfirm = async () => {
        const adminToDelete = modalState.data;
        if (!adminToDelete) return;
        setIsSubmitting(true);
        try {
            await adminService.deleteAdmin(adminToDelete._id, user.token);
            alert('Admin berhasil dihapus!');
            fetchData();
            handleCloseAllModals();
        } catch (err) {
            console.error('Delete admin error:', err);
            const errorMessage = err.message || 'Gagal menghapus admin.';
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-text">Daftar Admin</h1>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon /></span>
                        <input 
                            type="text" 
                            placeholder="Cari..." 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-background-secondary text-text"
                        />
                    </div>
                    {/* ✅ PERBAIKAN: Tombol Tambah hanya muncul untuk Superadmin */}
                    {isSuperAdmin && (
                        <button 
                            onClick={() => handleOpenModal('form', 'add')} 
                            className="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 flex-shrink-0 text-sm"
                        >
                            <PlusIcon />
                            <span>Tambah</span>
                        </button>
                    )}
                    {/* ✅ TAMBAHAN: Pesan informasi untuk Admin */}
                    {isAdmin && (
                        <div className="text-sm text-text-secondary bg-yellow-100 dark:bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-300 dark:border-yellow-600">
                            Hanya Superadmin yang dapat menambah admin baru
                        </div>
                    )}
                </div>
            </div>

            {/* Panel Pengaturan Superadmin - tetap tersembunyi seperti sebelumnya */}
            {/* {isSuperAdmin && (
                <div className="mb-6">
                    <AdminLimitSettings 
                        currentLimit={settings.maxAdmins}
                        onSettingsUpdate={(newLimit) => setSettings({ ...settings, maxAdmins: newLimit })}
                    />
                </div>
            )} */}

            <div className="bg-background-secondary rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[5%]">No</th>
                            <th className="p-3 px-6 font-bold text-text-secondary">Nama</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[30%]">Posel</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[15%]">Peran</th>
                            <th className="p-3 px-6 font-bold text-text-secondary text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr><td colSpan="5" className="text-center p-8"><LoadingIndicator /></td></tr>
                        ) : error ? (
                            <tr><td colSpan="5" className="text-center p-8 text-red-500">{error}</td></tr>
                        ) : currentItems.length > 0 ? (
                            currentItems.map((admin, index) => (
                                <tr key={admin._id} className="border-b border-background hover:bg-background">
                                    <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                    <td className="p-3 px-6 text-text font-semibold truncate">{admin.adminName}</td>
                                    <td className="hidden sm:table-cell p-3 px-6 text-text-secondary truncate">{admin.adminEmail}</td>
                                    <td className="hidden sm:table-cell p-3 px-6 text-text-secondary capitalize">{admin.role}</td>
                                    <td className="p-3 px-6 text-right">
                                        <div className="hidden sm:flex justify-end items-center gap-2">
                                            <button onClick={() => handleOpenModal('form', 'edit', admin)} className="bg-yellow-500/10 text-yellow-600 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-yellow-500/20">Edit</button>
                                            {/* ✅ PERBAIKAN: Tombol Hapus hanya untuk Superadmin */}
                                            {isSuperAdmin && (
                                                <button onClick={() => handleOpenModal('delete', 'delete', admin)} className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-red-500/20">Hapus</button>
                                            )}
                                        </div>
                                        <div className="sm:hidden">
                                            <button onClick={() => setDetailModalAdmin(admin)} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-200">
                                                Detail
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan="5" className="text-center p-8 text-gray-500">Tidak ada admin yang ditemukan.</td></tr>
                        )}
                    </tbody>
                </table>
                <div className="p-4 border-t border-background">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={filteredAdmins.length}
                    />
                </div>
            </div>

            <AdminFormModal
                isOpen={modalState.type === 'form'}
                onClose={handleCloseActionModal}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting}
                mode={modalState.mode}
                initialData={modalState.data}
            />
            <ConfirmDeleteModal
                isOpen={modalState.type === 'delete'}
                onClose={handleCloseActionModal}
                onConfirm={handleDeleteConfirm}
                title="Hapus Admin"
                message={`Apakah Anda yakin ingin menghapus admin "${modalState.data?.adminEmail}"?`}
            />
            <ManageAdminDetailModal 
                admin={detailModalAdmin}
                onClose={() => setDetailModalAdmin(null)}
                onEdit={() => handleOpenModal('form', 'edit', detailModalAdmin)}
                onDelete={() => isSuperAdmin ? handleOpenModal('delete', 'delete', detailModalAdmin) : alert('Hanya Superadmin yang dapat menghapus admin.')}
            />
        </div>
    );
};

export default ManageAdminsPage;