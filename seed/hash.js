const bcrypt = require('bcrypt');

// Ambil password dari argumen ketiga di command line
const password = process.argv[2];

// Jika tidak ada password yang diberikan, tampilkan cara penggunaan
if (!password) {
    console.log('Cara Penggunaan: node hash-generator.js <password_yang_mau_di_hash>');
    process.exit(1); // Keluar dari skrip
}

const saltRounds = 10;

// Hash password dan langsung tampilkan hasilnya
bcrypt.hash(password, saltRounds)
    .then(hash => {
        console.log(hash); // Hanya menampilkan hash agar mudah disalin
    })
    .catch(err => {
        console.error('Error saat hashing:', err);
    });