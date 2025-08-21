import mongoose from 'mongoose';
import LocalizedTextSchema from './schemas/LocalizedTextSchema.js';

const Schema = mongoose.Schema;

const CultureEntrySchema = new Schema({
    // Judul entri budaya, multibahasa
    title: [LocalizedTextSchema],
    // Deskripsi entri budaya, juga multibahasa
    description: [LocalizedTextSchema],
    // Path ke gambar utama
    imagePath: {
        type: String,
        required: [true, 'Path gambar tidak boleh kosong'],
        trim: true
    },
    // Path atau URL ke video
    videoUrl: {
        type: String,
        required: [true, 'URL atau path video tidak boleh kosong'],
        trim: true
    },
    // Referensi ke Topik Budaya
    cultureTopic: {
        type: Schema.Types.ObjectId,
        ref: 'CultureTopic',
        required: true,
        index: true
    }
}, {
    timestamps: true
});

export default mongoose.model('CultureEntry', CultureEntrySchema);