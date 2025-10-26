import React from 'react';

/**
 * Komponen Pagination untuk navigasi antar halaman data.
 * Menampilkan informasi halaman saat ini, total halaman, dan tombol navigasi.
 * @param {number} currentPage - Nomor halaman saat ini.
 * @param {number} totalPages - Jumlah total halaman.
 * @param {function} onPageChange - Fungsi callback yang dipanggil saat halaman diubah.
 * @param {number} totalItems - Jumlah total item data (untuk informasi tambahan).
 */
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems }) => {
    // Array untuk menyimpan nomor halaman yang akan dirender
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
    }

    // Jika hanya ada 1 halaman atau kurang, tampilkan hanya total item
    if (totalPages <= 1) {
        return (
            <div className="flex justify-between items-center mt-6">
                {/* Tampilkan total item */}
                <p className="text-sm text-text-secondary">
                    Total: <span className="font-bold text-text">{totalItems}</span> data
                </p>
            </div>
        );
    }

    // Render komponen pagination lengkap jika lebih dari 1 halaman
    return (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
            {/* Tampilkan informasi halaman saat ini dan total halaman */}
            <p className="text-sm text-text-secondary">
                Halaman <span className="font-bold text-text">{currentPage}</span> dari <span className="font-bold text-text">{totalPages}</span>
            </p>
            {/* Tombol navigasi halaman */}
            <div className="flex items-center gap-2">
                {/* Tombol Halaman Sebelumnya */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1} // Nonaktif jika di halaman pertama
                    // Style tombol, termasuk warna tema dan status disabled
                    className="bg-background-secondary text-text text-sm font-bold w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Halaman sebelumnya"
                >
                    &larr; {/* Panah Kiri */}
                </button>
                {/* Tombol Nomor Halaman */}
                {pageNumbers.map(number => (
                    <button
                        key={number}
                        onClick={() => onPageChange(number)}
                        // Style tombol nomor halaman, bedakan style untuk halaman aktif
                        className={`${
                            currentPage === number
                                ? 'bg-primary text-white border-primary' // Style aktif
                                : 'bg-background-secondary text-text border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700' // Style normal
                        } text-sm font-bold w-8 h-8 rounded-md transition-colors`}
                    >
                        {number}
                    </button>
                ))}
                {/* Tombol Halaman Berikutnya */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages} // Nonaktif jika di halaman terakhir
                    // Style tombol, termasuk warna tema dan status disabled
                    className="bg-background-secondary text-text text-sm font-bold w-8 h-8 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Halaman berikutnya"
                >
                    &rarr; {/* Panah Kanan */}
                </button>
            </div>
        </div>
    );
};

export default Pagination;