import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, Check, ClipboardList, FileText, Layers3, ShieldCheck } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Masukkan kondisi usaha tani',
    text: 'Isi komoditas, jadwal tanam, biaya produksi, kebutuhan rumah tangga, serta rencana pembiayaan dengan angka Anda sendiri.',
    icon: ClipboardList,
  },
  {
    number: '02',
    title: 'Uji perubahan yang masuk akal',
    text: 'Bandingkan kondisi dasar dengan panen terlambat, harga jual menurun, atau biaya input meningkat.',
    icon: Layers3,
  },
  {
    number: '03',
    title: 'Baca titik rawan kas',
    text: 'Lihat bulan dengan saldo terendah, kebutuhan penyangga, dan dampak cicilan dalam laporan yang dapat ditinjau ulang.',
    icon: BarChart3,
  },
];

export default function LandingPage() {
  return (
    <div className="page-enter">
      <section className="shell grid gap-10 py-12 md:grid-cols-12 md:items-center md:py-20">
        <div className="md:col-span-7 lg:col-span-6">
          <p className="mb-5 text-sm font-bold tracking-[.12em] text-[var(--primary)] uppercase">Perencanaan arus kas pertanian</p>
          <h1 className="max-w-3xl text-[clamp(2.5rem,6vw,4.9rem)] font-bold leading-[.98] tracking-[-.055em] text-[var(--ink)]">
            Lihat risiko musim sebelum kas menjadi sempit.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            MusimAman membantu Anda menyusun asumsi, menguji skenario panen, dan memahami dampaknya pada usaha tani serta kebutuhan rumah tangga.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="button button-primary px-6" href="/plans/new">
              Buat rencana <ArrowRight aria-hidden="true" size={18} />
            </Link>
            <Link className="button button-secondary px-6" href="/demo">Lihat contoh simulasi</Link>
          </div>
          <ul className="mt-8 grid gap-3 text-sm text-[var(--muted)] sm:grid-cols-2" aria-label="Prinsip MusimAman">
            <li className="flex items-center gap-2"><Check aria-hidden="true" size={17} className="text-[var(--primary)]" />Asumsi dapat diedit</li>
            <li className="flex items-center gap-2"><Check aria-hidden="true" size={17} className="text-[var(--primary)]" />Perhitungan transparan</li>
            <li className="flex items-center gap-2"><Check aria-hidden="true" size={17} className="text-[var(--primary)]" />Bisa dimulai tanpa akun</li>
            <li className="flex items-center gap-2"><Check aria-hidden="true" size={17} className="text-[var(--primary)]" />Data lokal tetap terpisah</li>
          </ul>
        </div>

        <figure className="relative overflow-hidden rounded-[1.25rem] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-[var(--shadow)] md:col-span-5 lg:col-span-6">
          <Image
            src="/images/musimaman-hero.png"
            alt="Petani memeriksa tanaman di lahan pertanian"
            width={1200}
            height={900}
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="aspect-[4/3] w-full rounded-2xl object-cover"
          />
          <figcaption className="absolute inset-x-5 bottom-5 rounded-xl border border-white/60 bg-white/90 p-4 backdrop-blur-md">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-[var(--primary)]">Konteks usaha tani</span>
            <p className="mt-1 text-sm font-semibold text-[var(--ink)]">Setiap hasil berasal dari asumsi yang Anda masukkan, bukan angka pasar yang disamarkan sebagai fakta.</p>
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-16 md:py-20" aria-labelledby="alur-title">
        <div className="shell grid gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.12em] text-[var(--primary)]">Alur yang jelas</p>
            <h2 id="alur-title" className="mt-3 text-3xl leading-tight md:text-4xl">Dari asumsi ke keputusan yang bisa didiskusikan.</h2>
            <p className="mt-5 max-w-md text-[var(--muted)]">Tiga tahap, satu sumber data, dan tidak ada skor keamanan rekaan.</p>
          </div>
          <ol className="border-t border-[var(--border)]">
            {steps.map(({ number, title, text, icon: Icon }) => (
              <li key={number} className="grid gap-4 border-b border-[var(--border)] py-7 sm:grid-cols-[3rem_2.75rem_1fr] sm:items-start">
                <span className="text-sm font-bold text-[var(--primary)]">{number}</span>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[var(--primary-soft)] text-[var(--primary)]"><Icon aria-hidden="true" size={21} /></span>
                <div>
                  <h3 className="text-xl">{title}</h3>
                  <p className="mt-2 max-w-2xl text-[var(--muted)]">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="shell py-16 md:py-24" aria-labelledby="hasil-title">
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[.12em] text-[var(--primary)]">Hasil yang dapat ditelusuri</p>
          <h2 id="hasil-title" className="mt-3 text-3xl md:text-4xl">Bukan ramalan. Sebuah cara untuk melihat konsekuensi.</h2>
        </div>
        <div className="mt-10 grid border-y border-[var(--border)] md:grid-cols-3">
          {[
            [ShieldCheck, 'Titik rawan', 'Temukan kapan saldo diproyeksikan menipis dan berapa lama tekanannya berlangsung.'],
            [BarChart3, 'Perbandingan skenario', 'Lihat perubahan arus kas pada setiap asumsi tanpa bahasa yang menyerupai rekomendasi kredit.'],
            [FileText, 'Laporan ringkas', 'Bawa ringkasan asumsi dan hasil untuk dibahas bersama keluarga, kelompok tani, atau pendamping.'],
          ].map(([Icon, title, text], index) => {
            const FeatureIcon = Icon as typeof ShieldCheck;
            return (
              <article key={String(title)} className={`py-8 md:px-8 ${index > 0 ? 'border-t md:border-l md:border-t-0 border-[var(--border)]' : ''}`}>
                <FeatureIcon aria-hidden="true" size={24} className="text-[var(--primary)]" />
                <h3 className="mt-5 text-xl">{String(title)}</h3>
                <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{String(text)}</p>
              </article>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col justify-between gap-6 rounded-2xl bg-[var(--ink)] p-7 text-white sm:flex-row sm:items-center md:p-10">
          <div>
            <h2 className="text-2xl text-white">Mulai dari kondisi yang Anda kenal.</h2>
            <p className="mt-2 text-sm text-white/70">Rencana pertama tersimpan di perangkat dan dapat dipindahkan ke cloud setelah Anda masuk.</p>
          </div>
          <Link className="button shrink-0 bg-white text-[var(--ink)]" href="/plans/new">Mulai simulasi <ArrowRight aria-hidden="true" size={18} /></Link>
        </div>
      </section>
    </div>
  );
}
