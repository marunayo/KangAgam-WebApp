import React from 'react';

// Komponen internal untuk ikon mata
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

/**
 * Komponen header standar untuk halaman.
 * Menampilkan judul utama, jumlah kunjungan (opsional), dan slot untuk children (misalnya tombol).
 * @param {string} title - Judul halaman.
 * @param {React.ReactNode} children - Elemen tambahan yang ingin ditampilkan di sebelah kanan header (misalnya tombol).
 * @param {number} visitCount - Jumlah kunjungan topik (opsional).
 */
const PageHeader = ({ title, children, visitCount }) => {
    return (
        // Container utama, flex row di layar sm ke atas, flex col di mobile
        <div className="flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
            {/* Bagian Kiri: Judul dan Jumlah Kunjungan */}
            <div>
                {/* Wrapper untuk judul dan badge kunjungan */}
                <div className="flex items-center gap-3 justify-center sm:justify-start">
                    {/* Judul halaman, menggunakan warna teks tema */}
                    <h1 className="text-3xl sm:text-4xl font-extrabold text-text tracking-tight">{title}</h1>
                    
                    {/* Badge Jumlah Kunjungan (hanya tampil jika visitCount adalah angka > 0) */}
                    {typeof visitCount === 'number' && visitCount > 0 && (
                        // Badge menggunakan warna background dan teks tema
                        <div className="flex items-center gap-1.5 text-sm text-text-secondary bg-background-secondary px-3 py-1 rounded-full mt-1">
                            <EyeIcon /> {/* Ikon mata */}
                            {/* Tampilkan angka dengan format lokal */}
                            <span>{visitCount.toLocaleString('id-ID')}</span> 
                        </div>
                    )}
                </div>
            </div>
            {/* Bagian Kanan: Slot untuk children (misalnya tombol) */}
            <div className="mt-4 sm:mt-0"> {/* Margin atas di mobile */}
                {children}
            </div>
        </div>
    );
};

export default PageHeader;