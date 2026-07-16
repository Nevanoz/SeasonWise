import { CropType, Rupiah } from '@musimaman/shared-types';

export interface CropTemplatePhase {
  name: string;
  startMonthOffset: number; // Offset from planting month
  durationMonths: number;
}

export interface CropTemplateExpense {
  category: string;
  monthOffset: number;
  amountPerHa: Rupiah;
  description: string;
}

export interface CropTemplate {
  name: string;
  cropType: CropType;
  cycleDurationMonths: number;
  expectedYieldPerHa: number; // e.g. in Ton or Kg
  quantityUnit: string;
  expectedSellingPriceRupiah: Rupiah; // per unit
  phases: CropTemplatePhase[];
  typicalExpenses: CropTemplateExpense[];
}

export const CROP_TEMPLATES: Record<CropType, CropTemplate> = {
  rice: {
    name: 'Padi Sawah (Rice)',
    cropType: 'rice',
    cycleDurationMonths: 4,
    expectedYieldPerHa: 5.5, // 5.5 Ton
    quantityUnit: 'Ton',
    expectedSellingPriceRupiah: 7000000, // Rp 7.000.000 / Ton (Gabah Kering Panen)
    phases: [
      { name: 'Persiapan Lahan & Pembibitan', startMonthOffset: 0, durationMonths: 1 },
      { name: 'Penanaman & Pemupukan I', startMonthOffset: 1, durationMonths: 1 },
      { name: 'Pemeliharaan & Pemupukan II', startMonthOffset: 2, durationMonths: 1 },
      { name: 'Pematangan & Panen', startMonthOffset: 3, durationMonths: 1 },
    ],
    typicalExpenses: [
      { category: 'Sewa Lahan & Traktor', monthOffset: 0, amountPerHa: 2000000, description: 'Sewa alat berat dan bajak sawah' },
      { category: 'Bibit & Pupuk Dasar', monthOffset: 0, amountPerHa: 1500000, description: 'Benih padi unggul dan pupuk organik' },
      { category: 'Pupuk Susulan & Pestisida', monthOffset: 1, amountPerHa: 1200000, description: 'Urea, NPK, dan obat hama' },
      { category: 'Tenaga Kerja Penyiangan', monthOffset: 2, amountPerHa: 800000, description: 'Upah buruh tani untuk penyiangan rumput' },
      { category: 'Upah Buruh Panen', monthOffset: 3, amountPerHa: 2500000, description: 'Biaya potong padi dan angkut' },
    ],
  },
  corn: {
    name: 'Jagung Hibrida (Corn)',
    cropType: 'corn',
    cycleDurationMonths: 4,
    expectedYieldPerHa: 6.0, // 6 Ton pipilan kering
    quantityUnit: 'Ton',
    expectedSellingPriceRupiah: 5000000, // Rp 5.000.000 / Ton
    phases: [
      { name: 'Olah Tanah & Tanam', startMonthOffset: 0, durationMonths: 1 },
      { name: 'Pemeliharaan & Pemupukan', startMonthOffset: 1, durationMonths: 2 },
      { name: 'Panen & Pengeringan', startMonthOffset: 3, durationMonths: 1 },
    ],
    typicalExpenses: [
      { category: 'Olah Lahan & Benih', monthOffset: 0, amountPerHa: 2500000, description: 'Benih jagung hibrida dan bajak' },
      { category: 'Pupuk (Urea & Phonska)', monthOffset: 1, amountPerHa: 1800000, description: 'Pemupukan fase vegetatif' },
      { category: 'Pestisida & Hama Ulat', monthOffset: 2, amountPerHa: 800000, description: 'Penanganan ulat grayak' },
      { category: 'Panen & Pemipilan', monthOffset: 3, amountPerHa: 1500000, description: 'Biaya panen dan sewa mesin pipil' },
    ],
  },
  chili: {
    name: 'Cabai Merah Keriting (Chili)',
    cropType: 'chili',
    cycleDurationMonths: 6,
    expectedYieldPerHa: 1000, // 1000 Kg (1 Ton)
    quantityUnit: 'Kg',
    expectedSellingPriceRupiah: 35000, // Rp 35.000 / Kg
    phases: [
      { name: 'Persemaian & Pemulsaan', startMonthOffset: 0, durationMonths: 1 },
      { name: 'Tanam & Vegetatif', startMonthOffset: 1, durationMonths: 1 },
      { name: 'Fase Generatif & Pemupukan Cor', startMonthOffset: 2, durationMonths: 2 },
      { name: 'Panen Berkala (Mulai Bulan 5)', startMonthOffset: 4, durationMonths: 2 },
    ],
    typicalExpenses: [
      { category: 'Mulsa & Bambu Lanjaran', monthOffset: 0, amountPerHa: 4000000, description: 'Pemasangan mulsa plastik dan tiang bambu' },
      { category: 'Bibit Cabai & Pupuk Dasar', monthOffset: 0, amountPerHa: 3000000, description: 'Pembelian bibit unggul keriting' },
      { category: 'Pupuk Cor & Kalsium', monthOffset: 1, amountPerHa: 1500000, description: 'Pemupukan cair berkala' },
      { category: 'Obat Hama & Fungisida', monthOffset: 2, amountPerHa: 2000000, description: 'Pencegahan patek (antraknosa) dan kutu daun' },
      { category: 'Tenaga Kerja Petik', monthOffset: 4, amountPerHa: 1000000, description: 'Upah buruh panen bertahap' },
      { category: 'Tenaga Kerja Petik II', monthOffset: 5, amountPerHa: 1000000, description: 'Upah buruh panen tahap akhir' },
    ],
  },
  coffee: {
    name: 'Kopi Robusta (Coffee)',
    cropType: 'coffee',
    cycleDurationMonths: 12, // Pemeliharaan siklus tahunan
    expectedYieldPerHa: 1.2, // 1.2 Ton biji kopi kering (green bean) per tahun
    quantityUnit: 'Ton',
    expectedSellingPriceRupiah: 45000000, // Rp 45.000.000 / Ton
    phases: [
      { name: 'Pemangkasan & Pemupukan Awal', startMonthOffset: 0, durationMonths: 3 },
      { name: 'Fase Pembungaan', startMonthOffset: 3, durationMonths: 3 },
      { name: 'Pembesaran Buah (Beri)', startMonthOffset: 6, durationMonths: 3 },
      { name: 'Panen Raya (Bulan 10-12)', startMonthOffset: 9, durationMonths: 3 },
    ],
    typicalExpenses: [
      { category: 'Pupuk & Pestisida', monthOffset: 1, amountPerHa: 3000000, description: 'Pupuk organik dan NPK berkadar nitrogen tinggi' },
      { category: 'Pembersihan Gulma & Piringan', monthOffset: 4, amountPerHa: 1200000, description: 'Upah penyiangan bawah pohon' },
      { category: 'Pemangkasan Wiwilan', monthOffset: 7, amountPerHa: 1000000, description: 'Pemangkasan tunas air yang tidak produktif' },
      { category: 'Tenaga Kerja Panen Merah', monthOffset: 10, amountPerHa: 3500000, description: 'Buruh petik buah kopi merah' },
    ],
  },
  palm_oil: {
    name: 'Kelapa Sawit TM (Palm Oil)',
    cropType: 'palm_oil',
    cycleDurationMonths: 12, // Siklus panen bulanan berkelanjutan
    expectedYieldPerHa: 20, // 20 Ton TBS per tahun
    quantityUnit: 'Ton',
    expectedSellingPriceRupiah: 2500000, // Rp 2.500.000 / Ton TBS
    phases: [
      { name: 'Pemeliharaan & Pemupukan Semester I', startMonthOffset: 0, durationMonths: 6 },
      { name: 'Pemeliharaan & Pemupukan Semester II', startMonthOffset: 6, durationMonths: 6 },
    ],
    typicalExpenses: [
      { category: 'Pupuk NPK & KCL (Fase 1)', monthOffset: 2, amountPerHa: 4500000, description: 'Pupuk utama kelapa sawit' },
      { category: 'Penyemprotan Piringan & Pasar Pikul', monthOffset: 4, amountPerHa: 1000000, description: 'Herbisida piringan sawit' },
      { category: 'Pupuk NPK & KCL (Fase 2)', monthOffset: 8, amountPerHa: 4500000, description: 'Pemupukan kedua akhir tahun' },
      { category: 'Tenaga Panen & Kastrasi berkala', monthOffset: 10, amountPerHa: 2000000, description: 'Egrang/dodos buah TBS sawit' },
    ],
  },
};

export const RISK_CONFIG = {
  configVersion: 'prototype-1' as const,
  thresholds: {
    repaymentToIncomeMildBps: 2000, // 20%
    repaymentToIncomeSevereBps: 3500, // 35%
    repaymentToIncomeCriticalBps: 5000, // 50%
    interestCostRatioThreshold: 0.30, // 30% of principal
  },
};
