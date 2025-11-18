#!/bin/bash
set -e

# Start MongoDB in the background
mongod --bind_ip_all --replSet rs0 &
pid=$!

# Wait for MongoDB to be ready
until mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1
do
  echo "Waiting for MongoDB to start..."
  sleep 1
done
echo "MongoDB started."

# ====================================================================
# TAHAP 1: SEEDING DATA WAJIB (MANDATORY)
# ====================================================================
# Selalu jalankan init.js. Skrip ini sudah memiliki logika
# untuk mencegah duplikasi data admin dan language.
echo "Running init.js for mandatory data seeding (admins, languages)..."
mongosh < /docker-entrypoint-initdb.d/init.js
echo "✅ Mandatory data seeding complete."

# ====================================================================
# TAHAP 2: RESTORE DATA TAMBAHAN (OPTIONAL)
# ====================================================================
DB_NAME="KangAgam-DB"
DUMP_PATH="/docker-entrypoint-initdb.d/data/$DB_NAME"

echo "Checking if optional data needs to be restored..."

# Untuk mengecek, kita lihat salah satu koleksi besar dari dump,
# misalnya 'entries'. Jika koleksi ini kosong, kita asumsikan
# seluruh data dump belum di-restore. Ganti 'entries' jika perlu.
# Pastikan koleksi ini TIDAK SAMA dengan yang ada di init.js.
CHECK_COLLECTION="entries"
COLLECTION_COUNT=$(mongosh --quiet --eval "db.getSiblingDB('$DB_NAME').getCollection('$CHECK_COLLECTION').countDocuments()")

if [ "$COLLECTION_COUNT" -eq 0 ]; then
    # Periksa apakah direktori dump ada sebelum mencoba restore
    if [ -d "$DUMP_PATH" ]; then
        echo "Optional data collection '$CHECK_COLLECTION' is empty. Starting mongorestore from dump..."
        mongorestore --db="$DB_NAME" "$DUMP_PATH"
        echo "✅ Optional data restore from dump complete."
    else
        echo "Dump directory not found at $DUMP_PATH. Skipping optional data restore."
    fi
else
    echo "Optional data already exists (found $COLLECTION_COUNT documents in '$CHECK_COLLECTION'). Skipping mongorestore."
fi

echo "🚀 Database setup process finished."
# ====================================================================

# Bring the MongoDB process to the foreground to keep the container alive
wait $pid