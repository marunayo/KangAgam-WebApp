import React from 'react';
import { useAuth } from '../../context/AuthContext';
// ✅ 1. Import NavLink for active styling
import { useNavigate, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import UserThemeSwitcher from '../ui/UserThemeSwitcher'; // Assuming you might want this in mobile too

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const MobileMenu = ({ isOpen, onClose }) => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

    const handleLogout = () => {
        onClose();
        logout();
        navigate('/');
    };

    const changeLanguage = (e) => {
        i18n.changeLanguage(e.target.value);
    };
    
    // ✅ 2. Style for active and inactive links in mobile view
    const mobileNavLinkStyles = ({ isActive }) =>
        `block text-lg font-medium py-3 rounded-md px-3 transition-colors duration-200 ${
            isActive 
            ? 'bg-primary/10 text-primary' 
            : 'text-gray-700 hover:bg-gray-100'
        }`;

    return (
        <div 
            className={`sm:hidden fixed inset-0 z-40 transition-opacity duration-300
                        ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
            <div 
                className="absolute inset-0 bg-black/40"
                onClick={onClose}
                aria-hidden="true"
            ></div>
            
            <div
                onClick={(e) => e.stopPropagation()}
                className={`relative ml-auto h-full w-3/4 max-w-sm bg-white shadow-xl
                            transform transition-transform duration-300 ease-in-out
                            flex flex-col
                            ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex justify-between items-center p-4 border-b">
                     <div className="text-gray-700 font-bold">Menu</div>
                    <button onClick={onClose} className="p-2 text-gray-600 hover:text-black" aria-label="Tutup menu">
                        <CloseIcon />
                    </button>
                </div>

                <nav className="p-6 flex-grow space-y-2">
                    {/* ✅ 3. Replace placeholder links with actual navigation */}
                    <NavLink to="/home" onClick={onClose} className={mobileNavLinkStyles}>
                        Kamus Kosakata
                    </NavLink>
                    <NavLink to="/kamus-budaya" onClick={onClose} className={mobileNavLinkStyles}>
                        Kamus Budaya
                    </NavLink>
                </nav>
                
                <div className="p-6 border-t">
                    <div className="mb-4">
                        <label htmlFor="bahasa-mobile" className="block text-sm font-medium text-gray-500 mb-2">{t('languageLabel')}</label>
                        <select
                            id="bahasa-mobile"
                            name="bahasa"
                            className="w-full bg-gray-100 border-gray-300 rounded-lg px-3 py-2.5 text-base focus:ring-1 focus:ring-indigo-500"
                            onChange={changeLanguage}
                            value={i18n.language}
                        >
                            <option value="id">Indonesia</option>
                            <option value="en">Inggris</option>
                            <option value="su">Sunda</option>
                        </select>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                        {t('logoutButton')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MobileMenu;