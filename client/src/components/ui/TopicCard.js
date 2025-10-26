import React from 'react';

// Komponen internal untuk ikon mata (digunakan untuk jumlah kunjungan)
const EyeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

/**
 * Komponen kartu untuk menampilkan ringkasan topik.
 * Menampilkan gambar, judul, dan jumlah kunjungan (opsional). Dapat diklik.
 * @param {string} title - Judul topik.
 * @param {string} imageUrl - URL gambar topik.
 * @param {function} onClick - Fungsi yang dipanggil saat kartu diklik.
 * @param {number} visitCount - Jumlah kunjungan topik (opsional).
 */
const TopicCard = ({ title, imageUrl, onClick, visitCount }) => {
    return (
        // Gunakan elemen <button> untuk semantik yang lebih baik dan aksesibilitas keyboard
        <button 
            onClick={onClick}
            // Style kartu: background sesuai tema, shadow, efek hover, transisi
            className="group w-full bg-background-secondary rounded-2xl shadow-md overflow-hidden 
                       transform hover:-translate-y-1 transition-all 
                       duration-300 ease-in-out focus:outline-none 
                       focus:ring-2 focus:ring-offset-2 focus:ring-primary flex flex-col"
        >
            {/* Bagian Gambar */}
            {/* Area gambar dengan background sesuai tema */}
            <div className="w-full h-24 sm:h-28 bg-background">
                <img 
                    src={imageUrl} 
                    alt={title} // Teks alternatif penting untuk aksesibilitas
                    // Fallback jika gambar gagal dimuat, tampilkan placeholder
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/300x200/e2e8f0/4a5568?text=Gambar' }}
                    // Style gambar: object-cover agar memenuhi area, efek zoom saat hover
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" 
                />
            </div>
            {/* Bagian Teks (Judul dan Kunjungan) */}
            <div className="p-3 text-left flex-grow flex flex-col justify-between">
                {/* Judul Topik, warna teks sesuai tema */}
                <h3 className="text-text text-sm sm:text-base font-bold tracking-wider leading-tight">{title}</h3>
                
                {/* Jumlah Kunjungan (opsional) */}
                {/* Warna teks sekunder sesuai tema */}
                <div className="flex items-center gap-1.5 mt-2 text-xs text-text-secondary">
                    {/* Tampilkan ikon mata dan jumlah jika visitCount valid */}
                    {typeof visitCount === 'number' && visitCount > 0 ? (
                        <>
                            <EyeIcon />
                            {/* Format angka dengan pemisah ribuan */}
                            <span>{visitCount.toLocaleString('id-ID')}</span> 
                        </>
                    ) : (
                        // Beri spasi kosong agar layout konsisten jika tidak ada visitCount
                        <span>&nbsp;</span> 
                    )}
                </div>
            </div>
        </button>
    );
};

export default TopicCard;