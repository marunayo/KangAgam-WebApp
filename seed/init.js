// seed/init.js (Simplified & Fixed)
print('Memulai skrip inisialisasi replica set...');

let status;
try {
    status = rs.status();
    print('Replica set sudah ada, pengecekan dilewati.');
} catch (e) {
    print('Replica set belum ada, memulai inisialisasi...');
    rs.initiate({
        _id: "rs0",
        members: [{ _id: 0, host: "database:27017" }]
    });
    print('✅ Inisialisasi replica set berhasil.');
}

// Tunggu hingga node ini menjadi primary
print('Menunggu node menjadi PRIMARY...');
while (!db.isMaster().ismaster) {
    print('Belum menjadi primary, menunggu 1 detik...');
    sleep(1000);
}
print('STATUS: Node ini sekarang adalah PRIMARY. Melanjutkan proses seeding...');

// Setelah menjadi primary, baru lakukan seeding data
const targetDB = db.getSiblingDB('KangAgam-DB');

// Seeding admin (hanya jika koleksi kosong untuk mencegah duplikasi)
if (targetDB.admins.countDocuments() === 0) {
    targetDB.admins.insertOne({
        adminName: "Super Admin",
        adminEmail: "superadmin@email.com",
        adminPassword: "$2b$10$WKX7zPJuiTPq.Irk6Coeqe5is3uxLS8q7znt4LUd.arl.a.T6nWiO",
        role: "superadmin"
    });
    print('Seeding "admins" collection selesai.');
} else {
    print('"admins" collection sudah berisi data, seeding dilewati.');
}

// Seeding bahasa (hanya jika koleksi kosong)
if (targetDB.languages.countDocuments() === 0) {
    targetDB.languages.insertMany([
        { languageName: "Indonesia", languageCode: "id" },
        { languageName: "Sunda", languageCode: "su" },
        { languageName: "Inggris", languageCode: "en" }
    ]);
    print('Seeding "languages" collection selesai.');
} else {
    print('"languages" collection sudah berisi data, seeding dilewati.');
}

print('🚀 Proses inisialisasi dan seeding database selesai sepenuhnya.');