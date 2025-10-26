import React from 'react';

/**
 * Komponen kartu untuk menampilkan satu item kosakata.
 * Menampilkan gambar dan teks kosakata. Dapat diklik untuk memicu aksi (misalnya memutar audio).
 * @param {string} content - Teks kosakata yang ditampilkan.
 * @param {string} imageUrl - URL gambar kosakata.
 * @param {function} onCardClick - Fungsi yang dipanggil saat kartu diklik.
 * @param {boolean} isActive - Menandakan apakah kartu ini sedang aktif/dipilih.
 * @param {boolean} isPlaying - Menandakan apakah audio kartu ini sedang diputar.
 * @param {boolean} isAnyAudioPlaying - Menandakan apakah ada audio lain (dari kartu lain) yang sedang diputar.
 */
const KosakataCard = ({ 
    content, 
    imageUrl, 
    onCardClick, 
    isActive, 
    isPlaying, 
    isAnyAudioPlaying 
}) => {

    // Menentukan gaya visual kartu berdasarkan statusnya (aktif, playing, normal)
    const highlightClasses = isPlaying 
        ? 'ring-4 ring-offset-2 ring-accent shadow-lg' // Efek glow saat audio kartu ini diputar
        : isActive 
        ? 'ring-2 ring-primary' // Efek sorot saat kartu ini aktif (misal setelah diklik)
        : 'shadow-md'; // Gaya normal

    // Menentukan apakah kartu dinonaktifkan (tidak bisa diklik)
    // Nonaktif jika ada audio lain yang sedang diputar DAN audio kartu ini TIDAK sedang diputar.
    const isDisabled = isAnyAudioPlaying && !isPlaying;

    return (
        <div 
            // Hanya bisa diklik jika tidak dinonaktifkan
            onClick={isDisabled ? undefined : onCardClick} 
            role="button" // Semantik untuk aksesibilitas
            tabIndex={isDisabled ? -1 : 0} // Dapat difokus dengan tab jika tidak dinonaktifkan
            // Memungkinkan klik dengan tombol Enter atau Spasi (aksesibilitas keyboard)
            onKeyDown={(e) => !isDisabled && (e.key === 'Enter' || e.key === ' ') && onCardClick()}
            // Kelas CSS utama dan kondisional untuk status disabled/enabled dan highlight
            className={`group w-full bg-background-secondary rounded-2xl overflow-hidden
                        transform transition-all duration-300
                        ${isDisabled 
                            ? 'opacity-50 cursor-not-allowed' // Gaya saat disabled
                            : 'cursor-pointer hover:scale-105 active:scale-95' // Gaya saat enabled
                        }
                        ${highlightClasses}`} // Tambahkan kelas highlight yang sudah ditentukan
        >
            {/* Bagian Gambar */}
            <div className="w-full h-20 sm:h-24 bg-background"> {/* Area gambar */}
                <img 
                    src={imageUrl} 
                    alt={content} // Teks alternatif untuk gambar
                    // Fallback jika gambar gagal dimuat, tampilkan placeholder
                    onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/200x200/e2e8f0/4a5568?text=?' }}
                    // Gaya gambar: object-contain agar pas, efek hover scale
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-110" 
                />
            </div>
            {/* Bagian Teks Kosakata */}
            <div className="p-3 text-center bg-primary/10"> {/* Area teks dengan background aksen */}
                <p className="text-primary font-bold text-lg sm:text-xl">{content}</p>
            </div>
        </div>
    );
};

export default KosakataCard;