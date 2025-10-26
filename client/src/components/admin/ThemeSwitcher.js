import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';

// Definisikan tema yang tersedia
const themes = [
    { name: 'light', color: '#5270FD' }, // Biru
    { name: 'dark', color: '#111827' },  // Hitam
    { name: 'sunset', color: '#F97316' }, // Oranye
];

// Komponen internal untuk ikon Palet Warna
const PaletteIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
);

/**
 * Komponen untuk menampilkan tombol dan pop-up pilihan tema.
 */
const ThemeSwitcher = () => {
    const { theme, changeTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Efek untuk menutup popup saat pengguna mengklik di luar area popup
    useEffect(() => {
        if (!isOpen) return;

        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        
        // Tambahkan event listener setelah render awal
        setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 0);
        
        // Cleanup event listener
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div ref={wrapperRef} className="relative">
            {/* Tombol utama untuk membuka/menutup pilihan tema */}
            <button
                onClick={() => setIsOpen(prev => !prev)}
                className="p-3 rounded-lg text-text-secondary hover:bg-background"
                title="Ganti Tema"
            >
                <PaletteIcon />
            </button>

            {/* Popup pilihan tema */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute bottom-full left-0 mb-3 p-2 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center gap-2 bg-background-secondary"
                    >
                        {themes.map((t) => (
                            <button
                                key={t.name}
                                onClick={() => {
                                    changeTheme(t.name);
                                    setIsOpen(false);
                                }}
                                className={`w-6 h-6 rounded-full transition-transform duration-200 focus:outline-none
                                    ${ theme === t.name ? 'ring-2 ring-offset-2 ring-primary ring-offset-background-secondary' : '' }
                                `}
                                style={{ backgroundColor: t.color }}
                                title={`Ganti ke tema ${t.name}`}
                            />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ThemeSwitcher;