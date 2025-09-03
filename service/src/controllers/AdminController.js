import Admin from '../models/AdminModel.js';
import jwt from 'jsonwebtoken'; // Diperlukan untuk login (install: npm i jsonwebtoken)
import crypto from 'crypto';
import sendEmail from '../utils/SendEmail.js';
import mongoose from 'mongoose';
import Setting from '../models/SettingModel.js';

// Fungsi helper untuk generate token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

/**
 * @desc    Login Admin
 * @route   POST /api/admins/login
 */
export const loginAdmin = async (req, res) => {
    try {
        const { adminEmail, adminPassword } = req.body;
        if (!adminEmail || !adminPassword) {
            return res.status(400).json({ message: "Email dan password harus diisi." });
        }

        const admin = await Admin.findOne({ adminEmail }).select('+adminPassword');

        if (admin && (await admin.comparePassword(adminPassword))) {
            res.status(200).json({
                message: "Login berhasil.",
                _id: admin._id,
                adminName: admin.adminName,
                adminEmail: admin.adminEmail,
                token: generateToken(admin._id),
                role: admin.role
            });
        } else {
            res.status(401).json({ message: "Email atau password salah." });
        }
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan saat login.", error: error.message });
    }
};

/**
 * @desc    Membuat (Create) admin baru (Registrasi)
 * @route   POST /api/admins
 */
export const createAdmin = async (req, res) => {
    try {
        // Ambil pengaturan batas admin, atau buat jika belum ada
        let settings = await Setting.findOne({ key: 'app_settings' });
        if (!settings) {
            settings = await Setting.create({ key: 'app_settings' }); // Default maxAdmins adalah 5
        }
        const maxAdmins = settings.value.maxAdmins;

        const currentAdminCount = await Admin.countDocuments();

        if (currentAdminCount >= maxAdmins) {
            return res.status(403).json({ message: `Batas maksimum admin (${maxAdmins}) telah tercapai.` });
        }

        const { adminName, adminEmail, adminPassword, role } = req.body;

        const adminExists = await Admin.findOne({ adminEmail });
        if (adminExists) {
            return res.status(400).json({ message: "Admin dengan email ini sudah terdaftar." });
        }

        const admin = await Admin.create({ adminName, adminEmail, adminPassword, role });

        if (admin) {
            res.status(201).json({
                message: "Admin berhasil dibuat.",
                _id: admin._id,
                adminName: admin.adminName,
                adminEmail: admin.adminEmail,
                role: admin.role,
                token: generateToken(admin._id),
            });
        } else {
            throw new Error("Data admin tidak valid.");
        }
    } catch (error) {
        res.status(500).json({ message: "Gagal membuat admin.", error: error.message });
    }
};

/**
 * @desc    Mendapatkan (Read) semua admin
 * @route   GET /api/admins
 */
export const getAllAdmins = async (req, res) => {
    try {
        // Ambil semua admin tanpa password mereka
        const admins = await Admin.find({}).select('-adminPassword');
        res.status(200).json({ count: admins.length, data: admins });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data admin.", error: error.message });
    }
};

/**
 * @desc Memperbarui (Update) data admin
 * @route PUT /api/admins/:id
 */
export const updateAdmin = async (req, res) => {
    try {
        const { id: targetAdminId } = req.params;
        const { adminName, adminEmail, role, newPassword, confirmPassword } = req.body;
        const loggedInAdmin = req.admin;

        // Otorisasi: Izinkan jika superadmin atau mengedit diri sendiri
        if (loggedInAdmin.role !== 'superadmin' && loggedInAdmin._id.toString() !== targetAdminId) {
            return res.status(403).json({ message: "Akses ditolak: Anda hanya dapat mengedit data diri sendiri." });
        }

        const adminToUpdate = await Admin.findById(targetAdminId).select('+adminPassword');

        if (!adminToUpdate) {
            return res.status(404).json({ message: "Admin tidak ditemukan." });
        }

        // Update nama dan email
        adminToUpdate.adminName = adminName || adminToUpdate.adminName;
        adminToUpdate.adminEmail = adminEmail || adminToUpdate.adminEmail;

        // Update role (hanya superadmin)
        if (loggedInAdmin.role === 'superadmin' && role) {
            if (loggedInAdmin._id.toString() === targetAdminId && role !== 'superadmin') {
                return res.status(400).json({ message: 'Superadmin tidak dapat menurunkan perannya sendiri.' });
            }
            adminToUpdate.role = role;
        }

        // Update password jika disediakan
        if (newPassword && confirmPassword) {
            if (newPassword !== confirmPassword) {
                return res.status(400).json({ message: "Password baru dan konfirmasi password tidak cocok." });
            }
            if (newPassword.length < 6) {
                return res.status(400).json({ message: "Password baru harus minimal 6 karakter." });
            }
            adminToUpdate.adminPassword = newPassword; // Akan di-hash otomatis
        }

        const updatedAdmin = await adminToUpdate.save();
        res.status(200).json({ message: "Admin berhasil diperbarui.", data: updatedAdmin });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui admin.", error: error.message });
    }
};

/**
 * @desc    Menghapus (Delete) admin
 * @route   DELETE /api/admins/:id
 */
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Cari admin yang akan dihapus
        const adminToDelete = await Admin.findById(id);

        if (!adminToDelete) {
            return res.status(404).json({ message: "Admin tidak ditemukan." });
        }

        // 2. ✅ LAKUKAN PENGECEKAN PERAN (ROLE)
        if (adminToDelete.role === 'superadmin') {
            // Jika rolenya 'superadmin', tolak penghapusan
            return res.status(403).json({ message: "Akses ditolak: Superadmin tidak dapat dihapus." });
        }

        // 3. Jika bukan superadmin, lanjutkan proses penghapusan
        await Admin.findByIdAndDelete(id);

        res.status(200).json({ message: "Admin berhasil dihapus." });
        
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus admin.", error: error.message });
    }
};

/**
 * @desc Mengganti password admin tanpa memerlukan password lama
 * @route PUT /api/admins/:id/change-password
 * @access Private/Admin (Superadmin atau admin mengedit dirinya sendiri)
 * @param {string} id - ID admin yang ingin diubah passwordnya
 * @param {string} newPassword - Password baru
 * @param {string} confirmPassword - Konfirmasi password baru
 */
export const changePassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { newPassword, confirmPassword } = req.body;
        const loggedInAdmin = req.admin; // Admin yang sedang login

        // Validasi input
        if (!newPassword || !confirmPassword) {
            return res.status(400).json({ message: "Password baru dan konfirmasi password diperlukan." });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Password baru dan konfirmasi password tidak cocok." });
        }

        // Otorisasi: Hanya superadmin atau admin yang mengedit dirinya sendiri
        if (loggedInAdmin.role !== 'superadmin' && loggedInAdmin._id.toString() !== id) {
            return res.status(403).json({ message: "Akses ditolak: Anda hanya dapat mengubah password diri sendiri." });
        }

        const admin = await Admin.findById(id).select('+adminPassword');

        if (!admin) {
            return res.status(404).json({ message: "Admin tidak ditemukan." });
        }

        // Validasi panjang password (opsional, sesuaikan dengan kebutuhan)
        if (newPassword.length < 6) {
            return res.status(400).json({ message: "Password baru harus minimal 6 karakter." });
        }

        admin.adminPassword = newPassword; // Password akan di-hash otomatis oleh middleware 'pre' pada model
        await admin.save();

        res.status(200).json({ message: "Password berhasil diperbarui." });
    } catch (error) {
        res.status(500).json({ message: "Gagal mengubah password.", error: error.message });
    }
};

/**
 * @desc    Admin lupa kata sandi (minta token reset)
 * @route   POST /api/admin/forgot-password
 */
export const forgotPassword = async (req, res) => {
    // 1. Cari admin berdasarkan email
    const admin = await Admin.findOne({ adminEmail: req.body.adminEmail });
    try {

        if (!admin) {
            // Untuk keamanan, kita tidak memberitahu bahwa email tidak terdaftar.
            return res.status(200).json({ message: 'Jika email terdaftar, link reset akan dikirim.' });
        }

        // 2. Generate token reset (dari method yang sudah ada di model)
        const resetToken = admin.setPasswordResetToken();
        await admin.save({ validateBeforeSave: false }); // Simpan token & expiry date ke DB

        // 3. Buat URL reset
        // Ganti 'http://localhost:3000' dengan URL frontend Anda
        const resetURL = `${req.protocol}://localhost:3000/reset-password/${resetToken}`;

        const message = `Anda menerima email ini karena Anda (atau orang lain) meminta untuk mereset kata sandi Anda. Silakan klik link di bawah untuk melanjutkan:\n\n${resetURL}\n\nJika Anda tidak merasa meminta ini, abaikan saja email ini. Token ini akan hangus dalam 30 menit.`;

        // 4. Kirim email
        await sendEmail({
            email: admin.adminEmail,
            subject: 'Reset Kata Sandi Akun Admin Kang Agam',
            message,
        });

        res.status(200).json({
            message: 'Link reset kata sandi telah dikirim ke email Anda.',
        });

    } catch (error) {
        // Jika terjadi error, hapus token di DB agar tidak menggantung
        if (admin) {
            admin.passwordResetToken = undefined;
            admin.passwordResetExpires = undefined;
            await admin.save({ validateBeforeSave: false });
        }
        res.status(500).json({ message: 'Gagal mengirim email.', error: error.message });
    }
};

/**
 * @desc    Reset kata sandi dengan token
 * @route   PUT /api/admins/reset-password/:token
 */
export const resetPassword = async (req, res) => {
    try {
        // 1. Dapatkan token dari URL dan hash kembali untuk dicocokkan dengan DB
        const hashedToken = crypto
            .createHash('sha256')
            .update(req.params.token)
            .digest('hex');

        // 2. Cari admin dengan token yang cocok dan belum hangus
        const admin = await Admin.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }, // Cek apakah belum expired
        });

        if (!admin) {
            return res.status(400).json({ message: 'Token tidak valid atau sudah hangus.' });
        }

        // 3. Set kata sandi baru dan hapus token reset
        admin.adminPassword = req.body.password;
        admin.passwordResetToken = undefined;
        admin.passwordResetExpires = undefined;
        await admin.save(); // pre-save hook di model akan otomatis hash password baru

        // 4. Kirim token login baru sebagai konfirmasi
        const token = generateToken(admin._id);
        res.status(200).json({
            message: 'Kata sandi berhasil direset.',
            token,
        });

    } catch (error) {
        res.status(500).json({ message: 'Gagal mereset kata sandi.', error: error.message });
    }
};