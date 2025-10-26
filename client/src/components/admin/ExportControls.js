import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
// import * as XLSX from 'xlsx';
// import { saveAs } from 'file-saver';

/**
 * Helper function untuk memformat nama periode filter.
 * @param {string} period - Nama periode (cth: 'daily').
 * @returns {string} Nama yang sudah diformat (cth: 'Harian').
 */
const formatPeriod = (period) => {
    switch (period) {
        case 'daily': return 'Harian';
        case 'weekly': return 'Mingguan';
        case 'monthly': return 'Bulanan';
        case 'yearly': return 'Tahunan';
        default: return '';
    }
};

/**
 * Helper function untuk mendapatkan nama topik dalam bahasa Indonesia.
 * @param {string|Array} nameData - Data nama topik.
 * @returns {string} Nama topik.
 */
const getTopicName = (nameData) => {
    if (!nameData) return 'N/A';
    if (typeof nameData === 'string') return nameData;
    if (Array.isArray(nameData)) {
        const idName = nameData.find(n => n.lang === 'id');
        if (idName) return idName.value;
        return nameData.length > 0 ? nameData[0].value : 'N/A';
    }
    return 'N/A';
};

/**
 * Komponen untuk menyediakan tombol ekspor PDF (dan Excel, jika diaktifkan).
 * @param {object} visitorData - Data untuk chart total kunjungan.
 * @param {object} topicData - Data untuk chart topik.
 * @param {object} uniqueVisitorData - Data untuk chart pengunjung unik.
 * @param {object} cityData - Data untuk chart domisili.
 * @param {object} filters - Objek berisi filter yang sedang aktif.
 * @param {React.Ref} visitorChartRef - Ref ke chart total kunjungan.
 * @param {React.Ref} topicChartRef - Ref ke chart topik.
 * @param {React.Ref} uniqueVisitorChartRef - Ref ke chart pengunjung unik.
 * @param {React.Ref} cityChartRef - Ref ke chart domisili.
 */
const ExportControls = ({ 
    visitorData, 
    topicData,
    uniqueVisitorData,
    cityData,
    filters,
    visitorChartRef,
    topicChartRef,
    uniqueVisitorChartRef,
    cityChartRef 
}) => {
    const [isExporting, setIsExporting] = useState(false);

    /**
     * Handler untuk membuat dan mengunduh laporan dalam format PDF.
     */
    const handleExportPDF = () => {
        setIsExporting(true);
        const doc = new jsPDF();
        const today = new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });

        // Judul Utama
        doc.setFontSize(18);
        doc.text('Laporan Statistik Pengguna Kang Agam', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Tanggal Ekspor: ${today}`, 14, 30);

        let yPos = 40; // Posisi Y awal pada PDF

        /**
         * Fungsi internal untuk menambahkan satu blok (chart dan tabel) ke PDF.
         * @param {string} title - Judul blok.
         * @param {React.Ref} chartRef - Ref ke canvas chart.
         * @param {Array<Array<string>>} tableData - Data untuk tabel.
         * @param {Array<string>} tableHeaders - Header untuk tabel.
         * @param {string} periodFilter - Filter periode yang aktif.
         * @param {number|null} totalValue - Nilai total (opsional).
         */
        const addChartAndTable = (title, chartRef, tableData, tableHeaders, periodFilter, totalValue = null) => {
            if (yPos > 240) { // Cek jika perlu halaman baru
                doc.addPage();
                yPos = 20;
            }
            doc.setFontSize(14);
            doc.text(`${title} (Filter: ${formatPeriod(periodFilter)})`, 14, yPos);
            yPos += 8;

            if (totalValue !== null) {
                doc.setFontSize(11);
                doc.text(`Total: ${totalValue.toLocaleString('id-ID')}`, 14, yPos);
                yPos += 6;
            }

            try {
                // Coba tambahkan gambar dari canvas chart
                const chartImage = chartRef.current?.toBase64Image();
                if (chartImage) {
                    doc.addImage(chartImage, 'PNG', 14, yPos, 180, 80);
                    yPos += 90; // Beri ruang setelah gambar
                }
            } catch (e) {
                console.error("Gagal menambahkan chart ke PDF:", e);
                doc.text("Gagal memuat gambar chart.", 14, yPos);
                yPos += 10;
            }

            // Tambahkan tabel data
            autoTable(doc, {
                startY: yPos,
                head: [tableHeaders],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [41, 128, 185] },
            });
            // Perbarui posisi Y ke posisi akhir setelah tabel dibuat
            yPos = doc.lastAutoTable.finalY + 15;
        };

        // 1. Total Kunjungan
        addChartAndTable(
            'Total Kunjungan',
            visitorChartRef,
            visitorData.distribution.map(d => [d.label, d.count]),
            ['Periode', 'Jumlah Kunjungan'],
            filters.visitorsPeriod,
            visitorData.total
        );

        // 2. Pengunjung Unik
        addChartAndTable(
            'Pengunjung Unik',
            uniqueVisitorChartRef,
            uniqueVisitorData.distribution.map(d => [d.label, d.count]),
            ['Periode', 'Jumlah Pengunjung Unik'],
            filters.uniqueVisitorsPeriod,
            uniqueVisitorData.total
        );

        // 3. Topik Favorit
        addChartAndTable(
            'Distribusi Kunjungan Topik',
            topicChartRef,
            topicData.distribution.map(d => [getTopicName(d.name), d.count]),
            ['Nama Topik', 'Jumlah Kunjungan'],
            filters.topicPeriod
        );

        // 4. Domisili Pengunjung
        addChartAndTable(
            'Distribusi Domisili Pengunjung',
            cityChartRef,
            cityData.distribution.map(d => [d.label, d.count]),
            ['Domisili (Kota/Kabupaten)', 'Jumlah Pengunjung'],
            filters.cityPeriod
        );

        // Simpan file PDF
        doc.save(`statistik-kang-agam-${new Date().toISOString().split('T')[0]}.pdf`);
        setIsExporting(false);
    };

    return (
        <div className="flex items-center gap-2">
            <button
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-red-500/10 text-red-600 font-bold px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-500/20 text-sm"
            >
                {isExporting ? 'Mengunduh...' : 'Unduh PDF'}
            </button>
            {/* <button onClick={handleExportExcel} className="...">Export Excel</button> */}
        </div>
    );
};

export default ExportControls;