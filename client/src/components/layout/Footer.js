import React from 'react';

// Path ke logo Balai Bahasa (pastikan sesuai struktur folder Anda)
const logoBalaiBahasa = '/assets/images/logo/tut-wuri-handayani.svg';

/**
 * Komponen footer utama aplikasi.
 * Menampilkan identitas Balai Bahasa, statistik pengunjung unik, dan copyright.
 * @param {number|string} totalUniqueVisitors - Jumlah total pengunjung unik (bisa string '...' saat loading).
 */
const Footer = ({ totalUniqueVisitors }) => {
    return (
        <footer className="bg-background-secondary text-text mt-8 border-t border-gray-200 dark:border-gray-700/50">
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8 items-center">
                    
                    {/* Kolom 1: Identitas Balai Bahasa */}
                    <div className="flex flex-col items-center md:flex-row md:justify-start gap-4">
                        <img src={logoBalaiBahasa} alt="Logo Balai Bahasa" className="h-14" />
                        <div className="text-center md:text-left">
                            <p className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100 leading-tight">BALAI BAHASA PROVINSI JAWA BARAT</p>
                            <p className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-200 leading-tight mt-0.5">BADAN PENGEMBANGAN DAN PEMBINAAN BAHASA</p>
                            <p className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 leading-tight mt-1">Kementerian Pendidikan Dasar dan Menengah Republik Indonesia</p>
                        </div>
                    </div>

                    {/* Kolom 2: Statistik Pengunjung */}
                    <div className="text-center">
                        <p className="text-sm text-text-secondary">Total Pengunjung</p>
                        <p className="text-3xl font-bold text-primary">
                            {/* Tampilkan angka dengan format lokal atau '...' saat loading */}
                            {typeof totalUniqueVisitors === 'number' 
                                ? totalUniqueVisitors.toLocaleString('id-ID') 
                                : '...'}
                        </p>
                    </div>

                    {/* Kolom 3: Copyright */}
                    <div className="text-center md:text-right text-sm text-text-secondary">
                        <p>&copy; {new Date().getFullYear()} Kang Agam.</p>
                        <p>Kamus Daring Tiga Bahasa.</p>
                    </div>

                </div>
            </div>
        </footer>
    );
};

export default Footer;