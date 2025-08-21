import express from 'express';
import { protect, admin, superadmin } from '../middlewares/AuthMiddleware.js';
import {
    createCultureTopic,
    getAllCultureTopics,
    getCultureTopicById,
    updateCultureTopic,
    deleteCultureTopic
} from '../controllers/CultureTopicController.js';

// Impor middleware yang benar dari file Anda
import topicUpload from '../middlewares/TopicUpload.js'; 
import cultureEntryRouter from './CultureEntryRoutes.js';

const router = express.Router();

// Teruskan semua request ke '/:cultureTopicId/entries' ke cultureEntryRouter
router.use('/:cultureTopicId/entries', cultureEntryRouter);

// Rute untuk '/api/culture-topics'
router.route('/')
    .get(getAllCultureTopics)
    // Gunakan middleware topicUpload yang sudah ada
    .post(protect, admin, topicUpload, createCultureTopic);

// Rute untuk '/api/culture-topics/:id'
router.route('/:id')
    .get(getCultureTopicById)
    // Gunakan middleware topicUpload yang sudah ada
    .put(protect, admin, topicUpload, updateCultureTopic)
    .delete(protect, superadmin, deleteCultureTopic);

export default router;