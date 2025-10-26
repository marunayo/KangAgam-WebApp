import React from 'react';

/**
 * Komponen kartu (card) untuk menampilkan statistik singkat.
 * @param {React.Element} icon - Elemen ikon.
 * @param {string} title - Label statistik (cth: "Total Pengguna").
 * @param {string|number} value - Nilai statistik (cth: "1,200").
 * @param {string} bgColor - Kelas warna background untuk light mode.
 * @param {string} darkBgColor - Kelas warna background untuk dark mode.
 */
const StatCard = ({ icon, title, value, bgColor, darkBgColor }) => {
    return (
        // Menerapkan warna background untuk light & dark mode
        <div className={`p-4 rounded-xl flex items-center gap-4 ${bgColor} ${darkBgColor}`}>
            
            {/* Background ikon dibuat sedikit transparan & adaptif */}
            <div className="flex-shrink-0 p-3 bg-white/40 dark:bg-black/20 rounded-lg">
                {icon}
            </div>

            <div>
                {/* Warna teks judul dibuat adaptif */}
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 font-medium">
                    {title}
                </p>
                {/* Warna teks value dibuat adaptif */}
                <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-50">
                    {value}
                </p>
            </div>
        </div>
    );
};

export default StatCard;