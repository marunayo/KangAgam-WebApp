import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import Select from 'react-select';

const logo = '/assets/images/logo-kang-agam.png';
const logoBalaiBahasa = '/assets/images/logo/tut-wuri-handayani.svg';

const OnboardingPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    
    const [formData, setFormData] = useState({
        namaLengkap: '',
        nomorTelepon: '',
    });
    const [selectedCity, setSelectedCity] = useState(null); 
    const [cityOptions, setCityOptions] = useState([]);
    const [isLoadingCities, setIsLoadingCities] = useState(true);

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await axios.get('/api/locations/cities'); 
                const cityData = response.data.map(city => ({
                    value: city.name,
                    label: city.name,
                }));
                setCityOptions(cityData);
            } catch (err) {
                console.error("Gagal memuat data domisili:", err);
                setCityOptions([{ value: 'Lainnya', label: 'Lainnya' }]);
            } finally {
                setIsLoadingCities(false);
            }
        };
        fetchCities();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (errors[e.target.name]) {
            setErrors(prev => ({ ...prev, [e.target.name]: null }));
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (/^\d*$/.test(value)) {
            setFormData({ ...formData, nomorTelepon: value });
            if (errors.nomorTelepon) {
                setErrors(prev => ({ ...prev, nomorTelepon: null }));
            }
        }
    };

    const handleCityChange = (selectedOption) => {
        setSelectedCity(selectedOption);
        if (errors.asalDomisili) {
            setErrors(prev => ({ ...prev, asalDomisili: null }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.namaLengkap.trim()) {
            newErrors.namaLengkap = 'Nama Lengkap wajib diisi.';
        }
        if (!formData.nomorTelepon.trim()) {
            newErrors.nomorTelepon = 'Nomor Telepon wajib diisi.';
        } else if (formData.nomorTelepon.length < 10) {
            newErrors.nomorTelepon = 'Nomor Telepon minimal 10 digit.';
        } else if (formData.nomorTelepon.length > 15) {
            newErrors.nomorTelepon = 'Nomor Telepon maksimal 15 digit.';
        }
        if (!selectedCity) {
            newErrors.asalDomisili = 'Asal Domisili wajib dipilih.';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formErrors = validateForm();
        if (Object.keys(formErrors).length > 0) {
            setErrors(formErrors);
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            const learnerData = {
                learnerName: formData.namaLengkap,
                learnerPhone: formData.nomorTelepon,
                learnerCity: selectedCity.value, 
            };
            const response = await axios.post('/api/learners', learnerData);
            
            const userData = { ...response.data.data, role: 'user' };
            login(userData);
            navigate('/home', { replace: true });

        } catch (err) {
            console.error('Error details:', err.response ? err.response.data : err.message);
            setErrors({ general: err.response?.data?.message || 'Gagal menyimpan data. Coba lagi.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-[#FFFBEB] min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
            <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
                
                {/* Kolom Kiri: Informasi */}
                <div className="w-full md:w-1/2 max-w-md md:max-w-none text-center md:text-left flex flex-col items-center md:items-start">
                    <div className="mb-8">
                        <img src={logo} alt="Kang Agam Logo" className="w-48 sm:w-56 mx-auto md:mx-0" />
                        <p className="text-gray-700 mt-4 text-base sm:text-lg">Kamus Daring Audio Bergambar Tiga Bahasa</p>
                        <p className="text-sm text-gray-500">Indonesia / Sunda / Inggris</p>
                    </div>
                    
                    {/* ✅ 1. Hapus `hidden md:flex` dan ganti dengan `flex` agar selalu tampil */}
                    {/* Tambahkan `md:mt-auto` agar di desktop posisinya tetap di bawah */}
                    <div className="flex items-center justify-center md:justify-start gap-3 mt-8 md:mt-auto">
                        {/* ✅ 2. Perkecil ukuran logo di mobile */}
                        <img src={logoBalaiBahasa} alt="Logo Balai Bahasa" className="h-12 sm:h-16" />
                        <div className="text-left">
                            {/* ✅ 3. Perkecil ukuran teks di mobile */}
                            <p className="text-base sm:text-lg font-bold text-gray-800 leading-tight">BALAI BAHASA</p>
                            <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-tight">PROVINSI JAWA BARAT</p>
                            <p className="text-[10px] sm:text-xs text-gray-500 leading-tight mt-1">BADAN PENGEMBANGAN DAN PEMBINAAN BAHASA</p>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Form */}
                <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-lg w-full max-w-md mt-8 md:mt-0">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Data Diri</h2>
                    {errors.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}
                    <div className="bg-[#FFEFE3] text-[#D96F43] text-sm p-3 rounded-lg flex items-center gap-3 mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        <span>Isi terlebih dahulu data diri dibawah ini</span>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="namaLengkap" className="block text-sm font-medium text-gray-600 mb-1">Nama Lengkap</label>
                            <input type="text" name="namaLengkap" value={formData.namaLengkap} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg ${errors.namaLengkap ? 'border-red-500' : 'border-gray-300'}`} />
                            {errors.namaLengkap && <p className="text-red-500 text-xs mt-1">{errors.namaLengkap}</p>}
                        </div>
                        <div>
                            <label htmlFor="nomorTelepon" className="block text-sm font-medium text-gray-600 mb-1">Nomor Telepon</label>
                            <input 
                                type="tel" 
                                name="nomorTelepon" 
                                value={formData.nomorTelepon} 
                                onChange={handlePhoneChange} 
                                className={`w-full px-4 py-2.5 border rounded-lg ${errors.nomorTelepon ? 'border-red-500' : 'border-gray-300'}`} 
                                maxLength="15"
                            />
                            {errors.nomorTelepon && <p className="text-red-500 text-xs mt-1">{errors.nomorTelepon}</p>}
                        </div>
                        <div>
                            <label htmlFor="asalDomisili" className="block text-sm font-medium text-gray-600 mb-1">Asal Domisili (Kota/Kabupaten)</label>
                            <Select
                                id="asalDomisili"
                                name="asalDomisili"
                                value={selectedCity}
                                onChange={handleCityChange}
                                options={cityOptions}
                                isLoading={isLoadingCities}
                                placeholder="Cari dan pilih..."
                                isClearable
                                menuPortalTarget={document.body}
                                styles={{
                                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                                    control: (base, state) => ({
                                        ...base,
                                        padding: '0.3rem',
                                        borderRadius: '0.5rem',
                                        borderColor: errors.asalDomisili ? '#EF4444' : state.isFocused ? '#6366F1' : '#D1D5DB',
                                        boxShadow: errors.asalDomisili ? '0 0 0 1px #EF4444' : state.isFocused ? '0 0 0 1px #6366F1' : 'none',
                                        '&:hover': {
                                            borderColor: errors.asalDomisili ? '#EF4444' : '#6366F1'
                                        }
                                    }),
                                }}
                            />
                            {errors.asalDomisili && <p className="text-red-500 text-xs mt-1">{errors.asalDomisili}</p>}
                        </div>
                        <button type="submit" disabled={isSubmitting} className="w-full bg-[#8DA2FB] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#788DE5] transition-colors disabled:opacity-70">
                            {isSubmitting ? 'Memproses...' : 'Masuk'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default OnboardingPage;