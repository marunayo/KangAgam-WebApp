// service/src/config/seed.js
import Language from '../models/LanguageModel.js';
import Admin from '../models/AdminModel.js';

// --- Data Awal yang Diinginkan ---
const defaultLanguages = [
    { languageName: 'Indonesia', languageCode: 'id' },
    { languageName: 'Sunda', languageCode: 'su' },
    { languageName: 'English', languageCode: 'en' },
];

export const seedDatabase = async () => {
    try {
        console.log('🌱 Checking for initial data...');

        // 1. Seed Languages
        const languageCount = await Language.countDocuments();
        if (languageCount === 0) {
            await Language.insertMany(defaultLanguages);
            console.log('Languages have been seeded.');
        }

        // 2. Seed Superadmin
        const superadminExists = await Admin.findOne({ role: 'superadmin' });
        if (!superadminExists) {
            if (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_PASSWORD) {
                console.error('❌ SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in .env');
                return; // Hentikan proses jika variabel tidak ada
            }

            await Admin.create({
                adminName: 'Super Admin',
                adminEmail: process.env.SUPERADMIN_EMAIL,
                adminPassword: process.env.SUPERADMIN_PASSWORD,
                role: 'superadmin',
            });
            console.log('Superadmin has been created.');
        }

    } catch (error) {
        console.error('Error during database seeding:', error.message);
    }
};