import React from 'react';
import { useParams } from 'react-router-dom';
import NotFoundPage from '../NotFoundPage';

// Fungsi internal untuk memvalidasi format MongoDB ObjectId
// Ini adalah pengecekan cepat di sisi client
const isValidObjectId = (id) => {
    // Mengecek apakah ID adalah string heksadesimal 24 karakter
    // (Regex: /^[0-9a-fA-F]{24}$/)
    return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Komponen Guard (Penjaga) untuk Rute Bertema Topik.
 * Tujuannya adalah untuk memvalidasi 'topicId' dari parameter URL
 * sebelum komponen halaman (misal: KosakataPage, QuizPage) di-render.
 * Jika 'topicId' tidak memiliki format MongoDB ObjectId yang valid,
 * komponen ini akan langsung menampilkan halaman NotFoundPage (404).
 */
const TopicRouteGuard = ({ children }) => {
    // Mengambil topicId dari parameter URL (misal: /topik/:topicId)
    const { topicId } = useParams();

    // Jika topicId tidak valid, tampilkan halaman 404
    if (!isValidObjectId(topicId)) {
        return <NotFoundPage />;
    }

    // Jika topicId valid, render komponen anak (children) yang sebenarnya
    // (misal: KosakataPage, QuizPage, dll.)
    return children;
};

export default TopicRouteGuard;