import React, { createContext, useContext, useState, useEffect } from 'react';

// Membuat React Context baru untuk menampung state autentikasi
const AuthContext = createContext();

// Komponen Provider yang akan membungkus aplikasi
// Bertanggung jawab mengelola state user, token, dan status loading
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [isAuthLoading, setIsAuthLoading] = useState(true); // Status loading untuk cek auth awal

    // useEffect ini berjalan sekali saat aplikasi dimuat (component mount)
    // Tujuannya untuk 'menghidrasi' atau mengisi state dari localStorage
    // jika user sudah pernah login sebelumnya.
    useEffect(() => {
        try {
            const storedUser = localStorage.getItem('user');
            const storedToken = localStorage.getItem('token');
            
            if (storedUser) {
                const userObject = JSON.parse(storedUser);
                if (storedToken) {
                    // Jika ada token (biasanya untuk admin), gabungkan ke object user di state
                    userObject.token = storedToken;
                }
                setUser(userObject);
            }
        } catch (error) {
            console.error("Gagal mem-parsing data dari localStorage", error);
            // Jika data korup, bersihkan localStorage
            localStorage.clear();
        } finally {
            // Set loading ke false setelah pengecekan selesai
            setIsAuthLoading(false);
        }
    }, []);

    // Fungsi untuk memproses login user
    // Menerima data user, melakukan validasi, dan menyimpannya ke state & localStorage
    const login = (userData) => {
        // --- PERBAIKAN UTAMA DI SINI ---
        // Validasi dasar: pastikan userData ada dan memiliki role.
        if (!userData || !userData.role) {
            console.error("Mencoba login dengan data yang tidak valid.");
            return;
        }

        const role = userData.role.toLowerCase();
        const isLearner = role === 'user';
        const isAdmin = role === 'admin' || role === 'superadmin';

        // Jika seorang admin, MEREKA WAJIB PUNYA TOKEN.
        if (isAdmin && !userData.token) {
            console.error("Admin mencoba login tanpa token.");
            return;
        }

        // Siapkan objek user yang akan disimpan, hanya berisi data yang relevan.
        const userToStore = {
            _id: userData._id,
            role: userData.role,
            ...(isLearner && { learnerName: userData.learnerName }),
            ...(isAdmin && { adminName: userData.adminName, adminEmail: userData.adminEmail }),
        };

        // Simpan data user (tanpa token) ke localStorage
        localStorage.setItem('user', JSON.stringify(userToStore));
        
        // Atur state dan localStorage untuk token secara terpisah
        if (isAdmin) {
            localStorage.setItem('token', userData.token);
            setToken(userData.token);
            // Gabungkan user dan token di dalam state untuk konsistensi
            setUser({ ...userToStore, token: userData.token });
        } else {
            // Jika ini learner, pastikan tidak ada token lama yang tersisa
            localStorage.removeItem('token');
            setToken(null);
            setUser(userToStore);
        }
    };

    // Fungsi untuk memproses logout user
    // Membersihkan state dan data dari localStorage
    const logout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
    };

    // Menyediakan state dan fungsi (login, logout) ke komponen-komponen di dalamnya
    return (
        <AuthContext.Provider value={{ user, token, isAuthLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook (Hook Kustom)
// Ini adalah cara mudah bagi komponen lain untuk menggunakan AuthContext
// tanpa perlu meng-import useContext dan AuthContext secara terpisah.
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};