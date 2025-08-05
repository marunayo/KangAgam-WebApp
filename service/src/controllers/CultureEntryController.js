import CultureEntry from '../models/CultureEntryModel.js';
import CultureTopic from '../models/CultureTopicModel.js';
import { cleanupUploadedFilesByPath } from '../utils/FileUtils.js';

// Membuat entri budaya baru
export const createCultureEntry = async (req, res) => {
    // --- TAMBAHAN UNTUK DEBUGGING ---
    console.log('--- DATA DITERIMA DI CONTROLLER ---');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files);
    console.log('---------------------------------');
    // ---------------------------------

    const files = req.files;
    try {
        const { cultureTopicId } = req.params;
        const { title, description } = JSON.parse(req.body.entryData);

        const imageFile = files.entryImage ? files.entryImage[0] : null;
        const videoFile = files.entryVideo ? files.entryVideo[0] : null;

        if (!imageFile || !videoFile || !title || !description) {
            throw new Error("Data tidak lengkap. Judul, deskripsi, gambar, dan video harus diisi.");
        }

        const topic = await CultureTopic.findById(cultureTopicId);
        if (!topic) throw new Error("Topik budaya tidak ditemukan.");

        const newEntry = await CultureEntry.create({
            title,
            description,
            imagePath: imageFile.path.replace('public/', '').replace('public\\', ''),
            videoUrl: videoFile.path.replace('public/', '').replace('public\\', ''),
            cultureTopic: cultureTopicId
        });

        res.status(201).json({ message: "Entri budaya berhasil dibuat.", data: newEntry });

    } catch (error) {
        const pathsToDelete = Object.values(files || {}).flat().map(file => file.path);
        if (pathsToDelete.length > 0) await cleanupUploadedFilesByPath(pathsToDelete);
        res.status(500).json({ message: 'Gagal membuat entri budaya.', error: error.message });
    }
};

// Mendapatkan semua entri dari sebuah topik budaya
export const getEntriesByCultureTopic = async (req, res) => {
    try {
        const { cultureTopicId } = req.params;
        const entries = await CultureEntry.find({ cultureTopic: cultureTopicId });
        res.status(200).json({ count: entries.length, data: entries });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil entri budaya.', error: error.message });
    }
};

// Mendapatkan satu entri budaya berdasarkan ID
export const getCultureEntryById = async (req, res) => {
    try {
        const entry = await CultureEntry.findById(req.params.entryId);
        if (!entry) return res.status(404).json({ message: 'Entri budaya tidak ditemukan.' });
        res.status(200).json({ data: entry });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil entri budaya.', error: error.message });
    }
};

// Memperbarui entri budaya
export const updateCultureEntry = async (req, res) => {
    try {
        const { title, description, videoUrl } = JSON.parse(req.body.entryData);
        const imageFile = req.file;
        const entry = await CultureEntry.findById(req.params.entryId);
        if (!entry) return res.status(404).json({ message: 'Entri budaya tidak ditemukan.' });

        let oldImagePath = entry.imagePath;
        let fileToDelete = null;

        entry.title = title || entry.title;
        entry.description = description || entry.description;
        entry.videoUrl = videoUrl || entry.videoUrl;
        if (imageFile) {
            fileToDelete = oldImagePath;
            entry.imagePath = imageFile.path;
        }
        const updatedEntry = await entry.save();
        if (fileToDelete) await cleanupUploadedFilesByPath([fileToDelete]);
        res.status(200).json({ message: 'Entri budaya berhasil diperbarui.', data: updatedEntry });
    } catch (error) {
        if (req.file) await cleanupUploadedFilesByPath([req.file.path]);
        res.status(500).json({ message: 'Gagal memperbarui entri budaya.', error: error.message });
    }
};

// Menghapus entri budaya
export const deleteCultureEntry = async (req, res) => {
    try {
        const entry = await CultureEntry.findById(req.params.entryId);
        if (!entry) return res.status(404).json({ message: 'Entri budaya tidak ditemukan.' });
        const imagePathToDelete = entry.imagePath;
        await CultureEntry.findByIdAndDelete(req.params.entryId);
        await cleanupUploadedFilesByPath([imagePathToDelete]);
        res.status(200).json({ message: 'Entri budaya berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus entri budaya.', error: error.message });
    }
};