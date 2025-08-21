import mongoose from 'mongoose';
import LocalizedTextSchema from './schemas/LocalizedTextSchema.js';

const Schema = mongoose.Schema;

const CultureTopicSchema = new Schema({
    // Nama topik budaya, multibahasa (cth: "Tarian Tradisional")
    name: [LocalizedTextSchema],
    // Path ke gambar thumbnail untuk topik ini
    imagePath: {
        type: String,
        required: true,
        trim: true
    },
}, { timestamps: true });

export default mongoose.model('CultureTopic', CultureTopicSchema);