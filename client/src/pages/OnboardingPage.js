import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Hook untuk navigasi
import { useAuth } from '../context/AuthContext'; // Hook untuk autentikasi (login)
import axios from 'axios'; // Library untuk request HTTP
import Select from 'react-select'; // Komponen dropdown select

// Path ke aset gambar logo
const logo = '/assets/images/logo-kang-agam.png';
const logoBalaiBahasa = '/assets/images/logo/tut-wuri-handayani.svg';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Komponen halaman Onboarding.
 * Halaman ini muncul pertama kali untuk pengguna baru memasukkan data diri (nama, telepon, domisili)
 * sebelum diarahkan ke halaman utama (home).
 */
const OnboardingPage = () => {
    const navigate = useNavigate(); // Hook untuk navigasi
    const { login } = useAuth(); // Ambil fungsi login dari AuthContext

    // State untuk menyimpan data input form
    const [formData, setFormData] = useState({
        namaLengkap: '',
        nomorTelepon: '',
    });
    // State khusus untuk dropdown kota/domisili
    const [selectedCity, setSelectedCity] = useState(null); // Kota yang dipilih
    const [cityOptions, setCityOptions] = useState([]); // Daftar pilihan kota
    const [isLoadingCities, setIsLoadingCities] = useState(true); // Status loading data kota

    // State untuk pesan error validasi form
    const [errors, setErrors] = useState({});
    // State untuk menandai proses submit form
    const [isSubmitting, setIsSubmitting] = useState(false);

    // useEffect: Mengambil daftar kota/domisili dari API saat komponen dimuat
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/locations/cities`);
                const cityData = response.data.map(city => ({
                    value: city.name, // Nilai yang akan disimpan
                    label: city.name, // Teks yang ditampilkan
                }));
                setCityOptions(cityData); // Update state pilihan kota
            } catch (err) {
                console.error("Gagal memuat data domisili:", err);
                // Fallback jika API gagal
                setCityOptions([{ value: 'Lainnya', label: 'Lainnya' }]); 
            } finally {
                setIsLoadingCities(false); // Selesai loading kota
            }
        };
        fetchCities(); // Panggil fungsi fetch
    }, []); // [] berarti efek ini hanya dijalankan sekali saat komponen mount

    /**
     * Handler untuk perubahan input teks biasa (nama lengkap).
     * @param {React.ChangeEvent<HTMLInputElement>} e - Event perubahan input.
     */
    const handleChange = (e) => {
        // Update state formData sesuai nama input
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Hapus pesan error jika ada untuk input ini
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
    };

    /**
     * Handler khusus untuk input nomor telepon.
     * Hanya memperbolehkan input digit angka.
     * @param {React.ChangeEvent<HTMLInputElement>} e - Event perubahan input.
     */
    const handlePhoneChange = (e) => {
        const value = e.target.value;
        // Gunakan regex untuk memastikan hanya angka yang dimasukkan
        if (/^\d*$/.test(value)) { 
            // Update state nomor telepon
            setFormData({ ...formData, nomorTelepon: value });
            // Hapus error nomor telepon jika ada
            if (errors.nomorTelepon) {
                setErrors(prev => ({ ...prev, nomorTelepon: null }));
            }
        }
    };

    /**
     * Handler untuk perubahan dropdown kota/domisili.
     * @param {object | null} selectedOption - Opsi yang dipilih dari react-select.
     */
    const handleCityChange = (selectedOption) => {
        // Update state kota yang dipilih
        setSelectedCity(selectedOption);
        // Hapus error domisili jika ada
        if (errors.asalDomisili) {
            setErrors(prev => ({ ...prev, asalDomisili: null }));
        }
    };

    /**
     * Fungsi validasi form sebelum submit.
     * @returns {object} Objek berisi pesan error jika ada, atau objek kosong jika valid.
     */
    const validateForm = () => {
        const newErrors = {};
        // Validasi Nama Lengkap
        if (!formData.namaLengkap.trim()) {
            newErrors.namaLengkap = 'Nama Lengkap wajib diisi.';
        }
        // Validasi Nomor Telepon
        if (!formData.nomorTelepon.trim()) {
            newErrors.nomorTelepon = 'Nomor Telepon wajib diisi.';
        } else if (formData.nomorTelepon.length < 10) {
            newErrors.nomorTelepon = 'Nomor Telepon minimal 10 digit.';
        } else if (formData.nomorTelepon.length > 15) {
            newErrors.nomorTelepon = 'Nomor Telepon maksimal 15 digit.';
        }
        // Validasi Asal Domisili
        if (!selectedCity) {
            newErrors.asalDomisili = 'Asal Domisili wajib dipilih.';
        }
        return newErrors; // Kembalikan objek errors
    };

    /**
     * Handler untuk submit form.
     * Melakukan validasi, mengirim data ke API, login pengguna, dan navigasi.
     * @param {React.FormEvent<HTMLFormElement>} e - Event submit form.
     */
    const handleSubmit = async (e) => {
        e.preventDefault(); // Mencegah reload halaman
        // Lakukan validasi
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            // Jika ada error, tampilkan dan hentikan submit
            setErrors(formErrors); 
            return;
        }

        // Reset error dan set status submitting
        setErrors({}); 
        setIsSubmitting(true);

        try {
            // Siapkan data untuk dikirim ke API
            const learnerData = {
                learnerName: formData.namaLengkap,
                learnerPhone: formData.nomorTelepon,
                learnerCity: selectedCity.value, // Ambil value dari kota yang dipilih
            };
            const response = await axios.post(`${API_URL}/api/learners`, learnerData);
            const userData = { ...response.data.data, role: 'user' };
            // Panggil fungsi login dari AuthContext
            login(userData);
            // Arahkan pengguna ke halaman home setelah berhasil
            navigate('/home', { replace: true }); // replace: true agar tidak bisa kembali ke onboarding

        } catch (err) { // Tangani error saat submit
            console.error('Error details:', err.response ? err.response.data : err.message);
            // Tampilkan pesan error umum atau dari API
            setErrors({ general: err.response?.data?.message || 'Gagal menyimpan data. Coba lagi.' });
        } finally {
            setIsSubmitting(false); // Selesai submitting (baik berhasil maupun gagal)
        }
    };

    // Render tampilan halaman onboarding
    return (
        <div className="bg-[#FFFBEB] min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            {/* Layout utama, terbagi jadi 2 kolom di layar medium ke atas */}
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                
                {/* Kolom Kiri: Logo dan Informasi */}
                <div className="w-full md:w-1/2 max-w-md md:max-w-none text-center md:text-left flex flex-col items-center md:items-start">
                    {/* Bagian Logo Kang Agam */}
                    <div className="mb-8">
                        <img src={logo} alt="Kang Agam Logo" className="w-48 sm:w-56 mx-auto md:mx-0" />
                        <p className="text-gray-700 mt-4 text-base sm:text-lg">Kamus Daring Audio Bergambar Tiga Bahasa</p>
                        <p className="text-sm text-gray-500">Indonesia / Sunda / Inggris</p>
                    </div>
                    
                    {/* Bagian Logo Balai Bahasa */}
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-8 md:mt-auto">
                        <img src={logoBalaiBahasa} alt="Logo Balai Bahasa" className="h-12 sm:h-16" />
                        <div className="text-left">
                            <p className="text-sm sm:text-base font-bold text-gray-800 leading-tight">BALAI BAHASA PROVINSI JAWA BARAT</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight mt-0.5">BADAN PENGEMBANGAN DAN PEMBINAAN BAHASA</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 leading-tight mt-1">Kementerian Pendidikan Dasar dan Menengah Republik Indonesia</p>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Form Input Data Diri */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md mt-8 md:mt-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Diri</h2>
                    {/* Tampilkan error umum jika ada */}
                    {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}
                    {/* Kotak Info */}
                    <div className="bg-[#FFEFE3] text-[#D96F43] text-sm p-3 rounded-lg flex items-center gap-3 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Isi terlebih dahulu data diri dibawah ini</span>
                    </div>
                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Input Nama Lengkap */}
                        <div>
                            <label htmlFor="namaLengkap" className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
                            <input 
                                type="text" 
                                name="namaLengkap" 
                                value={formData.namaLengkap} 
                                onChange={handleChange} 
                                className={`w-full px-4 py-2.5 border rounded-lg ${errors.namaLengkap ? 'border-red-500' : 'border-gray-300'}`} // Styling border error
                            />
                            {/* Tampilkan pesan error jika ada */}
                            {errors.namaLengkap && <p className="text-red-500 text-xs mt-1">{errors.namaLengkap}</p>}
                        </div>
                        {/* Input Nomor Telepon */}
                        <div>
                            <label htmlFor="nomorTelepon" className="block text-sm font-medium text-gray-600 mb-1">Nomor Telepon</label>
                            <input 
                                type="tel" // Tipe input tel untuk keypad numerik di mobile
                                name="nomorTelepon" 
                                value={formData.nomorTelepon} 
                                onChange={handlePhoneChange} // Handler khusus telepon
                                className={`w-full px-4 py-2.5 border rounded-lg ${errors.nomorTelepon ? 'border-red-500' : 'border-gray-300'}`} // Styling border error
                                maxLength="15" // Batasi panjang input
                            />
                             {/* Tampilkan pesan error jika ada */}
                            {errors.nomorTelepon && <p className="text-red-500 text-xs mt-1">{errors.nomorTelepon}</p>}
                        </div>
                        {/* Dropdown Asal Domisili */}
                        <div>
                            <label htmlFor="asalDomisili" className="block text-sm font-medium text-gray-600 mb-1">Asal Domisili (Kota/Kabupaten)</label>
                            <Select
                                id="asalDomisili"
                                name="asalDomisili"
                                value={selectedCity} // Nilai yang dipilih
                                onChange={handleCityChange} // Handler perubahan
                                options={cityOptions} // Daftar pilihan
                                isLoading={isLoadingCities} // Tampilkan loading jika sedang fetch
                                placeholder="Cari dan pilih..." // Placeholder
                                isClearable // Aktifkan tombol clear
                                menuPortalTarget={document.body} // Render menu di body agar tidak terpotong
                                styles={{ // Styling custom untuk react-select
                                    menuPortal: base => ({ ...base, zIndex: 9999 }), // Z-index menu
                                    control: (base, state) => ({ // Styling container dropdown
                                        ...base,
                                        padding: '0.3rem',
                                        borderRadius: '0.5rem',
                                        // Styling border (merah jika error, biru jika fokus, abu-abu jika normal)
                                        borderColor: errors.asalDomisili ? '#EF4444' : state.isFocused ? '#6366F1' : '#D1D5DB',
                                        boxShadow: errors.asalDomisili ? '0 0 0 1px #EF4444' : state.isFocused ? '0 0 0 1px #6366F1' : 'none',
                                        '&:hover': {
                                            borderColor: errors.asalDomisili ? '#EF4444' : '#6366F1' // Border biru saat hover (kecuali error)
                                        }
                                    }),
                                }}
                            />
                            {/* Tampilkan pesan error jika ada */}
                            {errors.asalDomisili && <p className="text-red-500 text-xs mt-1">{errors.asalDomisili}</p>}
                        </div>
                        {/* Tombol Submit */}
                        <button 
                            type="submit" 
                            disabled={isSubmitting} // Disable tombol saat submitting
                            className="w-full bg-[#8DA2FB] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#788DE5] transition-colors disabled:opacity-70"
                        >
                            {/* Ubah teks tombol saat submitting */}
                            {isSubmitting ? 'Memproses...' : 'Masuk'} 
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;
