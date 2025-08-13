import Entry from '../models/EntryModel.js';
import Topic from '../models/TopicModel.js';
import Vocabulary from '../models/VocabularyModel.js';
import Language from '../models/LanguageModel.js';
import { cleanupUploadedFiles } from '../utils/FileUtils.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

/**
 * @desc     Menambahkan entri baru beserta gambar & file audionya
 * @route    POST /api/topics/:topicId/entries
 * @access   Private/Admin
 */
export const addEntry = async (req, res) => {
    const allUploadedFiles = [
        ...(req.files.entryImage || []),
        ...(req.files.audioFiles || [])
    ];

    try {
        const entryImageFile = req.files.entryImage ? req.files.entryImage[0] : null;
        const audioFiles = req.files.audioFiles || [];

        if (!entryImageFile) {
            throw new Error('File gambar utama wajib diunggah.');
        }

        const { entryVocabularies } = JSON.parse(req.body.entryData);
        const { topicId } = req.params;

        if (!entryVocabularies || entryVocabularies.length === 0) {
            throw new Error('Minimal satu data kosakata harus disediakan.');
        }

        const topic = await Topic.findById(topicId);
        if (!topic) {
            throw new Error('Topik tidak ditemukan.');
        }

        const vocabCreationPromises = entryVocabularies.map(async (voc) => {
            const language = await Language.findOne({ languageCode: voc.languageCode });
            if (!language) throw new Error(`Bahasa '${voc.languageCode}' tidak ditemukan.`);
            
            // --- PERBAIKAN: Gunakan 'newAudioIndex' untuk mengambil file audio yang benar ---
            const audioFile = audioFiles[voc.newAudioIndex];
            if (!audioFile) throw new Error(`File audio untuk '${voc.vocab}' tidak ada atau tidak diunggah.`);

            const cleanAudioPath = audioFile.path.replace(/\\/g, '/').replace('public', '');

            return Vocabulary.create({
                vocab: voc.vocab,
                audioUrl: cleanAudioPath,
                language: language._id,
                translation: []
            });
        });

        const newVocabularies = await Promise.all(vocabCreationPromises);
        const newVocabularyIds = newVocabularies.map(v => v._id);

        if (newVocabularyIds.length > 1) {
            const linkPromises = newVocabularyIds.map(id =>
                Vocabulary.updateOne(
                    { _id: id },
                    { $addToSet: { translation: { $each: newVocabularyIds.filter(otherId => !otherId.equals(id)) } } }
                )
            );
            await Promise.all(linkPromises);
        }

        const cleanImagePath = entryImageFile.path.replace(/\\/g, '/').replace('public', '');

        const newEntry = await Entry.create({
            entryImagePath: cleanImagePath,
            entryVocabularies: newVocabularyIds,
            topic: topicId
        });

        topic.topicEntries.push(newEntry._id);
        await topic.save();
        
        const populatedEntry = await Entry.findById(newEntry._id);
        res.status(201).json({ message: 'Entri berhasil dibuat!', data: populatedEntry });

    } catch (error) {
        await cleanupUploadedFiles(allUploadedFiles);
        console.error("Error saat membuat entri:", error);
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat entri.', error: error.message });
    }
};

/**
 * @desc     Mengambil semua entri dari sebuah topik
 * @route    GET /api/topics/:topicId/entries
 * @access   Public
 */
export const getEntriesByTopic = async (req, res) => {
    try {
        const { topicId } = req.params;
        const topic = await Topic.findById(topicId);
        if (!topic) {
            return res.status(404).json({ message: 'Topik tidak ditemukan' });
        }
        const entries = await Entry.find({ topic: topicId });
        res.status(200).json({ message: 'Berhasil mengambil entri', entries: entries });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil entri', error: error.message });
    }
};

/**
 * @desc     Mengambil satu entri berdasarkan ID
 * @route    GET /api/entries/:entryId
 * @access   Public
 */
export const getEntryById = async (req, res) => {
    try {
        const { entryId } = req.params;
        const entry = await Entry.findById(entryId);
        if (!entry) {
            return res.status(404).json({ message: 'Entri tidak ditemukan' });
        }
        res.status(200).json({
            message: 'Entri berhasil ditemukan',
            entry
        });
    } catch (error) {
        res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil entri',
            error: error.message
        });
    }
};

/**
 * @desc     Mengupdate entri
 * @route    PUT /api/entries/:entryId
 * @access   Private/Admin
 */
export const updateEntry = async (req, res) => {
    const { entryId } = req.params;
    const allUploadedFiles = [
        ...(req.files.entryImage || []),
        ...(req.files.audioFiles || [])
    ];

    try {
        const existingEntry = await Entry.findById(entryId);
        if (!existingEntry) {
            throw new Error('Entri tidak ditemukan.');
        }

        const { entryVocabularies: newVocabData } = JSON.parse(req.body.entryData);
        const newImageFile = req.files?.entryImage?.[0];
        const audioFiles = req.files?.audioFiles || [];
        
        const finalVocabularyIds = [];
        const oldFilesToDelete = [];

        for (const vocData of newVocabData) {
            if (vocData._id) { // Update kosakata yang sudah ada
                const vocabToUpdate = await Vocabulary.findById(vocData._id);
                if (!vocabToUpdate) continue;

                vocabToUpdate.vocab = vocData.vocab;

                if (vocData.newAudioIndex !== undefined) {
                    const audioFile = audioFiles[vocData.newAudioIndex];
                    if (!audioFile) throw new Error(`Index audio baru ${vocData.newAudioIndex} tidak valid.`);
                    
                    if (vocabToUpdate.audioUrl) oldFilesToDelete.push(path.resolve(`public${vocabToUpdate.audioUrl}`));
                    vocabToUpdate.audioUrl = audioFile.path.replace(/\\/g, '/').replace('public', '');
                }
                
                await vocabToUpdate.save();
                finalVocabularyIds.push(vocabToUpdate._id);

            } else { // Buat kosakata baru
                const language = await Language.findOne({ languageCode: vocData.languageCode });
                if (!language) throw new Error(`Bahasa '${vocData.languageCode}' tidak ditemukan.`);

                const audioFile = audioFiles[vocData.newAudioIndex];
                if (!audioFile) throw new Error(`Kosakata baru '${vocData.vocab}' tidak memiliki file audio.`);

                const newVocab = await Vocabulary.create({
                    vocab: vocData.vocab,
                    audioUrl: audioFile.path.replace(/\\/g, '/').replace('public', ''),
                    language: language._id,
                    translation: []
                });
                
                finalVocabularyIds.push(newVocab._id);
            }
        }
        
        const oldVocabularyIds = existingEntry.entryVocabularies.map(v => v._id.toString());
        const newVocabularyIdsStr = finalVocabularyIds.map(id => id.toString());
        const vocabIdsToRemove = oldVocabularyIds.filter(id => !newVocabularyIdsStr.includes(id));
        
        if (vocabIdsToRemove.length > 0) {
            const vocabsToDelete = await Vocabulary.find({ _id: { $in: vocabIdsToRemove } });
            vocabsToDelete.forEach(v => { if (v.audioUrl) oldFilesToDelete.push(path.resolve(`public${v.audioUrl}`)) });
            await Vocabulary.deleteMany({ _id: { $in: vocabIdsToRemove } });
        }

        const updates = { entryVocabularies: finalVocabularyIds };
        if (newImageFile) {
            if (existingEntry.entryImagePath) {
                oldFilesToDelete.push(path.resolve(`public${existingEntry.entryImagePath}`));
            }
            updates.entryImagePath = newImageFile.path.replace(/\\/g, '/').replace('public', '');
        }

        const updatedEntry = await Entry.findByIdAndUpdate(entryId, { $set: updates }, { new: true });
        
        if (finalVocabularyIds.length > 1) {
            await Promise.all(finalVocabularyIds.map(id =>
                Vocabulary.updateOne({ _id: id }, { $set: { translation: finalVocabularyIds.filter(otherId => !otherId.equals(id)) } })
            ));
        }

        oldFilesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) fs.unlink(filePath, (err) => { if (err) console.error(err) });
        });

        res.status(200).json({ message: 'Entri berhasil diperbarui.', data: await Entry.findById(updatedEntry._id) });

    } catch (error) {
        await cleanupUploadedFiles(allUploadedFiles);
        console.error("Error saat memperbarui entri:", error);
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui entri.', error: error.message });
    }
};

/**
 * @desc     Menghapus entri, kosakata terkait, dan file-filenya
 * @route    DELETE /api/entries/:entryId
 * @access   Private/Admin
 */
export const deleteEntry = async (req, res) => {
    const { entryId } = req.params;
    try {
        const entry = await Entry.findById(entryId);
        if (!entry) return res.status(404).json({ message: 'Entri tidak ditemukan.' });

        const filesToDelete = [];
        if (entry.entryImagePath) filesToDelete.push(path.resolve(`public${entry.entryImagePath}`));

        if (entry.entryVocabularies && entry.entryVocabularies.length > 0) {
            const vocabs = await Vocabulary.find({ _id: { $in: entry.entryVocabularies } });
            for (const vocab of vocabs) {
                if (vocab.audioUrl) filesToDelete.push(path.resolve(`public${vocab.audioUrl}`));
            }
            await Vocabulary.deleteMany({ _id: { $in: entry.entryVocabularies } });
        }

        await Entry.findByIdAndDelete(entryId);
        await Topic.updateOne({ _id: entry.topic }, { $pull: { topicEntries: entryId } });

        filesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) fs.unlink(filePath, err => { if (err) console.error(err) });
        });
        
        res.status(200).json({ message: 'Entri berhasil dihapus.' });
    } catch (error) {
        console.error("Error saat menghapus entri:", error);
        res.status(500).json({ message: 'Gagal menghapus entri.', error: error.message });
    }
};