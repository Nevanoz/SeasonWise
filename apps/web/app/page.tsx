import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="max-w-[1200px] mx-auto px-6 py-12 space-y-12 fade-in">
      {/* LandingHero & Asymmetric Layout */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
        
        {/* Hero Left Content */}
        <div className="md:col-span-7 flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAF5] border border-[rgba(118,119,116,0.2)] text-[14px] font-medium text-[#5C4F2D]">
              <span className="material-symbols-outlined text-[18px]">cloud</span> Konteks Cuaca: BMKG
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAFAF5] border border-[rgba(118,119,116,0.2)] text-[14px] font-medium text-[#5C4F2D]">
              <span className="material-symbols-outlined text-[18px]">eco</span> Referensi Pangan: Bapanas
            </span>
          </div>

          <h1 className="text-3xl md:text-[3rem] font-extrabold text-[#0C0D05] leading-tight tracking-tighter">
            Pahami Risiko Arus Kas Musiman Sebelum Menjadi Krisis
          </h1>
          
          <p className="text-[#5C4F2D] text-[1.125rem] leading-relaxed max-w-2xl font-sans">
            MusimAman membantu petani kecil Indonesia mensimulasikan apakah kebutuhan produksi, biaya rumah tangga, dan cicilan tetap aman saat jadwal panen atau harga pasar berubah.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Link
              href="/demo"
              className="bg-[#658665] text-white px-8 py-4 rounded-lg font-bold text-[18px] text-center transition-all hover:bg-opacity-90 active:scale-[0.98] min-h-[44px] flex items-center justify-center"
            >
              Coba Demo 1-Klik
            </Link>
            <Link
              href="/plans/new"
              className="border-2 border-[#658665] text-[#658665] px-8 py-4 rounded-lg font-bold text-[18px] text-center transition-all hover:bg-[#658665] hover:text-white active:scale-[0.98] min-h-[44px] flex items-center justify-center"
            >
              Buat Rencana Baru
            </Link>
          </div>

          {/* Abstract Visual for Hero */}
          <div className="mt-8 w-full h-[320px] border border-[rgba(118,119,116,0.2)] rounded-xl relative overflow-hidden bg-white">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-85"
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9BEz6Y9G2t82vE1QETKcd4G_irlm3Twfig7rUdwVm54vrhzUgvBHRc-OGbXwYEbCyGXJmOzSFjfYvI2zMD74cmwIRCEXhfKnBEt6TbjI9Lc3HmGvpfXYTiDSx5SEgCVzsdEmsusArfn3iZY_w-zP21nhzgZNTRgsbxwSeg5yHnrLK5AV8MbrPGQE9s-yvQ-3qhY8tBiB8DAFIB7inlRdFOj_ND4r6mKfkNWNmV1brkG2z107UHjYR')",
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/50 to-transparent"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-[#c8ecc5] rounded-lg border border-[rgba(118,119,116,0.2)]">
                  <span className="material-symbols-outlined text-[#446345] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>insights</span>
                </div>
                <div>
                  <p className="font-bold text-[#0C0D05] text-[16px]">Visualisasi Prediksi Panen</p>
                  <p className="text-sm text-[#5C4F2D]">Berdasarkan data historis 10 tahun terakhir</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Summary Bento Grid (Right) */}
        <div className="md:col-span-5 flex flex-col gap-4">
          
          <div className="bg-white p-6 rounded-xl border border-[rgba(118,119,116,0.2)] flex flex-col gap-2">
            <div className="w-12 h-12 bg-[#5c7d5c] rounded-lg flex items-center justify-center text-white mb-2">
              <span className="material-symbols-outlined text-[28px]">potted_plant</span>
            </div>
            <h3 className="text-xl font-bold text-[#0C0D05]">5 Editable Crop Templates</h3>
            <p className="text-[#5C4F2D] text-[15px] leading-relaxed">
              Mulai simulasi dengan cepat menggunakan template padi, jagung, kedelai, cabai, atau bawang merah yang sudah disesuaikan dengan standar biaya produksi lokal.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[rgba(118,119,116,0.2)] flex flex-col gap-2">
            <div className="w-12 h-12 bg-[#e9e46f] rounded-lg flex items-center justify-center text-[#686500] mb-2">
              <span className="material-symbols-outlined text-[28px]">calculate</span>
            </div>
            <h3 className="text-xl font-bold text-[#0C0D05]">Deterministic Cash-Flow</h3>
            <p className="text-[#5C4F2D] text-[15px] leading-relaxed">
              Perhitungan biaya input, tenaga kerja, dan cicilan yang transparan. Lihat saldo akhir bulan Anda dengan akurasi matematis tanpa "tebak-tebakan".
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-[rgba(118,119,116,0.2)] flex flex-col gap-2">
            <div className="w-12 h-12 bg-[#ffddb5] rounded-lg flex items-center justify-center text-[#2a1800] mb-2">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <h3 className="text-xl font-bold text-[#0C0D05]">Stress Skenario Simulations</h3>
            <p className="text-[#5C4F2D] text-[15px] leading-relaxed">
              Uji ketahanan finansial Anda. Apa yang terjadi jika panen mundur 3 minggu? Bagaimana jika harga pupuk naik 20% mendadak? Temukan jawabannya di sini.
            </p>
          </div>

        </div>
      </section>

      {/* Secondary Section: Contextual Data Display */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left: Project Cash Flow */}
        <div className="bg-[#FAFAF5] p-6 rounded-xl border border-[rgba(118,119,116,0.2)] md:col-span-2 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h4 className="font-bold text-[#0C0D05] uppercase tracking-wider text-xs">Visualisasi Arus Kas Proyeksi</h4>
              <p className="text-sm text-[#5C4F2D] mt-0.5">Simulasi Tanam Padi - Musim Gadu 2024</p>
            </div>
            <div className="flex gap-2">
              <div className="w-3 h-3 rounded-full bg-[#446345]"></div>
              <div className="w-3 h-3 rounded-full bg-[#646100]"></div>
            </div>
          </div>

          {/* Chart Visualization */}
          <div className="w-full h-48 flex items-end justify-between gap-3 px-2">
            <div className="w-full bg-[#446345]/20 h-[30%] rounded-t-sm transition-opacity hover:opacity-80"></div>
            <div className="w-full bg-[#446345]/20 h-[45%] rounded-t-sm transition-opacity hover:opacity-80"></div>
            <div className="w-full bg-[#446345]/20 h-[25%] rounded-t-sm transition-opacity hover:opacity-80"></div>
            <div className="w-full bg-[#446345] h-[85%] rounded-t-sm relative transition-opacity hover:opacity-95">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-white text-[#446345] px-2.5 py-1 rounded shadow-sm border border-[rgba(118,119,116,0.2)] tracking-wide">
                PANEN
              </div>
            </div>
            <div className="w-full bg-[#446345]/20 h-[40%] rounded-t-sm transition-opacity hover:opacity-80"></div>
            <div className="w-full bg-[#446345]/20 h-[35%] rounded-t-sm transition-opacity hover:opacity-80"></div>
          </div>
          
          <div className="grid grid-cols-6 mt-4 text-[11px] text-[#767774] uppercase font-bold text-center tracking-wider">
            <span>Mei</span>
            <span>Jun</span>
            <span>Jul</span>
            <span className="text-[#446345] font-extrabold">Agu</span>
            <span>Sep</span>
            <span>Okt</span>
          </div>
        </div>

        {/* Right: Kesehatan Skenario */}
        <div className="bg-white p-6 rounded-xl border border-[rgba(118,119,116,0.2)] flex flex-col justify-between gap-6">
          <div>
            <h4 className="font-bold text-[#0C0D05] text-[16px] mb-4">Kesehatan Skenario</h4>
            <div className="flex items-center gap-6 py-4 border-b border-[rgba(118,119,116,0.2)]">
              <div className="text-4xl font-extrabold text-[#446345] font-sans">82%</div>
              <div className="text-[12px] text-[#5C4F2D] leading-tight font-medium">
                Tingkat Keamanan Kas Rumah Tangga
              </div>
            </div>
            <div className="py-4">
              <ul className="text-sm space-y-3 text-[#5C4F2D]">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Biaya sekolah aman</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-green-600 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  <span>Cicilan KUR tertutup</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500 text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
                  <span>Margin pupuk menipis</span>
                </li>
              </ul>
            </div>
          </div>

          <img
            className="w-full h-32 object-cover rounded-lg border border-[rgba(118,119,116,0.2)]"
            alt="Terraced rice fields reflection dawn"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBEEIuZ3ohj0Klm8RImjEqbXYPiQz1IShLgtJqe4CqI5nr52uT0gsYxlPHm1M3g4GDQJKy507KevTJBPiGaEJZfdHI5Yp3W9Di14tt4HXX4_eoeALx3R0E_6cc00CojnPp2cr1pPr-avFrVDrQBUt1S6ez-45i2rtZ8ujGJECcmSCqsE0mbGt_XPeKIlucmMYnxea9dJVUzNFU1W_Ffn1TFYQvwlwr5rX0JeiZgsqYH4ArSNyn_UIiP"
          />
        </div>

      </section>
    </main>
  );
}
