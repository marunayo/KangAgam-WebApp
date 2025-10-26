import { useMemo } from 'react';

// Path ke file audio Anda
const OPENING_SOUND_PATH = '/assets/audio/opening.wav';
const CLOSING_SOUND_PATH = '/assets/audio/closing.wav';

/**
 * Custom Hook (Hook Kustom) untuk memutar audio navigasi halaman (opening/closing).
 * Mengembalikan Promise yang resolve saat audio selesai diputar.
 */
const usePageAudio = () => {
    // Memoize objek audio agar tidak dibuat ulang pada setiap render
    const openingAudio = useMemo(() => new Audio(OPENING_SOUND_PATH), []);
    const closingAudio = useMemo(() => new Audio(CLOSING_SOUND_PATH), []);

    /**
     * Fungsi internal untuk memutar satu file audio.
     * Mengembalikan Promise yang akan resolve (selesai) saat audio selesai.
     * @param {HTMLAudioElement} audio - Objek audio yang akan diputar.
     * @returns {Promise<void>}
     */
    const playSound = (audio) => {
        return new Promise((resolve, reject) => {
            // Hentikan audio lain yang mungkin sedang berjalan
            // Mencegah audio opening dan closing tumpang tindih
            [openingAudio, closingAudio].forEach(a => {
                if (a !== audio && !a.paused) {
                    a.pause();
                    a.currentTime = 0;
                }
            });
            
            // Fungsi yang akan dijalankan saat audio selesai
            const onEnded = () => {
                audio.removeEventListener('ended', onEnded);
                resolve();
            };
            audio.addEventListener('ended', onEnded);

            audio.currentTime = 0; // Selalu mulai dari awal
            audio.play().catch(error => {
                audio.removeEventListener('ended', onEnded);
                console.error("Gagal memutar audio:", error);
                // Resolve agar alur aplikasi tidak berhenti jika audio gagal
                resolve(); 
            });
        });
    };

    /**
     * Memutar audio 'opening'
     */
    const playOpeningSound = () => playSound(openingAudio);

    /**
     * Memutar audio 'closing'
     */
    const playClosingSound = () => playSound(closingAudio);

    // Kembalikan fungsi-fungsi yang bisa digunakan oleh komponen lain
    return { playOpeningSound, playClosingSound };
};

export default usePageAudio;