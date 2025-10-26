import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Komponen kartu (card) yang dapat diklik untuk menu navigasi.
 * @param {React.Element} icon - Elemen ikon yang akan ditampilkan.
 * @param {string} title - Judul kartu.
 * @param {string} description - Deskripsi singkat di bawah judul.
 * @param {string} to - Path tujuan (URL) saat kartu diklik.
 */
const MenuCard = ({ icon, title, description, to }) => {
    return (
        <Link 
            to={to} 
            // Menggunakan 'group' untuk memungkinkan efek hover pada elemen anak
            className="bg-background-secondary p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow flex items-start gap-6 group"
        >
            <div className="flex-shrink-0 p-4 bg-gray-200 dark:bg-gray-700 rounded-lg mt-1 transition-colors group-hover:bg-gray-300 dark:group-hover:bg-gray-600">
                {/* Meng-clone elemen ikon untuk menambahkan kelas CSS baru */}
                {React.cloneElement(icon, { 
                    className: `${icon.props.className || ''} h-8 w-8 text-gray-800 dark:text-gray-100 transition-colors group-hover:text-primary`
                })}
            </div>
            <div>
                <h3 className="text-base sm:text-lg font-bold text-text transition-colors group-hover:text-primary">
                    {title}
                </h3>
                <p className="text-sm text-text-secondary mt-1">
                    {description}
                </p>
            </div>
        </Link>
    );
};

export default MenuCard;