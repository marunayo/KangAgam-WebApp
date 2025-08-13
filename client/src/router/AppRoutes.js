import { React, useEffect, useParams} from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
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

// ✅ Import halaman user
import CultureTopicsPage from '../pages/CultureTopicsPage';
import CultureEntriesPage from '../pages/CultureEntriesPage';
import CultureEntryDetailPage from '../pages/CultureEntryDetailPage';

// ✅ Import komponen 404 dan route guard
import NotFoundPage from '../components/NotFoundPage';
import TopicRouteGuard from '../components/guards/TopicRouteGuard';

// ✅ Route guard untuk entry ID (jika diperlukan)
const EntryRouteGuard = ({ children }) => {
    const { entryId } = useParams();
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    
    if (entryId && !isValidObjectId(entryId)) {
        return <NotFoundPage />;
    }
    
    return children;
};

const AnimatedRoutes = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {/* ✅ Protected Onboarding - mencegah user yang sudah login kembali ke onboarding */}
                <Route 
                    path="/" 
                    element={
                        <OnboardingGuard>
                            <OnboardingPage />
                        </OnboardingGuard>
                    } 
                />
                
                {/* ✅ Protected Admin Login - mencegah admin yang sudah login kembali ke login */}
                <Route 
                    path="/admin/login" 
                    element={
                        <AdminLoginGuard>
                            <AdminLoginPage />
                        </AdminLoginGuard>
                    } 
                />

                {/* Rute User Terproteksi */}
                <Route element={<ProtectedRoutes />}>
                    <Route element={<UserLayout />}>
                        <Route path="/home" element={<HomePage />} />
                        
                        {/* ✅ Protected topic routes with validation */}
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
                        
                        {/* ✅ Protected culture routes with validation */}
                        <Route 
                            path="/kamus-budaya/:topicId" 
                            element={
                                <TopicRouteGuard>
                                    <CultureEntriesPage />
                                </TopicRouteGuard>
                            } 
                        />
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

                {/* Rute Admin */}
                <Route path="/admin" element={<AdminRoute />}>
                    <Route element={<AdminLayout />}>
                        <Route index element={<AdminDashboard />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="manage-topics" element={<ManageTopicsPage />} />
                        
                        {/* ✅ Protected admin topic routes with validation */}
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
                        
                        {/* ✅ Protected admin culture routes with validation */}
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
                
                {/* ✅ 404 Route */}
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