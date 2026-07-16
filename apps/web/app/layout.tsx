import React from 'react';
import './globals.css';
import Link from 'next/link';

export const metadata = {
  title: 'MusimAman | Simulasi Arus Kas Pertanian',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="light">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Geist:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased overflow-x-hidden bg-[#E8EFE8]">
        {/* TopAppBar */}
        <nav className="sticky top-0 z-50 bg-[#E8EFE8] border-b border-border">
          <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto">
            <div className="flex items-center gap-4">
              <Link href="/" className="font-headline-md text-headline-md font-bold text-text-primary hover:opacity-80 transition-opacity">
                MusimAman
              </Link>
              <span className="hidden md:inline-flex px-2 py-1 bg-surface-variant text-on-surface-variant font-label-sm text-[10px] rounded-full uppercase tracking-wider border border-border">
                  Data Simulasi/Sintetis
              </span>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="/demo">Simulasi</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="/plans/new">Template</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="/disclaimer">Edukasi</Link>
              <Link className="text-on-surface-variant hover:text-primary transition-colors font-label-sm text-label-sm" href="/saved">Kontak</Link>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/plans/new" className="bg-primary text-on-primary px-4 py-2 rounded-lg font-label-sm text-label-sm hover:opacity-90 transition-opacity flex items-center justify-center min-h-[40px]">
                  Mulai Simulasi
              </Link>
            </div>
          </div>
        </nav>

        {children}

        {/* Footer */}
        <footer className="bg-surface-container-highest border-t border-border mt-12">
          <div className="w-full px-6 py-12 max-w-[1200px] mx-auto flex flex-col gap-4">
            <div className="flex flex-col md:flex-row justify-between gap-12">
              <div className="space-y-2 max-w-xs">
                <span className="font-headline-md text-headline-md text-text-primary font-bold">MusimAman</span>
                <p className="font-body-md text-body-md text-on-surface-variant">Memberdayakan petani kecil dengan visibilitas finansial yang lebih baik untuk ketahanan pangan nasional.</p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <h4 className="font-label-sm font-bold text-on-surface">Navigasi</h4>
                  <Link className="font-body-md text-body-md text-on-surface-variant hover:underline decoration-primary" href="/disclaimer">Mandatory Simulation Notice</Link>
                  <a className="font-body-md text-body-md text-on-surface-variant hover:underline decoration-primary" href="https://www.bmkg.go.id" target="_blank" rel="noopener noreferrer">Konteks Cuaca: BMKG</a>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="font-label-sm font-bold text-on-surface">Hukum</h4>
                  <a className="font-body-md text-body-md text-on-surface-variant hover:underline decoration-primary" href="https://www.badanpangan.go.id" target="_blank" rel="noopener noreferrer">Referensi Pangan: Bapanas</a>
                  <Link className="font-body-md text-body-md text-on-surface-variant hover:underline decoration-primary" href="/privacy">Kebijakan Privasi</Link>
                </div>
              </div>
            </div>
            <div className="pt-12 mt-12 border-t border-border/50">
              <p className="font-disclaimer text-disclaimer text-on-surface-variant leading-relaxed italic mb-4">
                  Pemberitahuan: Alat bantu diskusi, bukan persetujuan kredit atau nasihat keuangan. Semua skenario adalah simulasi berdasarkan asumsi pengguna. MusimAman tidak bertanggung jawab atas keputusan finansial yang diambil berdasarkan simulasi ini.
              </p>
              <p className="font-body-md text-disclaimer text-on-surface-variant">
                  © 2024 MusimAman. Pahami Risiko Arus Kas Musiman Sebelum Menjadi Krisis.
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
