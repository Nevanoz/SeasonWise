import React from 'react';
import { AlertOctagon } from 'lucide-react';

export default function DisclaimerPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-border p-8 md:p-10 rounded-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <AlertOctagon className="w-8 h-8 text-[#986924]" />
        <h1 className="text-xl font-bold text-text-primary">Penolakan Jaminan & Disclaimer Hukum</h1>
      </div>

      <div className="space-y-4 text-sm text-text-primary leading-relaxed">
        {/* Strictly required warning */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 text-[#986924] rounded-lg font-bold">
          Pemberitahuan Penting: Alat bantu diskusi, bukan persetujuan kredit atau nasihat keuangan. Semua skenario adalah simulasi berdasarkan asumsi pengguna.
        </div>

        <p>
          Layanan MusimAman dirancang secara deterministik sebagai media simulasi kas pertanian mandiri untuk membantu petani kecil memahami dinamika arus keuangan musiman.
        </p>

        <h2 className="font-bold text-base mt-4 text-primary">1. Bukan Merupakan Rekomendasi Finansial</h2>
        <p>
          Rasio, metrik, skor ketahanan, dan perbandingan pembiayaan yang ditampilkan dalam aplikasi ini adalah representasi matematis dari asumsi yang Anda masukkan. Hasil simulasi ini tidak boleh dianggap sebagai:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Persetujuan atau jaminan pencairan kredit dari lembaga jasa keuangan mana pun.</li>
          <li>Prediksi akurat hasil pertanian di lapangan yang bergantung pada iklim dan hama asli.</li>
          <li>Saran investasi, legalitas hukum, atau strategi perencanaan pajak.</li>
        </ul>

        <h2 className="font-bold text-base mt-4 text-primary">2. Batasan Tanggung Jawab</h2>
        <p>
          MusimAman dan pengembangnya tidak bertanggung jawab atas segala bentuk kerugian finansial, kegagalan bayar pinjaman, atau kegagalan panen yang timbul dari keputusan bisnis atau alokasi anggaran yang Anda lakukan setelah menggunakan simulator ini.
        </p>

        <h2 className="font-bold text-base mt-4 text-primary">3. Data Pendukung Cuaca & Pasar</h2>
        <p>
          Data pendukung yang ditampilkan dari BMKG dan Bapanas bersifat referensial dan dapat mengalami keterlambatan pembaharuan. MusimAman tidak menjamin keakuratan real-time dari data eksternal tersebut.
        </p>
      </div>
    </div>
  );
}
