import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const AdminFormModal = ({ isOpen, onClose, onSubmit, isSubmitting, mode, initialData }) => {
    const [formData, setFormData] = useState({
        adminName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
        role: 'admin',
    });
    const [error, setError] = useState('');
    const [passwordTouched, setPasswordTouched] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    adminName: initialData.adminName || '',
                    adminEmail: initialData.adminEmail || '',
                    role: initialData.role || 'admin', // FIXED: Preserve existing role
                    adminPassword: '',
                    confirmPassword: '',
                });
            } else {
                setFormData({
                    adminName: '',
                    adminEmail: '',
                    adminPassword: '',
                    confirmPassword: '',
                    role: 'admin', // Default role for new admins
                });
            }
            setError('');
            setPasswordTouched(false);
        }
    }, [isOpen, mode, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name === 'adminPassword' || name === 'confirmPassword') {
            setPasswordTouched(true);
        }
        
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.adminName || !formData.adminEmail) {
            setError('Nama dan email wajib diisi.');
            return;
        }

        if (mode === 'add') {
            if (!formData.adminPassword || !formData.confirmPassword) {
                setError('Kata sandi dan konfirmasi kata sandi wajib diisi.');
                return;
            }
            if (formData.adminPassword !== formData.confirmPassword) {
                setError('Kata sandi dan konfirmasi kata sandi tidak cocok.');
                return;
            }
        }

        if (mode === 'edit' && passwordTouched) {
            if (!formData.adminPassword || !formData.confirmPassword) {
                setError('Jika ingin mengubah password, kedua field password harus diisi.');
                return;
            }
            if (formData.adminPassword !== formData.confirmPassword) {
                setError('Kata sandi baru dan konfirmasi kata sandi tidak cocok.');
                return;
            }
        }

        try {
            const dataToSubmit = {
                adminName: formData.adminName,
                adminEmail: formData.adminEmail,
                role: formData.role, // FIXED: Send the actual role from formData
            };

            if (mode === 'add') {
                dataToSubmit.adminPassword = formData.adminPassword;
                await onSubmit(dataToSubmit);
            } else {
                if (passwordTouched && formData.adminPassword && formData.confirmPassword) {
                    await onSubmit({
                        ...dataToSubmit,
                        newPassword: formData.adminPassword,
                        confirmPassword: formData.confirmPassword,
                        isPasswordChange: true,
                    });
                } else {
                    await onSubmit(dataToSubmit);
                }
            }
        } catch (err) {
            setError(err.message || 'Terjadi kesalahan saat menyimpan data.');
        }
    };

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
                        transition={{ duration: 0.2 }}
                        className="bg-white rounded-2xl shadow-xl w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit}>
                            <header className="flex items-center justify-between p-6 border-b">
                                <h2 className="text-xl font-bold text-gray-800">{mode === 'edit' ? 'Edit Admin' : 'Tambah Admin'}</h2>
                                <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
                                    <CloseIcon />
                                </button>
                            </header>
                            <main className="p-6 space-y-4">
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div>
                                    <label htmlFor="adminName" className="block text-sm font-medium text-gray-600 mb-1">
                                        Nama
                                    </label>
                                    <input
                                        type="text"
                                        id="adminName"
                                        name="adminName"
                                        value={formData.adminName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-300"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="adminEmail" className="block text-sm font-medium text-gray-600 mb-1">
                                        Posel
                                    </label>
                                    <input
                                        type="email"
                                        id="adminEmail"
                                        name="adminEmail"
                                        value={formData.adminEmail}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="adminPassword"
                                            className="block text-sm font-medium text-gray-600 mb-1"
                                        >
                                            {mode === 'edit' ? 'Kata Sandi Baru (Opsional)' : 'Kata Sandi'}
                                        </label>
                                        <input
                                            type="password"
                                            id="adminPassword"
                                            name="adminPassword"
                                            value={formData.adminPassword}
                                            onChange={handleChange}
                                            onFocus={() => setPasswordTouched(true)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            required={mode === 'add'}
                                            placeholder={mode === 'edit' ? 'Kosongkan jika tidak ingin mengubah password' : ''}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block text-sm font-medium text-gray-600 mb-1"
                                        >
                                            Konfirmasi Kata Sandi {mode === 'edit' ? '(Opsional)' : ''}
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            onFocus={() => setPasswordTouched(true)}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            required={mode === 'add'}
                                            placeholder={mode === 'edit' ? 'Kosongkan jika tidak ingin mengubah password' : ''}
                                            autoComplete="new-password"
                                        />
                                    </div>
                                </div>
                                {mode === 'edit' && (
                                    <div className="bg-blue-50 p-3 rounded-lg">
                                        <p className="text-sm text-blue-700">
                                            <strong>Catatan:</strong> Kosongkan field password jika Anda hanya ingin mengubah nama atau email. Password hanya akan diubah jika Anda mengisi kedua field password.
                                        </p>
                                    </div>
                                )}
                            </main>
                            <footer className="p-6 bg-gray-50 rounded-b-2xl">
                                <button
                                    type="submit"
                                    className="w-full bg-blue-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Memproses...' : mode === 'edit' ? 'Simpan Perubahan' : 'Tambah'}
                                </button>
                            </footer>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AdminFormModal;