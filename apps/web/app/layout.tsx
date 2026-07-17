import React from 'react';
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'MusimAman - Simulasi Arus Kas Pertanian',
  description: 'Uji ketahanan arus kas Anda terhadap fluktuasi panen dan pasar.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased overflow-x-hidden bg-[#E8EFE8] min-h-screen flex flex-col font-sans text-[#0C0D05]">
        {/* TopNavBar */}
        <nav className="w-full sticky top-0 z-50 bg-[#FFFFFF] border-b border-[rgba(118,119,116,0.2)]">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-4 max-w-[1200px] mx-auto gap-4 md:gap-0">
            {/* Left: Logo & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/" className="font-sans text-[24px] font-bold text-[#446345] tracking-tight">
                MusimAman
              </Link>
              <span className="bg-[#e9e46f] text-[#686500] px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">
                Data Simulasi
              </span>
              
              {/* ConnectivityBadge (Online green pill) */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#c8ecc5] text-[#2f4e31] rounded-full border border-[#5c7d5c]/20">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#446345] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#446345]"></span>
                </span>
                <span className="text-[10px] font-semibold tracking-wide">• Online</span>
              </div>
            </div>

            {/* Center: Nav links */}
            <div className="hidden md:flex items-center gap-6">
              <Link className="text-[#446345] font-bold border-b-2 border-[#446345] py-1 text-[14px]" href="/">
                Solusi
              </Link>
              <Link className="text-[#424841] hover:text-[#446345] transition-colors text-[14px]" href="/demo">
                Teknologi
              </Link>
              <Link className="text-[#424841] hover:text-[#446345] transition-colors text-[14px]" href="/disclaimer">
                Kemitraan
              </Link>
              <Link className="text-[#424841] hover:text-[#446345] transition-colors text-[14px]" href="/saved">
                Tentang Kami
              </Link>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-4">
              <Link href="/auth/sign-in" className="text-[#424841] font-medium hover:text-[#446345] transition-colors text-[14px] min-h-[44px] flex items-center justify-center">
                Masuk
              </Link>
              <Link href="/plans/new" className="bg-[#446345] text-white px-5 py-2.5 rounded-lg text-[14px] font-bold transition-transform active:scale-95 min-h-[44px] flex items-center justify-center">
                Mulai Simulasi
              </Link>
            </div>
          </div>
        </nav>

        {/* Children content */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-[#eeeee9] w-full border-t border-[rgba(118,119,116,0.2)] mt-12">
          <div className="flex flex-col md:flex-row justify-between items-center px-6 py-12 max-w-[1200px] mx-auto gap-6">
            <div className="flex flex-col gap-2 items-center md:items-start max-w-2xl">
              <span className="font-sans text-[20px] font-bold text-[#446345]">MusimAman</span>
              <p className="text-[12px] text-[#424841]">
                © 2024 MusimAman. Seluruh hak cipta dilindungi undang-undang.
              </p>
              <p className="text-[14px] text-[#0C0D05] italic font-semibold mt-2 opacity-90 text-center md:text-left leading-relaxed">
                Pemberitahuan: Alat bantu diskusi, bukan persetujuan kredit atau nasihat keuangan. Semua skenario adalah simulasi berdasarkan asumsi pengguna.
              </p>
            </div>
            <div className="flex gap-6 text-[14px]">
              <Link className="text-[#424841] hover:text-[#446345] transition-colors" href="/disclaimer">Syarat &amp; Ketentuan</Link>
              <Link className="text-[#424841] hover:text-[#446345] transition-colors" href="/privacy">Kebijakan Privasi</Link>
              <Link className="text-[#424841] hover:text-[#446345] transition-colors" href="/disclaimer">Disklaimer Hukum</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
