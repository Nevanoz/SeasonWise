# MusimAman

MusimAman adalah web app simulasi arus kas musiman untuk membantu petani kecil Indonesia dan pendampingnya memahami apakah kebutuhan produksi, kebutuhan minimum rumah tangga, dan kewajiban pembiayaan tetap dapat dipenuhi ketika panen terlambat, pendapatan panen turun, atau biaya input naik.

> **Pernyataan Penting:**
> Alat bantu diskusi, bukan persetujuan kredit atau nasihat keuangan. Semua skenario adalah simulasi berdasarkan asumsi pengguna.

## Fitur Utama

- **Editable templates:** Template tanaman untuk padi (rice), jagung (corn), cabai (chili), kopi (coffee), dan kelapa sawit (palm oil).
- **Arus Kas & Rumah Tangga:** Simulasi produksi, kebutuhan keluarga, saldo awal, dana darurat, dan pendapatan non-tani.
- **Pembiayaan:** Perbandingan skenario cicilan bulanan flat vs pascapanen (bullet).
- **Mesin Finansial Deterministik:** Perhitungan saldo bulanan, gap cash flow, dan rasio kemampuan membayar secara presisi.
- **Skenario Stress:** Simulasi skenario Expected, Mild, Severe, Custom, dan Combined.
- **Integrasi Data Eksternal:** Referensi harga pasar komoditas dengan status sumber yang jelas.
- **AI Chat Explanation:** Asisten chat interaktif yang ditenagai Groq untuk menjelaskan hasil kalkulasi tanpa mengubah angka keuangan.

## Struktur Repositori

```text
musimaman/
├── apps/
│   ├── web/        # Next.js Frontend
├── packages/
│   ├── financial-engine/   # Pure TypeScript calculation engine
│   ├── shared-types/       # Shared TypeScript types/interfaces
│   ├── validation/         # Zod schemas for form validation
│   └── config/             # Config variables & templates
├── backend/       # Fastify API, Supabase migrations/seed, providers & tests
└── docs/           # Architecture diagrams, blueprints & documents
```

## Pengembangan Lokal

### Prasyarat
- Node.js LTS
- pnpm

### Langkah Setup
1. Instal dependensi:
   ```bash
   pnpm install
   ```
2. Salin template environment variables:
   ```bash
   cp .env.example .env
   ```
3. Jalankan aplikasi secara lokal:
   ```bash
   pnpm dev
   ```

### Scripts Utama
- `pnpm dev`: Menjalankan aplikasi frontend dan backend secara paralel.
- `pnpm build`: Melakukan build untuk semua workspace.
- `pnpm typecheck`: Melakukan typecheck kode TypeScript di seluruh project.
- `pnpm test`: Menjalankan pengujian (unit/integration tests) menggunakan Vitest.
- `pnpm test:e2e`: Menjalankan pengujian E2E menggunakan Playwright.
