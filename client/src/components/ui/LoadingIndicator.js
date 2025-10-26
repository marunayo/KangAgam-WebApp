import React from 'react';
import { motion } from 'framer-motion'; // Import motion dari framer-motion untuk animasi

// Varian animasi untuk container (parent dari lingkaran)
// Digunakan untuk mengatur stagger (jeda) animasi antar anak
const containerVariants = {
  start: { // State awal
    transition: {
      staggerChildren: 0.1, // Beri jeda 0.1 detik antara animasi setiap lingkaran
    },
  },
  end: {}, // State akhir (tidak perlu properti khusus di sini)
};

// Varian animasi untuk setiap lingkaran loading
const circleVariants = {
  start: {
    y: '0%', // Posisi awal (di atas)
  },
  end: {
    y: '100%', // Posisi akhir (di bawah)
  },
};

// Pengaturan transisi untuk animasi lingkaran
const circleTransition = {
  duration: 0.4, // Durasi satu siklus animasi (naik atau turun)
  repeat: Infinity, // Ulangi animasi tanpa henti
  repeatType: 'reverse', // Setelah mencapai 'end', animasi akan berbalik ke 'start'
  ease: 'easeInOut', // Tipe easing untuk pergerakan yang mulus
};

/**
 * Komponen indikator loading sederhana dengan animasi tiga titik vertikal.
 * Menggunakan framer-motion untuk animasi.
 */
const LoadingIndicator = () => {
  return (
    <div className="flex justify-center items-center w-full h-full p-10">
      {/* Container utama untuk animasi, menerapkan varian container */}
      <motion.div
        className="w-16 h-8 flex justify-around" // Lebar dan tinggi area animasi, flex untuk menata lingkaran
        variants={containerVariants}
        initial="start" // Mulai dari state 'start'
        animate="end" // Animasi ke state 'end' (yang memicu animasi anak)
      >
        {/* Lingkaran pertama */}
        <motion.span
          className="block w-4 h-4 bg-indigo-500 rounded-full" // Styling lingkaran
          variants={circleVariants} // Gunakan varian lingkaran
          transition={circleTransition} // Gunakan transisi lingkaran
        />
        {/* Lingkaran kedua */}
        <motion.span
          className="block w-4 h-4 bg-indigo-500 rounded-full"
          variants={circleVariants}
          transition={circleTransition}
        />
        {/* Lingkaran ketiga */}
        <motion.span
          className="block w-4 h-4 bg-indigo-500 rounded-full"
          variants={circleVariants}
          transition={circleTransition}
        />
      </motion.div>
    </div>
  );
};

export default LoadingIndicator;