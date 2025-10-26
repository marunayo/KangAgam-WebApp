import React, { use } from 'react';
import { useAuth } from '../context/AuthContext'; // Hook untuk mengakses fungsi login/logout
import { useNavigate } from 'react-router-dom'; // Hook untuk navigasi

/**
 * Komponen halaman Login sederhana (digunakan untuk contoh atau testing).
 * Menyediakan tombol untuk login sebagai 'user' atau 'admin' (tanpa validasi).
 */
const LoginPage = () => {
    // Mengambil fungsi login dari AuthContext
    const { login } = useAuth();
    // Hook untuk melakukan navigasi programatik
    const navigate = useNavigate();

    /**
     * Handler untuk tombol 'Login as User'.
     * Memanggil fungsi login dengan data user dummy dan mengarahkan ke halaman '/home'.
     */
    const handleLoginUser = () => {
        login({ // Panggil fungsi login dari context
            name: "User Biasa", // Data user dummy
            role: "user",
        });
        navigate('/home'); // Arahkan ke halaman utama user
    }

    /**
     * Handler untuk tombol 'Login as Admin'.
     * Memanggil fungsi login dengan data admin dummy dan mengarahkan ke halaman '/admin'.
     */
    const handleLoginAdmin = () => {
        login({ // Panggil fungsi login dari context
            name: "Atmin", // Data admin dummy
            role: "admin",
        });
        navigate('/admin'); // Arahkan ke halaman dashboard admin
    }

    // Render tampilan halaman login
    return (
        <div className="text-center p-10">
            <h1 className="text-3xl">Halaman Awal</h1>
            {/* Tombol login sebagai user */}
            <button onClick={handleLoginUser} className="mt-4 p-2 bg-blue-500 text-white rounded">Login as User</button>
            {/* Tombol login sebagai admin */}
            <button onClick={handleLoginAdmin} className="mt-4 ml-4 p-2 bg-green-500 text-white rounded">Login as Admin</button> {/* Tambahkan ml-4 untuk spasi */}
        </div>
    )
}

export default LoginPage;