import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { ProtectedRoutes, AdminRoute, OnboardingGuard, AdminLoginGuard } from './ProtectedRoutes'; 
import UserLayout from '../components/layout/UserLayout';
import AdminLayout from '../components/layout/AdminLayout';
import OnboardingPage from '../pages/OnboardingPage';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import HomePage from '../pages/HomePage';
import KosakataPage from '../pages/KosakataPage';
import QuizPage from '../pages/QuizPage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import ManageTopicsPage from '../pages/admin/ManageTopicsPage';
import ManageWordsPage from '../pages/admin/ManageWordsPage';
import ManageAdminsPage from '../pages/admin/ManageAdminsPage';
import StatisticsPage from '../pages/admin/StatisticsPage';
import ManageLearnersPage from '../pages/admin/ManageLearnersPage';
import ManageCultureTopicsPage from '../pages/admin/ManageCultureTopicsPage';
import ManageCultureEntriesPage from '../pages/admin/ManageCultureEntriesPage';

// Import halaman user
import CultureTopicsPage from '../pages/CultureTopicsPage';
import CultureEntriesPage from '../pages/CultureEntriesPage';
import CultureEntryDetailPage from '../pages/CultureEntryDetailPage';

// Import komponen 404 dan route guard
import NotFoundPage from '../components/NotFoundPage';
import TopicRouteGuard from '../components/guards/TopicRouteGuard';

// Komponen guard untuk memvalidasi format 'entryId' dari URL params
// Ini memastikan bahwa ID yang diterima adalah ObjectId (MongoDB) yang valid
// sebelum me-render children (halaman detail). Jika tidak, tampilkan halaman 404.
const EntryRouteGuard = ({ children }) => {
    const params = useParams();
    const entryId = params.entryId;
    
    // Fungsi internal untuk validasi format ObjectId
    const isValidObjectId = (id) => {
        if (!id) return false;
        return /^[0-9a-fA-F]{24}$/.test(id);
    };
    
    if (entryId && !isValidObjectId(entryId)) {
        return <NotFoundPage />;
    }
    
    return children;
};

// Komponen utama yang mendefinisikan semua rute (Routes) aplikasi.
// Komponen ini juga menggunakan 'AnimatePresence' dari framer-motion
// untuk memberikan animasi transisi antar halaman.
// 'useEffect' digunakan untuk memperbarui judul (title) dokumen
// secara dinamis berdasarkan rute (location.pathname) saat ini.
const AnimatedRoutes = () => {
    const location = useLocation();
    
    // Effect untuk mengubah judul halaman di tab browser
    useEffect(() => {
        const titles = {
            '/': 'Selamat Datang',
            '/home': 'Beranda',
            '/kamus-budaya': 'Kamus Budaya',
            '/admin': 'Admin Dashboard',
            '/admin/login': 'Admin Login'
        };
        
        const currentTitle = titles[location.pathname] || 'Kang Agam';
        document.title = currentTitle;
    }, [location.pathname]);
    
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Rute untuk halaman Onboarding, dilindungi oleh OnboardingGuard */}
                <Route 
                    path="/" 
                    element={
                        <OnboardingGuard>
                            <OnboardingPage />
                        </OnboardingGuard>
                    } 
                />
                
                {/* Rute untuk halaman Login Admin, dilindungi oleh AdminLoginGuard */}
                <Route 
                    path="/admin/login" 
                    element={
                        <AdminLoginGuard>
                            <AdminLoginPage />
                        </AdminLoginGuard>
                    } 
                />

                {/* Grup Rute User (Learner) yang diproteksi (membutuhkan login user) */}
                <Route element={<ProtectedRoutes />}>
                    {/* Semua rute di dalam sini akan menggunakan UserLayout */}
                    <Route element={<UserLayout />}>
                        <Route path="/home" element={<HomePage />} />
                        
                        {/* Rute Kosakata dan Quiz dilindungi oleh TopicRouteGuard */}
                        <Route 
                            path="/topik/:topicId" 
                            element={
                                <TopicRouteGuard>
                                    <KosakataPage />
                                </TopicRouteGuard>
                            } 
                        />
                        <Route 
                            path="/quiz/:topicId" 
                            element={
                                <TopicRouteGuard>
                                    <QuizPage />
                                </TopicRouteGuard>
                            } 
                        />
                        
                        <Route path="/kamus-budaya" element={<CultureTopicsPage />} />
                        
                        {/* Rute (Culture) dilindungi oleh TopicRouteGuard */}
                        <Route 
                            path="/kamus-budaya/:topicId" 
                            element={
                                <TopicRouteGuard>
                                    <CultureEntriesPage />
                                </TopicRouteGuard>
                            } 
                        />
                        {/* Rute detail (Culture Entry) dilindungi oleh TopicRouteGuard dan EntryRouteGuard */}
                        <Route 
                            path="/kamus-budaya/:topicId/entry/:entryId" 
                            element={
                                <TopicRouteGuard>
                                    <EntryRouteGuard>
                                        <CultureEntryDetailPage />
                                    </EntryRouteGuard>
                                </TopicRouteGuard>
                            } 
                        />
                    </Route>
                </Route>

                {/* Grup Rute Admin yang diproteksi (membutuhkan login admin) */}
                <Route path="/admin" element={<AdminRoute />}>
                    {/* Semua rute di dalam sini akan menggunakan AdminLayout */}
                    <Route element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="manage-topics" element={<ManageTopicsPage />} />
                        
                        {/* Rute admin untuk kelola kata, dilindungi oleh TopicRouteGuard */}
                        <Route 
                            path="manage-topics/:topicId" 
                            element={
                                <TopicRouteGuard>
                                    <ManageWordsPage />
                                </TopicRouteGuard>
                            } 
                        />
                        
                        <Route path="manage-admins" element={<ManageAdminsPage />} />
                        <Route path="statistics" element={<StatisticsPage />} />
                        <Route path="manage-learners" element={<ManageLearnersPage />} />
                        <Route path="manage-culture-topics" element={<ManageCultureTopicsPage />} />
                        
                        {/* Rute admin untuk kelola entri budaya, dilindungi oleh TopicRouteGuard */}
                        <Route 
                            path="manage-culture-topics/:topicId/entries" 
                            element={
                                <TopicRouteGuard>
                                    <ManageCultureEntriesPage />
                                </TopicRouteGuard>
                            } 
                        />
                    </Route>
                </Route>
                
                {/* Rute 404 (Not Found) untuk menangani URL yang tidak cocok */}
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AnimatePresence>
    );
};

// Komponen AppRoutes: Wrapper utama untuk sistem routing
// Komponen ini membungkus <AnimatedRoutes /> dengan <BrowserRouter />
// untuk mengaktifkan client-side routing di seluruh aplikasi.
const AppRoutes = () => {
    return (
        <BrowserRouter>
            <AnimatedRoutes />
        </BrowserRouter>
    );
};

export default AppRoutes;