export interface ProductionPhaseTemplate {
  name: string;
  startDay: number;
  endDay: number;
  costPercent: number; // Percentage of total expected input cost
  description?: string;
}

export interface CropTemplateExpense {
  category: string;
  monthOffset: number;
  amountPerHa: number;
  description: string;
}

export interface CropTemplate {
  cropType: "rice" | "corn" | "chili" | "coffee" | "palm_oil";
  name: string;
  defaultCycleDays: number;
  quantityUnit: string;
  defaultSellingPriceRupiah: number;
  defaultYieldQuantity: number; // e.g. per hectare
  phases: ProductionPhaseTemplate[];
  // Backwards compatibility fields for frontend
  expectedYieldPerHa: number;
  expectedSellingPriceRupiah: number;
  cycleDurationMonths: number;
  typicalExpenses: CropTemplateExpense[];
}

export const CROP_TEMPLATES: Record<string, CropTemplate> = {
  rice: {
    cropType: "rice",
    name: "Padi (Rice)",
    defaultCycleDays: 120,
    quantityUnit: "kg",
    defaultSellingPriceRupiah: 6500,
    defaultYieldQuantity: 5000,
    expectedYieldPerHa: 5000,
    expectedSellingPriceRupiah: 6500,
    cycleDurationMonths: 4,
    phases: [
      { name: "Persiapan Lahan (Land Prep)", startDay: 1, endDay: 15, costPercent: 20, description: "Pengolahan tanah and pembajakan sawah" },
      { name: "Penanaman & Pemupukan Awal", startDay: 16, endDay: 30, costPercent: 30, description: "Penyemaian bibit and pemupukan dasar" },
      { name: "Perawatan & Pengairan", startDay: 31, endDay: 90, costPercent: 25, description: "Penyiangan rumput, pengairan, penanggulangan hama" },
      { name: "Panen & Pengeringan", startDay: 91, endDay: 120, costPercent: 25, description: "Pemotongan padi and rontok bulir" },
    ],
    typicalExpenses: [
      { category: "Sewa Lahan & Traktor", monthOffset: 0, amountPerHa: 2000000, description: "Sewa alat berat dan bajak sawah" },
      { category: "Bibit & Pupuk Dasar", monthOffset: 0, amountPerHa: 1500000, description: "Benih padi unggul dan pupuk organik" },
      { category: "Pupuk Susulan & Pestisida", monthOffset: 1, amountPerHa: 1200000, description: "Urea, NPK, dan obat hama" },
      { category: "Tenaga Kerja Penyiangan", monthOffset: 2, amountPerHa: 800000, description: "Upah buruh tani untuk penyiangan rumput" },
      { category: "Upah Buruh Panen", monthOffset: 3, amountPerHa: 2500000, description: "Biaya potong padi dan angkut" },
    ],
  },
  corn: {
    cropType: "corn",
    name: "Jagung (Corn)",
    defaultCycleDays: 110,
    quantityUnit: "kg",
    defaultSellingPriceRupiah: 4500,
    defaultYieldQuantity: 6000,
    expectedYieldPerHa: 6000,
    expectedSellingPriceRupiah: 4500,
    cycleDurationMonths: 4,
    phases: [
      { name: "Persiapan Lahan", startDay: 1, endDay: 10, costPercent: 15 },
      { name: "Penanaman & Pembubunan", startDay: 11, endDay: 25, costPercent: 35 },
      { name: "Pemeliharaan & Pemupukan", startDay: 26, endDay: 85, costPercent: 30 },
      { name: "Panen", startDay: 86, endDay: 110, costPercent: 20 },
    ],
    typicalExpenses: [
      { category: "Olah Lahan & Benih", monthOffset: 0, amountPerHa: 2500000, description: "Benih jagung hibrida dan bajak" },
      { category: "Pupuk (Urea & Phonska)", monthOffset: 1, amountPerHa: 1800000, description: "Pemupukan fase vegetatif" },
      { category: "Pestisida & Hama Ulat", monthOffset: 2, amountPerHa: 800000, description: "Penanganan ulat grayak" },
      { category: "Panen & Pemipilan", monthOffset: 3, amountPerHa: 1500000, description: "Biaya panen dan sewa mesin pipil" },
    ],
  },
  chili: {
    cropType: "chili",
    name: "Cabai (Chili)",
    defaultCycleDays: 150,
    quantityUnit: "kg",
    defaultSellingPriceRupiah: 25000,
    defaultYieldQuantity: 3000,
    expectedYieldPerHa: 3000,
    expectedSellingPriceRupiah: 25000,
    cycleDurationMonths: 5,
    phases: [
      { name: "Penyemaian & Bedengan", startDay: 1, endDay: 30, costPercent: 25 },
      { name: "Penanaman & Pemasangan Lanjaran", startDay: 31, endDay: 60, costPercent: 30 },
      { name: "Pemupukan Susulan & Pengendalian OPT", startDay: 61, endDay: 120, costPercent: 30 },
      { name: "Pemetikan Panen", startDay: 121, endDay: 150, costPercent: 15 },
    ],
    typicalExpenses: [
      { category: "Mulsa & Bambu Lanjaran", monthOffset: 0, amountPerHa: 4000000, description: "Pemasangan mulsa plastik dan tiang bambu" },
      { category: "Bibit Cabai & Pupuk Dasar", monthOffset: 0, amountPerHa: 3000000, description: "Pembelian bibit unggul keriting" },
      { category: "Pupuk Cor & Kalsium", monthOffset: 1, amountPerHa: 1500000, description: "Pemupukan cair berkala" },
      { category: "Obat Hama & Fungisida", monthOffset: 2, amountPerHa: 2000000, description: "Pencegahan patek (antraknosa) dan kutu daun" },
      { category: "Tenaga Kerja Petik", monthOffset: 4, amountPerHa: 1000000, description: "Upah buruh panen bertahap" },
      { category: "Tenaga Kerja Petik II", monthOffset: 5, amountPerHa: 1000000, description: "Upah buruh panen tahap akhir" },
    ],
  },
  coffee: {
    cropType: "coffee",
    name: "Kopi (Coffee) - Siklus Panen Tahunan",
    defaultCycleDays: 365,
    quantityUnit: "kg",
    defaultSellingPriceRupiah: 40000,
    defaultYieldQuantity: 1500,
    expectedYieldPerHa: 1500,
    expectedSellingPriceRupiah: 40000,
    cycleDurationMonths: 12,
    phases: [
      { name: "Pemangkasan & Pemupukan Pasca-Panen", startDay: 1, endDay: 60, costPercent: 20 },
      { name: "Perawatan Pohon & Penyiangan", startDay: 61, endDay: 240, costPercent: 40 },
      { name: "Pemasakan Buah (Fruit Development)", startDay: 241, endDay: 300, costPercent: 20 },
      { name: "Pemetikan Gelondong Merah (Harvest)", startDay: 301, endDay: 365, costPercent: 20 },
    ],
    typicalExpenses: [
      { category: "Pupuk & Pestisida", monthOffset: 1, amountPerHa: 3000000, description: "Pupuk organik dan NPK berkadar nitrogen tinggi" },
      { category: "Pembersihan Gulma & Piringan", monthOffset: 4, amountPerHa: 1200000, description: "Upah penyiangan bawah pohon" },
      { category: "Pemangkasan Wiwilan", monthOffset: 7, amountPerHa: 1000000, description: "Pemangkasan tunas air yang tidak produktif" },
      { category: "Tenaga Kerja Panen Merah", monthOffset: 10, amountPerHa: 3500000, description: "Buruh petik buah kopi merah" },
    ],
  },
  palm_oil: {
    cropType: "palm_oil",
    name: "Kelapa Sawit (Palm Oil) - Estimasi Bulanan TBS",
    defaultCycleDays: 30,
    quantityUnit: "ton",
    defaultSellingPriceRupiah: 2500000,
    defaultYieldQuantity: 2,
    expectedYieldPerHa: 2,
    expectedSellingPriceRupiah: 2500000,
    cycleDurationMonths: 1,
    phases: [
      { name: "Pembersihan Piringan & Pasar Pikul", startDay: 1, endDay: 10, costPercent: 30 },
      { name: "Kastrasi & Pemupukan TBS", startDay: 11, endDay: 20, costPercent: 40 },
      { name: "Pemanenan & Pengangkutan PKS", startDay: 21, endDay: 30, costPercent: 30 },
    ],
    typicalExpenses: [
      { category: "Pupuk NPK & KCL (Fase 1)", monthOffset: 2, amountPerHa: 4500000, description: "Pupuk utama kelapa sawit" },
      { category: "Penyemprotan Piringan & Pasar Pikul", monthOffset: 4, amountPerHa: 1000000, description: "Herbisida piringan sawit" },
      { category: "Pupuk NPK & KCL (Fase 2)", monthOffset: 8, amountPerHa: 4500000, description: "Pemupukan kedua akhir tahun" },
      { category: "Tenaga Panen & Kastrasi berkala", monthOffset: 10, amountPerHa: 2000000, description: "Egrang/dodos buah TBS sawit" },
    ],
  },
};

export const RISK_CONFIG = {
  version: "prototype-1",
  deductions: {
    expectedMaxCashGap: 35, // Expected scenario maximum cash gap > 0
    anyStressCashGap: 20,   // Any enabled stress creates/increases cash gap
    financingCostRatio: 5,  // Financing cost > 30% of principal
    sensitivityGapMax: 10,  // Capped deduction for multiple sensitivities (5 per gap, max 10)
  },
  tiers: {
    // DTI (Repayment-to-income) tiers
    repaymentToIncome: [
      { minBps: 2000, maxBps: 3500, deduction: 5 },
      { minBps: 3501, maxBps: 5000, deduction: 10 },
      { minBps: 5001, maxBps: 100000, deduction: 15 },
    ],
    // Opening + Emergency Reserve coverage tiers (in household months)
    reserveCoverage: [
      { minMonths: 0, maxMonths: 0.99, deduction: 10 },
      { minMonths: 1.0, maxMonths: 1.99, deduction: 5 },
    ],
    // Expected Ending Balance coverage tiers (in household months)
    endingBalanceCoverage: [
      { minMonths: -9999, maxMonths: 0, deduction: 10 },
      { minMonths: 0.01, maxMonths: 0.99, deduction: 5 },
    ],
  },
  thresholds: {
    resilientMin: 75,
    needsAdjustmentMin: 50,
  },
};

export const ENGINE_VERSION = "1.0.0";
export * from "./risk/prototype-1";
export const RISK_CONFIG_VERSION = "prototype-1";
export const DEMO_DATA_VERSION = 1;
export const DEFAULT_LOCALE = "id-ID";
