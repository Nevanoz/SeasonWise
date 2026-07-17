import React from 'react';
import { AlertCircle } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="max-w-2xl mx-auto bg-white border border-[rgba(118,119,116,0.2)] p-8 md:p-10 rounded-xl space-y-6">
        <div className="flex items-center gap-3 border-b border-[rgba(118,119,116,0.2)] pb-4">
          <AlertCircle className="w-8 h-8 text-[#986924]" />
          <h1 className="text-xl font-bold text-[#0C0D05] font-sans tracking-tight">Penolakan Jaminan & Disclaimer Hukum</h1>
        </div>

        <div className="space-y-4 text-sm text-[#0C0D05] leading-relaxed font-sans">
          {/* Strictly required warning */}
          <div className="p-4 bg-[#FFEBEE] border border-[#ba1a1a] text-[#ba1a1a] rounded-lg font-bold">
            Pemberitahuan Penting: Alat bantu diskusi, bukan persetujuan kredit atau nasihat keuangan. Semua skenario adalah simulasi berdasarkan asumsi pengguna.
          </div>

          <p>
            Layanan MusimAman dirancang secara deterministik sebagai media simulasi kas pertanian mandiri untuk membantu petani kecil memahami dinamika arus keuangan musiman.
          </p>

          <h2 className="font-bold text-base mt-4 text-[#446345] font-sans">1. Bukan Merupakan Rekomendasi Finansial</h2>
          <p>
            Rasio, metrik, skor ketahanan, dan perbandingan pembiayaan yang ditampilkan dalam aplikasi ini adalah representasi matematis dari asumsi yang Anda masukkan. Hasil simulasi ini tidak boleh dianggap sebagai:
          </p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Persetujuan atau jaminan pencairan kredit dari lembaga jasa keuangan mana pun.</li>
            <li>Prediksi akurat hasil pertanian di lapangan yang bergantung pada iklim dan hama asli.</li>
            <li>Saran investasi, legalitas hukum, atau strategi perencanaan pajak.</li>
          </ul>

          <h2 className="font-bold text-base mt-4 text-[#446345] font-sans">2. Batasan Tanggung Jawab</h2>
          <p>
            MusimAman dan pengembangnya tidak bertanggung jawab atas segala bentuk kerugian finansial, kegagalan bayar pinjaman, atau kegagalan panen yang timbul dari keputusan bisnis atau alokasi anggaran yang Anda lakukan setelah menggunakan simulator ini.
          </p>

          <h2 className="font-bold text-base mt-4 text-[#446345] font-sans">3. Data Pendukung Cuaca & Pasar</h2>
          <p>
            Data pendukung yang ditampilkan dari BMKG dan Bapanas bersifat referensial dan dapat mengalami keterlambatan pembaharuan. MusimAman tidak menjamin keakuratan real-time dari data eksternal tersebut.
          </p>
        </div>
      </div>
    </div>
  );
}
