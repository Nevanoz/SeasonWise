import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <main className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-4">
            <h1 className="text-3xl md:text-[2rem] font-bold text-text-primary leading-tight font-sans tracking-tight">
                Pahami Risiko Arus Kas Musiman Sebelum Menjadi Krisis
            </h1>
            <p className="text-base text-text-secondary max-w-xl leading-relaxed font-sans">
                MusimAman membantu petani kecil Indonesia mensimulasikan apakah kebutuhan produksi, biaya rumah tangga, dan cicilan tetap aman saat jadwal panen atau harga pasar berubah.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/demo" className="bg-[#658665] text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity min-h-[44px]">
                <span className="material-symbols-outlined">play_circle</span>
                Coba Demo 1-Klik
              </Link>
              <Link href="/plans/new" className="border-2 border-primary text-primary px-6 py-3 rounded-lg text-sm font-bold hover:bg-[#c8ecc5]/30 transition-all flex items-center justify-center min-h-[44px]">
                Buat Rencana Baru
              </Link>
            </div>
          </div>
          <div className="flex-1 w-full relative">
            <div className="bg-white rounded-lg border border-border p-4 aspect-[4/3] flex flex-col gap-4 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-text-secondary font-sans">Proyeksi Arus Kas (6 Bulan)</span>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#446345]"></div>
                  <div className="w-3 h-3 rounded-full bg-[#ba1a1a]"></div>
                </div>
              </div>
              {/* Mock Chart Visualization */}
              <div className="flex-1 flex items-end gap-2 pb-2">
                <div className="w-full bg-[#446345] rounded-t-sm h-[60%] transition-all hover:opacity-80"></div>
                <div className="w-full bg-[#446345] rounded-t-sm h-[40%] transition-all hover:opacity-80"></div>
                <div className="w-full bg-[#ba1a1a] diagonal-hatch border border-error-container rounded-t-sm h-[20%] transition-all"></div>
                <div className="w-full bg-[#446345] rounded-t-sm h-[75%] transition-all hover:opacity-80"></div>
                <div className="w-full bg-[#446345] rounded-t-sm h-[90%] transition-all hover:opacity-80"></div>
                <div className="w-full bg-[#446345] rounded-t-sm h-[55%] transition-all hover:opacity-80"></div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent opacity-20 pointer-events-none"></div>
              {/* Floating Stat Card */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#e3e3de] border border-[#c2c8be] p-4 rounded-lg shadow-sm">
                <p className="text-[10px] uppercase text-on-surface-variant font-medium font-sans">Titik Kritis</p>
                <p className="text-xl text-[#ba1a1a] font-bold font-sans">-Rp 2.450.000</p>
                <p className="text-[11px] text-text-secondary font-sans">Bulan ke-3 (Masa Tanam)</p>
              </div>
            </div>
            <div className="absolute -z-10 -right-8 -bottom-8 w-64 h-64 bg-[#acd0aa] rounded-full blur-3xl opacity-30"></div>
          </div>
        </div>
      </main>

      {/* Verified Sources Banner */}
      <section className="bg-white border-y border-border overflow-hidden py-4">
        <div className="max-w-[1200px] mx-auto px-6 flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
          <p className="text-sm text-on-surface-variant italic font-sans">Berdasarkan Standar Data Nasional:</p>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">cloud_done</span>
            <span className="text-sm font-bold uppercase tracking-tight font-sans">Konteks Cuaca: BMKG</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">agriculture</span>
            <span className="text-sm font-bold uppercase tracking-tight font-sans">Referensi Pangan: Bapanas</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span>
            <span className="text-sm font-bold uppercase tracking-tight font-sans">OJK Financial Literacy</span>
          </div>
        </div>
      </section>

      {/* Product Scope Grid */}
      <section className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-semibold text-text-primary mb-2 font-sans">Simulasi Presisi untuk Petani Mandiri</h2>
          <p className="text-base text-text-secondary font-sans">Arsitektur keputusan yang dirancang khusus untuk dinamika pertanian lokal.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1 */}
          <div className="bg-white border border-border p-6 rounded-lg group hover:border-primary transition-all duration-300">
            <div className="w-12 h-12 bg-[#c8ecc5] rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-on-primary">potted_plant</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary font-sans">5 Editable Crop Templates</h3>
            <p className="text-base text-text-secondary font-sans">Mulai cepat dengan template Padi, Jagung, Cabai, Bawang, dan Sawit yang dapat disesuaikan sepenuhnya dengan kondisi lahan Anda.</p>
          </div>
          {/* Card 2 */}
          <div className="bg-white border border-border p-6 rounded-lg group hover:border-primary transition-all duration-300">
            <div className="w-12 h-12 bg-[#c8ecc5] rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-on-primary">calculate</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary font-sans">Deterministic Calculations</h3>
            <p className="text-base text-text-secondary font-sans">Algoritma perhitungan kas transparan. Pantau pengeluaran saprotan, upah buruh, dan biaya rumah tangga secara real-time.</p>
          </div>
          {/* Card 3 */}
          <div className="bg-white border border-border p-6 rounded-lg group hover:border-primary transition-all duration-300">
            <div className="w-12 h-12 bg-[#c8ecc5] rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary transition-colors">
              <span className="material-symbols-outlined text-primary group-hover:text-on-primary">warning</span>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-text-primary font-sans">Stress Skenario</h3>
            <p className="text-base text-text-secondary font-sans">Uji ketahanan finansial Anda terhadap lonjakan harga pupuk atau penurunan harga jual panen hingga 40%.</p>
          </div>
        </div>
      </section>

      {/* Visual Divider / Editorial Graphic */}
      <section className="px-6 py-4">
        <div className="max-w-[1200px] mx-auto h-[400px] rounded-xl overflow-hidden relative border border-border">
          <div className="w-full h-full bg-cover bg-center" style={{backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB9BEz6Y9G2t82vE1QETKcd4G_irlm3Twfig7rUdwVm54vrhzUgvBHRc-OGbXwYEbCyGXJmOzSFjfYvI2zMD74cmwIRCEXhfKnBEt6TbjI9Lc3HmGvpfXYTiDSx5SEgCVzsdEmsusArfn3iZY_w-zP21nhzgZNTRgsbxwSeg5yHnrLK5AV8MbrPGQE9s-yvQ-3qhY8tBiB8DAFIB7inlRdFOj_ND4r6mKfkNWNmV1brkG2z107UHjYR')"}}></div>
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-12">
            <div className="max-w-2xl">
              <p className="text-2xl font-bold text-white mb-4 leading-relaxed font-sans">"Mengelola pertanian bukan hanya soal menanam, tapi memastikan dapur tetap ngebul hingga musim depan."</p>
              <p className="text-xs text-white/80 uppercase tracking-widest font-sans">— Prinsip MusimAman</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
