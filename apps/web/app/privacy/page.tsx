import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-border p-8 md:p-10 rounded-xl space-y-6">
      <div className="flex items-center gap-3 border-b border-border pb-4">
        <ShieldCheck className="w-8 h-8 text-primary" />
        <h1 className="text-xl font-bold text-text-primary">Kebijakan Privasi MusimAman</h1>
      </div>

      <div className="space-y-4 text-sm text-text-primary leading-relaxed">
        <p>
          Selamat datang di MusimAman. Kami sangat menghargai kepercayaan Anda dan berkomitmen untuk melindungi privasi data finansial serta operasional pertanian Anda.
        </p>

        <h2 className="font-bold text-base mt-4 text-primary">1. Penyimpanan Data Lokal (Guest Mode)</h2>
        <p>
          Secara default, semua data simulasi tanaman, perkiraan panen, dan transaksi kas yang Anda masukkan dalam mode tamu (Guest) disimpan seutuhnya di browser perangkat Anda sendiri menggunakan teknologi <strong>Web LocalStorage</strong>. Data ini tidak dikirim ke server eksternal kami kecuali jika Anda memilih opsi Cloud secara sadar.
        </p>

        <h2 className="font-bold text-base mt-4 text-primary">2. Integrasi Cloud dan Izin Persetujuan</h2>
        <p>
          Ketika Anda mendaftarkan akun dan memilih opsi "Migrasikan ke Cloud", data Anda akan diunggah ke database terenkripsi kami di bawah naungan Supabase PostgreSQL. Kami hanya memindahkan data setelah memperoleh persetujuan eksplisit (consent) dari Anda.
        </p>

        <h2 className="font-bold text-base mt-4 text-primary">3. Penggunaan Model Kecerdasan Buatan (AI)</h2>
        <p>
          Fitur Asisten Keuangan kami berinteraksi dengan API pihak ketiga (Groq API). Untuk memberikan saran kontekstual, rangkuman angka perhitungan kasar Anda akan dikirim ke API secara aman. Percakapan chat ini hanya disimpan dalam sesi browser Anda (sessionStorage) dan akan terhapus otomatis saat tab ditutup. Kami tidak menyimpan riwayat teks percakapan Anda di server kami.
        </p>

        <h2 className="font-bold text-base mt-4 text-primary">4. Hak Anda</h2>
        <p>
          Anda memiliki hak penuh untuk menghapus data simulasi lokal Anda melalui fitur penghapusan di halaman daftar rencana, atau menghapus permanen akun beserta data cloud Anda kapan pun tanpa persetujuan pihak lain.
        </p>
      </div>
    </div>
  );
}
