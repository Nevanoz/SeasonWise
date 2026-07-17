import type { Metadata } from 'next';
import Link from 'next/link';
import { Menu, Sprout } from 'lucide-react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'MusimAman', template: '%s | MusimAman' },
  description: 'Simulasikan arus kas usaha tani, pembiayaan, dan skenario panen secara transparan.',
};

const navItems = [
  { href: '/demo', label: 'Demo' },
  { href: '/plans/new', label: 'Buat rencana' },
  { href: '/saved', label: 'Rencana tersimpan' },
];

function Brand() {
  return (
    <Link href="/" className="brand" aria-label="MusimAman, beranda">
      <span className="brand-mark" aria-hidden="true"><Sprout size={18} strokeWidth={2.4} /></span>
      <span>MusimAman</span>
    </Link>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        <a className="skip-link" href="#main-content">Lewati ke konten utama</a>
        <header className="site-header">
          <div className="shell header-inner">
            <Brand />
            <nav className="desktop-nav" aria-label="Navigasi utama">
              {navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
            </nav>
            <div className="header-actions">
              <Link className="button button-quiet desktop-signin" href="/auth/sign-in">Masuk</Link>
              <Link className="button button-primary" href="/plans/new">Mulai simulasi</Link>
              <details className="mobile-menu">
                <summary aria-label="Buka menu"><Menu aria-hidden="true" size={21} /></summary>
                <nav aria-label="Navigasi seluler">
                  {navItems.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
                  <Link href="/auth/sign-in">Masuk</Link>
                </nav>
              </details>
            </div>
          </div>
        </header>
        <main id="main-content" className="site-main">{children}</main>
        <footer className="site-footer">
          <div className="shell footer-grid">
            <div>
              <Brand />
              <p className="footer-copy">Alat bantu diskusi untuk memahami arus kas usaha tani. Bukan persetujuan kredit atau nasihat keuangan.</p>
            </div>
            <nav aria-label="Tautan kebijakan" className="footer-links">
              <Link href="/privacy">Privasi</Link>
              <Link href="/disclaimer">Disklaimer</Link>
            </nav>
            <p className="footer-meta">© 2026 MusimAman</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
