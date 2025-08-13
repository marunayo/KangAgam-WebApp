import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingIndicator from '../components/ui/LoadingIndicator';

// ✅ Guard untuk OnboardingPage - mencegah user yang sudah login kembali ke onboarding
export const OnboardingGuard = ({ children }) => {
    const { user, isAuthLoading } = useAuth();
    
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }

    // Jika ada user yang sudah login, redirect sesuai role
    if (user) {
        const userRole = user.role?.toLowerCase();
        
        if (userRole === 'admin' || userRole === 'superadmin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === 'user') {
            return <Navigate to="/home" replace />;
        }
    }

    // Jika tidak ada user, tampilkan OnboardingPage
    return children;
};

// ✅ Guard untuk AdminLoginPage - mencegah admin yang sudah login kembali ke login
export const AdminLoginGuard = ({ children }) => {
    const { user, isAuthLoading } = useAuth();
    
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }

    // Jika ada user yang sudah login, redirect sesuai role
    if (user) {
        const userRole = user.role?.toLowerCase();
        
        if (userRole === 'admin' || userRole === 'superadmin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (userRole === 'user') {
            return <Navigate to="/home" replace />;
        }
    }

    // Jika tidak ada user, tampilkan AdminLoginPage
    return children;
};

// Penjaga untuk rute PENGGUNA BIASA (cth: /home, /topik/:id)
export const ProtectedRoutes = () => {
    const { user, isAuthLoading } = useAuth();
    
    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }

    // Jika tidak ada user sama sekali, arahkan ke halaman onboarding (awal)
    if (!user) {
        return <Navigate to="/" replace />;
    }

    const userRole = user.role?.toLowerCase();

    // ✅ Izinkan akses untuk user, admin, dan superadmin
    // Admin tetap bisa mengakses halaman user untuk keperluan monitoring/testing
    if (userRole === 'user' || userRole === 'admin' || userRole === 'superadmin') {
        return <Outlet />;
    }

    // Jika role tidak valid, kembalikan ke onboarding
    return <Navigate to="/" replace />;
};

// Penjaga untuk rute ADMIN (cth: /admin/dashboard)
export const AdminRoute = () => {
    const { user, isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <LoadingIndicator />
            </div>
        );
    }

    // Jika tidak ada user, redirect ke admin login
    if (!user) {
        return <Navigate to="/admin/login" replace />;
    }

    const userRole = user.role?.toLowerCase();

    // ✅ Hanya admin dan superadmin yang bisa mengakses rute admin
    if (userRole === 'admin' || userRole === 'superadmin') {
        return <Outlet />;
    }

    // Jika user biasa mencoba akses admin, redirect ke home mereka
    if (userRole === 'user') {
        return <Navigate to="/home" replace />;
    }

    // Jika role tidak dikenal, redirect ke admin login
    return <Navigate to="/admin/login" replace />;
};