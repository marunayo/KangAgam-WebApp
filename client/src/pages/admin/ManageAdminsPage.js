import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext'; // Hook otentikasi
import adminService from '../../services/adminService'; // Service untuk API admin
import settingService from '../../services/settingService'; // Service untuk API settings (jika diperlukan)
import PageHeader from '../../components/ui/PageHeader'; // Komponen header halaman
import Pagination from '../../components/ui/Pagination'; // Komponen pagination
import AdminFormModal from '../../components/admin/AdminFormModal'; // Modal form tambah/edit admin
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal'; // Modal konfirmasi hapus
import LoadingIndicator from '../../components/ui/LoadingIndicator'; // Indikator loading
// import AdminLimitSettings from '../../components/admin/AdminLimitSettings'; // Komponen pengaturan limit (saat ini tidak aktif)
import ManageAdminDetailModal from '../../components/admin/ManageAdminDetailModal'; // Modal detail admin (mobile)
import StatusModal from '../../components/admin/StatusModal'; // Modal notifikasi sukses/error

// Konstanta untuk jumlah item per halaman
const ITEMS_PER_PAGE = 5;

// Komponen ikon internal
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>;

/**
 * Komponen halaman untuk mengelola data administrator (Admin dan Superadmin).
 * Memungkinkan pencarian, penambahan (Superadmin), pengeditan, dan penghapusan (Superadmin) admin.
 */
const ManageAdminsPage = () => {
    const { user } = useAuth(); // Ambil data user (terutama role dan token)
    const [adminsData, setAdminsData] = useState([]); // State untuk menyimpan daftar admin
    const [isLoading, setIsLoading] = useState(true); // State status loading data
    const [isSubmitting, setIsSubmitting] = useState(false); // State status submit form/delete
    const [error, setError] = useState(null); // State untuk pesan error fetch data
    const [searchTerm, setSearchTerm] = useState(''); // State untuk input pencarian
    // State untuk mengontrol modal (form tambah/edit, konfirmasi delete)
    const [modalState, setModalState] = useState({ type: null, mode: null, data: null }); 
    // State untuk modal detail admin di mobile
    const [detailModalAdmin, setDetailModalAdmin] = useState(null); 
    // State untuk halaman pagination saat ini
    const [currentPage, setCurrentPage] = useState(1); 
    // State untuk menyimpan pengaturan aplikasi (misal: maxAdmins)
    const [settings, setSettings] = useState({ maxAdmins: 5 }); 
    // State untuk modal notifikasi status (sukses/error)
    const [statusModal, setStatusModal] = useState({ isOpen: false, message: '', type: 'success' });

    // Cek role user saat ini
    const isSuperAdmin = user?.role?.toLowerCase() === 'superadmin';
    const isAdmin = user?.role?.toLowerCase() === 'admin';

    // Fungsi untuk mengambil data admin dan settings dari API
    // Dibungkus useCallback agar tidak dibuat ulang di setiap render kecuali dependensinya berubah
    const fetchData = useCallback(async () => {
        if (!user?.token) return; // Jangan fetch jika tidak ada token
        setIsLoading(true); // Mulai loading
        try {
            // Tambahkan delay minimum 1 detik untuk efek loading yang lebih terlihat
            const minDelay = new Promise(resolve => setTimeout(resolve, 1000)); 
            // Panggil API secara paralel
            const adminFetch = adminService.getAllAdmins(user.token);
            const settingsFetch = settingService.getSettings(user.token);

            // Tunggu semua promise selesai
            const [adminResponse, settingsResponse] = await Promise.all([
                adminFetch,
                settingsFetch,
                minDelay // Pastikan delay minimum terpenuhi
            ]);

            // Update state dengan data dari API
            setAdminsData(adminResponse.data || []); // Default ke array kosong jika tidak ada data
            setSettings(settingsResponse || { maxAdmins: 5 }); // Default settings jika API gagal
            setError(null); // Bersihkan error jika fetch berhasil
        } catch (err) {
            setError('Gagal memuat data.'); // Set pesan error jika fetch gagal
            console.error(err);
        } finally {
            setIsLoading(false); // Selesai loading
        }
    }, [user]); // Dependensi: user (terutama user.token)

    // Panggil fetchData saat komponen dimuat atau fetchData berubah
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filter data admin berdasarkan searchTerm (nama atau email)
    const filteredAdmins = adminsData.filter(
        (admin) =>
            admin.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
            admin.adminName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Logika pagination: hitung index item pertama dan terakhir di halaman ini
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    // Ambil data admin untuk halaman saat ini
    const currentItems = filteredAdmins.slice(indexOfFirstItem, indexOfLastItem);
    // Hitung total halaman
    const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);

    // Handler untuk membuka modal (form atau delete)
    const handleOpenModal = (type, mode, data = null) => {
        // Cek izin: Hanya superadmin yang boleh membuka modal 'add'
        if (mode === 'add' && !isSuperAdmin) {
            setStatusModal({ isOpen: true, message: 'Hanya Superadmin yang dapat menambah admin baru.', type: 'error' });
            return; // Hentikan fungsi jika tidak diizinkan
        }
        // Set state modal sesuai tipe, mode, dan data yang diberikan
        setModalState({ type, mode, data });
    };

    // Handler untuk menutup modal aksi (form atau delete)
    const handleCloseActionModal = () => {
        setModalState({ type: null, mode: null, data: null }); // Reset state modal
    };

    // Handler untuk menutup semua modal (aksi dan detail)
    const handleCloseAllModals = () => {
        setModalState({ type: null, mode: null, data: null }); // Reset modal aksi
        setDetailModalAdmin(null); // Reset modal detail
    };

    // Handler untuk mengganti halaman pagination
    const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

    // Handler untuk submit form (tambah atau edit admin)
    const handleFormSubmit = async (formData) => {
        // Validasi ulang izin untuk 'add' (meskipun sudah divalidasi di handleOpenModal)
        if (modalState.mode === 'add' && !isSuperAdmin) {
            setStatusModal({ isOpen: true, message: 'Hanya Superadmin yang dapat menambah admin baru.', type: 'error' });
            return;
        }

        setIsSubmitting(true); // Mulai proses submit
        try {
            if (modalState.mode === 'add') { // Jika mode 'tambah'
                await adminService.createAdmin(formData, user.token); // Panggil API create
                setStatusModal({ isOpen: true, message: 'Admin baru berhasil ditambahkan!', type: 'success' });
            } else if (modalState.mode === 'edit') { // Jika mode 'edit'
                if (formData.isPasswordChange) { // Jika ada flag perubahan password dari form
                    // Panggil API changePassword
                    await adminService.changePassword(
                        modalState.data._id, // ID admin yang diedit
                        {
                            newPassword: formData.newPassword,
                            confirmPassword: formData.confirmPassword,
                        },
                        user.token
                    );
                    setStatusModal({ isOpen: true, message: 'Password berhasil diperbarui!', type: 'success' });
                } else { // Jika tidak ada perubahan password (hanya nama/email/role)
                    // Panggil API updateAdmin
                    await adminService.updateAdmin(modalState.data._id, formData, user.token);
                    setStatusModal({ isOpen: true, message: 'Admin berhasil diperbarui!', type: 'success' });
                }
            }
            fetchData(); // Ambil ulang data terbaru setelah submit berhasil
            handleCloseAllModals(); // Tutup semua modal
        } catch (err) {
            console.error('Form submit error:', err);
            // Tampilkan pesan error dari API atau pesan default
            const errorMessage = err.response?.data?.message || 'Terjadi kesalahan.';
            setStatusModal({ isOpen: true, message: errorMessage, type: 'error' });
        } finally {
            setIsSubmitting(false); // Selesai proses submit
        }
    };

    // Handler untuk konfirmasi penghapusan admin
    const handleDeleteConfirm = async () => {
        const adminToDelete = modalState.data; // Ambil data admin yang akan dihapus dari state modal
        if (!adminToDelete) return; // Jangan lakukan apa pun jika tidak ada data

        setIsSubmitting(true); // Mulai proses delete
        try {
            await adminService.deleteAdmin(adminToDelete._id, user.token); // Panggil API delete
            setStatusModal({ isOpen: true, message: 'Admin berhasil dihapus!', type: 'success' });
            fetchData(); // Ambil ulang data terbaru
            handleCloseAllModals(); // Tutup semua modal
        } catch (err) {
            console.error('Delete admin error:', err);
            // Tampilkan pesan error dari API atau pesan default
            const errorMessage = err.response?.data?.message || 'Gagal menghapus admin.';
            setStatusModal({ isOpen: true, message: errorMessage, type: 'error' });
        } finally {
            setIsSubmitting(false); // Selesai proses delete
        }
    };

    return (
        <div>
            {/* Header Halaman */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-text">Daftar Admin</h1>
                {/* Input Pencarian dan Tombol Tambah */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Input Pencarian */}
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
                    {/* Tombol Tambah (hanya untuk Superadmin) */}
                    {isSuperAdmin && (
                        <button 
                            onClick={() => handleOpenModal('form', 'add')} 
                            className="bg-primary text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 flex-shrink-0 text-sm"
                        >
                            <PlusIcon />
                            <span>Tambah</span>
                        </button>
                    )}
                    {/* Info untuk Admin biasa */}
                    {isAdmin && (
                        <div className="text-sm text-text-secondary bg-yellow-100 dark:bg-yellow-900/20 px-3 py-2 rounded-lg border border-yellow-300 dark:border-yellow-600">
                            Hanya Superadmin yang dapat menambah admin baru
                        </div>
                    )}
                </div>
            </div>

            {/* Tabel Data Admin */}
            <div className="bg-background-secondary rounded-xl shadow-md overflow-x-auto">
                <table className="w-full text-left">
                    {/* Header Tabel */}
                    <thead className="bg-slate-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[5%]">No</th>
                            <th className="p-3 px-6 font-bold text-text-secondary">Nama</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[30%]">Posel</th>
                            <th className="hidden sm:table-cell p-3 px-6 font-bold text-text-secondary w-[15%]">Peran</th>
                            <th className="p-3 px-6 font-bold text-text-secondary text-right">Aksi</th>
                        </tr>
                    </thead>
                    {/* Body Tabel */}
                    <tbody>
                        {isLoading ? ( // Tampilkan loading indicator
                            <tr><td colSpan="5" className="text-center p-8"><LoadingIndicator /></td></tr>
                        ) : error ? ( // Tampilkan pesan error
                            <tr><td colSpan="5" className="text-center p-8 text-red-500">{error}</td></tr>
                        ) : currentItems.length > 0 ? ( // Tampilkan data jika ada
                            currentItems.map((admin, index) => (
                                <tr key={admin._id} className="border-b border-background hover:bg-background">
                                    {/* Kolom Nomor (hanya desktop) */}
                                    <td className="hidden sm:table-cell p-3 px-6 text-text-secondary">{indexOfFirstItem + index + 1}</td>
                                    {/* Kolom Nama */}
                                    <td className="p-3 px-6 text-text font-semibold truncate">{admin.adminName}</td>
                                    {/* Kolom Email (hanya desktop) */}
                                    <td className="hidden sm:table-cell p-3 px-6 text-text-secondary truncate">{admin.adminEmail}</td>
                                    {/* Kolom Role (hanya desktop) */}
                                    <td className="hidden sm:table-cell p-3 px-6 text-text-secondary capitalize">{admin.role}</td>
                                    {/* Kolom Aksi */}
                                    <td className="p-3 px-6 text-right">
                                        {/* Tombol Aksi Desktop (Edit, Hapus) */}
                                        <div className="hidden sm:flex justify-end items-center gap-2">
                                            <button onClick={() => handleOpenModal('form', 'edit', admin)} className="bg-yellow-500/10 text-yellow-600 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-yellow-500/20">Edit</button>
                                            {/* Tombol Hapus hanya untuk Superadmin */}
                                            {isSuperAdmin && (
                                                <button onClick={() => handleOpenModal('delete', 'delete', admin)} className="bg-red-500/10 text-red-500 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-red-500/20">Hapus</button>
                                            )}
                                        </div>
                                        {/* Tombol Aksi Mobile (Detail) */}
                                        <div className="sm:hidden">
                                            <button onClick={() => setDetailModalAdmin(admin)} className="bg-gray-100 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-md hover:bg-gray-200">
                                                Detail
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : ( // Tampilkan pesan jika tidak ada data
                            <tr><td colSpan="5" className="text-center p-8 text-gray-500">Tidak ada admin yang ditemukan.</td></tr>
                        )}
                    </tbody>
                </table>
                {/* Footer Tabel (Pagination) */}
                <div className="p-4 border-t border-background">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        totalItems={filteredAdmins.length} // Kirim total item yang sudah difilter
                    />
                </div>
            </div>

            {/* Modal Form Tambah/Edit Admin */}
            <AdminFormModal
                isOpen={modalState.type === 'form'}
                onClose={handleCloseActionModal}
                onSubmit={handleFormSubmit}
                isSubmitting={isSubmitting} // Status submit untuk disable tombol
                mode={modalState.mode} // 'add' atau 'edit'
                initialData={modalState.data} // Data awal untuk mode 'edit'
            />
            {/* Modal Konfirmasi Hapus */}
            <ConfirmDeleteModal
                isOpen={modalState.type === 'delete'}
                onClose={handleCloseActionModal}
                onConfirm={handleDeleteConfirm}
                title="Hapus Admin"
                message={`Apakah Anda yakin ingin menghapus admin "${modalState.data?.adminEmail}"?`}
            />
            {/* Modal Detail Admin (Mobile) */}
            <ManageAdminDetailModal 
                admin={detailModalAdmin}
                onClose={() => setDetailModalAdmin(null)}
                // Buka modal form edit saat tombol Edit di modal detail diklik
                onEdit={() => handleOpenModal('form', 'edit', detailModalAdmin)}
                // Buka modal delete saat tombol Hapus di modal detail diklik (cek izin superadmin)
                onDelete={() => isSuperAdmin ? handleOpenModal('delete', 'delete', detailModalAdmin) : setStatusModal({ isOpen: true, message: 'Hanya Superadmin yang dapat menghapus admin.', type: 'error' })}
            />
            {/* Modal Notifikasi Status */}
            <StatusModal
                isOpen={statusModal.isOpen}
                onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
                message={statusModal.message}
                type={statusModal.type} // 'success' atau 'error'
            />
        </div>
    );
};

export default ManageAdminsPage;