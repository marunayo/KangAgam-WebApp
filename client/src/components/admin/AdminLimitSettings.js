import React, { useState } from 'react';

/**
 * Komponen untuk menampilkan pengaturan batas admin (saat ini dinonaktifkan).
 * @param {number} currentLimit - Batas admin saat ini.
 */
const AdminLimitSettings = ({ currentLimit }) => {
    // State untuk menyimpan nilai limit (saat ini tidak digunakan aktif)
    const [limit, setLimit] = useState(currentLimit);

    return (
        <div className="bg-background-secondary p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="font-bold text-text mb-2">Pengaturan Superadmin</h4>
            <div className="flex items-center gap-4">
                <label htmlFor="maxAdmins" className="text-sm text-text-secondary">Maksimum Admin:</label>
                <input
                    type="number"
                    id="maxAdmins"
                    value={limit}
                    onChange={(e) => setLimit(e.target.value)}
                    className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-background text-text disabled:opacity-50 disabled:cursor-not-allowed"
                    min="1"
                    disabled // Dinonaktifkan
                />
                <button
                    disabled // Dinonaktifkan
                    className="bg-primary text-white font-bold px-4 py-1.5 rounded-lg text-sm hover:opacity-90 disabled:opacity-50"
                >
                    Simpan
                </button>
            </div>
            <p className="text-xs text-text-secondary mt-2 italic">Fitur ini untuk sementara dinonaktifkan.</p>
        </div>
    );
};

export default AdminLimitSettings;