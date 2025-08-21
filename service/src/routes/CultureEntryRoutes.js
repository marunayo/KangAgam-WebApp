import express from 'express';
import { protect, admin } from '../middlewares/AuthMiddleware.js';
import {
    createCultureEntry,
    getEntriesByCultureTopic,
    getCultureEntryById,
    updateCultureEntry,
    deleteCultureEntry
} from '../controllers/CultureEntryController.js';
// Impor middleware yang sudah jadi
import cultureEntryUpload from '../middlewares/CultureEntryUpload.js';

const router = express.Router({ mergeParams: true });

// Gunakan middleware 'cultureEntryUpload' secara langsung
router.route('/')
    .get(getEntriesByCultureTopic)
    .post(protect, admin, cultureEntryUpload, createCultureEntry);

router.route('/:entryId')
    .get(getCultureEntryById)
    .put(protect, admin, cultureEntryUpload, updateCultureEntry)
    .delete(protect, admin, deleteCultureEntry);

export default router;