import { React, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import Navbar from './Navbar';
import MobileMenu from './MobileMenu';
import { useAuth } from '../../context/AuthContext';
import Footer from '../../components/layout/Footer';

const UserLayout = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [totalUniqueVisitors, setTotalUniqueVisitors] = useState(0);
    const { user, token } = useAuth(); 

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/visitor-logs/stats');
                setTotalUniqueVisitors(response.data.totalUniqueVisitors || 0);
            } catch (error) {
                console.error('Failed to fetch visitor stats:', error);
                setTotalUniqueVisitors(0);
            }
        };
        
        fetchStats();
    }, []);

    return (
        <>
            <style>{`
                .stable-scrollbar {
                    scrollbar-gutter: stable;
                }
                :root {
                    --navbar-height: 64px;
                }
                @media (min-width: 640px) {
                    :root {
                        --navbar-height: 72px;
                    }
                }
                
                /* Add padding to prevent content overlap */
                .main-content {
                    padding-top: var(--navbar-height);
                }
            `}</style>
            <MobileMenu isOpen={isMenuOpen} onClose={toggleMenu} />
            
            <div className="bg-background min-h-screen flex flex-col">
                <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-background-secondary/80 backdrop-blur-sm shadow-sm border-b border-gray-200 dark:border-gray-700">
                    <Navbar
                        onMenuToggle={toggleMenu}
                        isMenuOpen={isMenuOpen}
                        totalUniqueVisitors={totalUniqueVisitors}
                    />
                </header>
                
                <main className="flex-1 flex flex-col main-content">
                    {/* Wrapper ini akan membuat konten mengisi ruang yang tersedia */}
                    <div className="flex-1 w-full pt-4 sm:pt-6">
                        <Outlet />
                    </div>
                    <Footer totalUniqueVisitors={totalUniqueVisitors} />
                </main>
            </div>
        </>
    );
};

export default UserLayout;