import React, { createContext, useContext, useState, useEffect } from 'react';

// Membuat React Context baru untuk menampung state tema
const ThemeContext = createContext();

// Komponen Provider yang akan membungkus aplikasi
// Bertanggung jawab mengelola tema (light/dark/dll) dan menerapkannya
export const ThemeProvider = ({ children }) => {
    // State 'theme' diinisialisasi dari localStorage, atau default ke 'light'
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

    // useEffect ini berjalan saat 'theme' berubah
    // Tujuannya untuk menerapkan tema ke dokumen dan menyimpannya
    useEffect(() => {
        const root = window.document.documentElement; // Mengambil tag <html>
        
        // Hapus class 'dark' lama (jika ada, untuk kompatibilitas)
        root.classList.remove('dark');
        
        // Atur atribut data-theme di tag <html>
        // CSS akan menggunakan atribut ini (misal: [data-theme="dark"])
        root.setAttribute('data-theme', theme);

        // Simpan pilihan tema ke localStorage agar tetap ada saat di-refresh
        localStorage.setItem('theme', theme);
    }, [theme]); // Efek ini akan berjalan lagi jika 'theme' berubah

    // Fungsi yang akan dipanggil oleh komponen lain untuk mengganti tema
    const changeTheme = (themeName) => {
        setTheme(themeName);
    };

    // Nilai yang akan disediakan oleh provider
    const value = {
        theme,
        changeTheme, // Ganti nama dari toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
};

// Custom hook (Hook Kustom)
// Ini adalah cara mudah bagi komponen lain untuk menggunakan ThemeContext
export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};