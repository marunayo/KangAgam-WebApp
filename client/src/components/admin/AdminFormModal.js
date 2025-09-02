// AdminFormModal.js (Unchanged)
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

    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && initialData) {
                setFormData({
                    adminName: initialData.adminName || '',
                    adminEmail: initialData.adminEmail || '',
                    role: initialData.role || 'admin',
                    adminPassword: '',
                    confirmPassword: '',
                });
            } else {
                setFormData({
                    adminName: '',
                    adminEmail: '',
                    adminPassword: '',
                    confirmPassword: '',
                    role: 'admin',
                });
            }
            setError('');
        }
    }, [isOpen, mode, initialData]);

    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validasi client-side
        if (!formData.adminName || !formData.adminEmail || !formData.role) {
            setError('Nama, email, dan role wajib diisi.');
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

        const { confirmPassword, ...dataToSubmit } = formData;

        if (mode === 'edit' && !dataToSubmit.adminPassword) {
            delete dataToSubmit.adminPassword;
        }

        console.log('Submitting form data:', dataToSubmit);
        onSubmit(dataToSubmit);
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
                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-600 mb-1">
                                        Peran
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white"
                                        required
                                    >
                                        <option value="admin">Admin</option>
                                        <option value="superadmin">Superadmin</option>
                                    </select>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label
                                            htmlFor="adminPassword"
                                            className="block text-sm font-medium text-gray-600 mb-1"
                                        >
                                            {mode === 'edit' ? 'Kata sandi Baru (Opsional)' : 'Kata sandi'}
                                        </label>
                                        <input
                                            type="password"
                                            id="adminPassword"
                                            name="adminPassword"
                                            value={formData.adminPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            required={mode === 'add'}
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="confirmPassword"
                                            className="block text-sm font-medium text-gray-600 mb-1"
                                        >
                                            Konfirmasi kata sandi
                                        </label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            name="confirmPassword"
                                            value={formData.confirmPassword}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg"
                                            required={mode === 'add'}
                                        />
                                    </div>
                                </div>
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