import { useMemo } from 'react';

// Path ke file audio Anda
const OPENING_SOUND_PATH = '/assets/audio/system/opening.wav';
const CLOSING_SOUND_PATH = '/assets/audio/system/closing-1.wav';

/**
 * Custom Hook untuk memutar audio navigasi halaman (opening/closing).
 * Mengembalikan Promise yang resolve saat audio selesai diputar.
 */
const usePageAudio = () => {
    const openingAudio = useMemo(() => new Audio(OPENING_SOUND_PATH), []);
    const closingAudio = useMemo(() => new Audio(CLOSING_SOUND_PATH), []);

    const playSound = (audio) => {
        return new Promise((resolve, reject) => {
            // Hentikan audio lain yang mungkin sedang berjalan
            [openingAudio, closingAudio].forEach(a => {
                if (a !== audio && !a.paused) {
                    a.pause();
                    a.currentTime = 0;
                }
            });
            
            const onEnded = () => {
                audio.removeEventListener('ended', onEnded);
                resolve();
            };
            audio.addEventListener('ended', onEnded);

            audio.currentTime = 0;
            audio.play().catch(error => {
                audio.removeEventListener('ended', onEnded);
                console.error("Gagal memutar audio:", error);
                // Resolve agar alur aplikasi tidak berhenti jika audio gagal
                resolve(); 
            });
        });
    };

    const playOpeningSound = () => playSound(openingAudio);
    const playClosingSound = () => playSound(closingAudio);

    return { playOpeningSound, playClosingSound };
};

export default usePageAudio;