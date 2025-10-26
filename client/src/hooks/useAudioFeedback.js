import { useMemo } from 'react';

// Daftar path file audio, relatif terhadap folder 'public'
const correctSoundPaths = [
    '/assets/audio/quiz/apresiasi-1.wav',
    '/assets/audio/quiz/apresiasi-2.wav',
];

const incorrectSoundPaths = [
    '/assets/audio/quiz/jawab-salah-1.wav',
    '/assets/audio/quiz/jawab-salah-2.wav',
];

/**
 * Custom Hook (Hook Kustom) untuk memutar audio feedback pada kuis.
 * Hook ini mengelola pembuatan objek Audio dan menyediakan
 * fungsi untuk memutar suara 'benar' atau 'salah' secara acak.
 */
const useAudioFeedback = () => {
    // Memoize (simpan) objek Audio agar tidak dibuat ulang pada setiap render
    // Ini penting untuk performa dan menghindari kebocoran memori.
    const correctAudios = useMemo(() => correctSoundPaths.map(path => new Audio(path)), []);
    const incorrectAudios = useMemo(() => incorrectSoundPaths.map(path => new Audio(path)), []);

    /**
     * Fungsi internal untuk memutar salah satu audio dari kumpulan (pool) yang diberikan.
     * Mengembalikan Promise yang akan resolve (selesai) saat audio selesai diputar.
     * @param {HTMLAudioElement[]} audioPool - Kumpulan audio (misal: correctAudios).
     * @returns {Promise<void>}
     */
    const playSound = (audioPool) => {
        return new Promise((resolve, reject) => {
            try {
                if (audioPool.length === 0) {
                    // Jika tidak ada audio, langsung resolve.
                    return resolve();
                }
                // Pilih audio secara acak dari kumpulan
                const randomIndex = Math.floor(Math.random() * audioPool.length);
                const audio = audioPool[randomIndex];

                // Hentikan audio lain yang mungkin sedang berjalan dari pool yang sama
                // Ini mencegah audio bertumpuk jika user menjawab terlalu cepat
                audioPool.forEach(a => {
                    if (!a.paused) {
                        a.pause();
                        a.currentTime = 0;
                    }
                });

                // Fungsi yang akan dijalankan saat audio selesai
                const onEnded = () => {
                    audio.removeEventListener('ended', onEnded); // Bersihkan listener
                    resolve(); // Selesaikan Promise
                };
                audio.addEventListener('ended', onEnded);
                
                audio.currentTime = 0; // Selalu mulai dari awal
                audio.play().catch(error => {
                    // Jika gagal memutar (misal: interaksi user belum terdeteksi)
                    audio.removeEventListener('ended', onEnded);
                    console.error("Gagal memutar audio:", error);
                    reject(error);
                });

            } catch (error) {
                console.error("Terjadi kesalahan pada fungsi playSound:", error);
                reject(error);
            }
        });
    };

    /**
     * Memutar salah satu audio 'benar' secara acak.
     */
    const playCorrectSound = () => playSound(correctAudios);

    /**
     * Memutar salah satu audio 'salah' secara acak.
     */
    const playIncorrectSound = () => playSound(incorrectAudios);

    // Kembalikan fungsi-fungsi yang bisa digunakan oleh komponen lain
    return { playCorrectSound, playIncorrectSound };
};

export default useAudioFeedback;