import CultureTopic from '../models/CultureTopicModel.js';
import CultureEntry from '../models/CultureEntryModel.js';
import mongoose from 'mongoose';
import { cleanupUploadedFilesByPath } from '../utils/FileUtils.js';

// Membuat topik budaya baru
export const createCultureTopic = async (req, res) => {
    try {
        const { name } = JSON.parse(req.body.topicData);
        const imageFile = req.file;
        if (!name || !imageFile) {
            throw new Error('Nama topik dan file gambar harus diisi.');
        }
        const newTopic = await CultureTopic.create({ name, imagePath: imageFile.path });
        res.status(201).json({ message: 'Topik budaya berhasil dibuat.', data: newTopic });
    } catch (error) {
        if (req.file) await cleanupUploadedFilesByPath([req.file.path]);
        res.status(500).json({ message: 'Gagal membuat topik budaya.', error: error.message });
    }
};

// Mendapatkan semua topik budaya
export const getAllCultureTopics = async (req, res) => {
    try {
        const topics = await CultureTopic.find({});
        res.status(200).json({ count: topics.length, data: topics });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil topik budaya.', error: error.message });
    }
};

// Mendapatkan satu topik budaya berdasarkan ID
export const getCultureTopicById = async (req, res) => {
    try {
        const topic = await CultureTopic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topik budaya tidak ditemukan.' });
        res.status(200).json({ data: topic });
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil topik budaya.', error: error.message });
    }
};

// Memperbarui topik budaya
export const updateCultureTopic = async (req, res) => {
    try {
        const { name } = JSON.parse(req.body.topicData);
        const imageFile = req.file;
        const topic = await CultureTopic.findById(req.params.id);
        if (!topic) return res.status(404).json({ message: 'Topik budaya tidak ditemukan.' });

        let oldImagePath = topic.imagePath;
        let fileToDelete = null;

        topic.name = name || topic.name;
        if (imageFile) {
            fileToDelete = oldImagePath;
            topic.imagePath = imageFile.path;
        }
        const updatedTopic = await topic.save();
        if (fileToDelete) await cleanupUploadedFilesByPath([fileToDelete]);
        res.status(200).json({ message: 'Topik budaya berhasil diperbarui.', data: updatedTopic });
    } catch (error) {
        if (req.file) await cleanupUploadedFilesByPath([req.file.path]);
        res.status(500).json({ message: 'Gagal memperbarui topik budaya.', error: error.message });
    }
};

// Menghapus topik budaya
export const deleteCultureTopic = async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    try {
        session.startTransaction();
        const topic = await CultureTopic.findById(id).session(session);
        if (!topic) throw new Error("Topik budaya tidak ditemukan.");

        const entriesToDelete = await CultureEntry.find({ cultureTopic: id }).session(session);
        const filesToDelete = [topic.imagePath];
        entriesToDelete.forEach(entry => filesToDelete.push(entry.imagePath));

        if (entriesToDelete.length > 0) {
            await CultureEntry.deleteMany({ cultureTopic: id }).session(session);
        }
        await CultureTopic.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        await cleanupUploadedFilesByPath(filesToDelete);
        res.status(200).json({ message: 'Topik budaya dan semua entrinya berhasil dihapus.' });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ message: 'Gagal menghapus topik budaya.', error: error.message });
    } finally {
        session.endSession();
    }
};