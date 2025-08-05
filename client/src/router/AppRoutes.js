import React from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

import { ProtectedRoutes, AdminRoute } from './ProtectedRoutes'; 
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

// ✅ PERBAIKAN: Memperbaiki path import untuk halaman user
import CultureTopicsPage from '../pages/CultureTopicsPage';
import CultureEntriesPage from '../pages/CultureEntriesPage';
import CultureEntryDetailPage from '../pages/CultureEntryDetailPage';


const NotFoundPage = () => (
    <div className="flex items-center justify-center min-h-screen">
        <h1 className="text-3xl font-bold">404 - Halaman Tidak Ditemukan</h1>
    </div>
);

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* Rute Publik */}
                <Route path="/" element={<OnboardingPage />} />
                <Route path="/admin/login" element={<AdminLoginPage />} />

                {/* Rute User Terproteksi */}
                <Route element={<ProtectedRoutes />}>
                    <Route element={<UserLayout />}>
                        <Route path="/home" element={<HomePage />} />
                        <Route path="/topik/:topicId" element={<KosakataPage />} />
                        <Route path="/quiz/:topicId" element={<QuizPage />} />
                        <Route path="/kamus-budaya" element={<CultureTopicsPage />} />
                        <Route path="/kamus-budaya/:topicId" element={<CultureEntriesPage />} />
                        <Route path="/kamus-budaya/:topicId/entry/:entryId" element={<CultureEntryDetailPage />} />
                    </Route>
                </Route>

                {/* Rute Admin */}
                <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="manage-topics" element={<ManageTopicsPage />} />
                        <Route path="manage-topics/:topicId" element={<ManageWordsPage />} />
                        <Route path="manage-admins" element={<ManageAdminsPage />} />
                        <Route path="statistics" element={<StatisticsPage />} />
                        <Route path="manage-learners" element={<ManageLearnersPage />} />
                        <Route path="manage-culture-topics" element={<ManageCultureTopicsPage />} />
                        <Route path="manage-culture-topics/:topicId/entries" element={<ManageCultureEntriesPage />} /> 
                    </Route>
                </Route>
                
                <Route path="*" element={<NotFoundPage />} />
            </Routes>
        </AnimatePresence>
    );
}

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
};

export default AppRoutes;