import { z } from 'zod';

export const cashFlowItemSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  type: z.enum(['income', 'production_expense']),
  category: z.string().min(1, 'Kategori harus diisi'),
  amountRupiah: z.number().int().nonnegative('Jumlah harus berupa bilangan bulat positif'),
  timingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
  description: z.string().max(300, 'Deskripsi maksimal 300 karakter').optional(),
  isHarvestIncome: z.boolean().optional(),
});

export const cropPlanSchema = z.object({
  cropType: z.enum(['rice', 'corn', 'chili', 'coffee', 'palm_oil']),
  plantingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
  expectedHarvestQuantity: z.number().nonnegative('Jumlah panen harus positif'),
  quantityUnit: z.string().min(1, 'Satuan kuantitas harus diisi'),
  expectedSellingPriceRupiah: z.number().int().nonnegative('Harga jual harus berupa bilangan bulat positif'),
  expectedTotalHarvestIncomeRupiah: z.number().int().nonnegative('Total pendapatan panen harus berupa bilangan bulat positif'),
});

export const financingOptionSchema = z.object({
  id: z.string().uuid().or(z.string().min(1)),
  name: z.string().min(1, 'Nama pinjaman harus diisi').max(100),
  principalRupiah: z.number().int().nonnegative('Pokok pinjaman harus berupa bilangan bulat positif'),
  interestRateBps: z.number().int().min(0).max(100000, 'Suku bunga maksimal 1000%'),
  interestPeriod: z.enum(['MONTHLY', 'ANNUAL']),
  administrationFeeRupiah: z.number().int().nonnegative('Biaya admin harus berupa bilangan bulat positif').default(0),
  otherUpfrontFeesRupiah: z.number().int().nonnegative('Biaya upfront lainnya harus berupa bilangan bulat positif').default(0),
  financingStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
  gracePeriodMonths: z.number().int().nonnegative().default(0),
  numberOfInstallments: z.number().int().positive('Jumlah cicilan harus minimal 1'),
  repaymentFrequency: z.enum(['MONTHLY', 'ONCE']),
  repaymentStructure: z.enum(['FLAT_MONTHLY', 'BULLET']),
  firstRepaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
});

export const planFormSchema = z.object({
  schemaVersion: z.literal(1).default(1),
  title: z.string().min(1, 'Judul rencana harus diisi').max(100),
  provinceCode: z.string().min(1, 'Provinsi harus dipilih'),
  regencyCode: z.string().min(1, 'Kabupaten harus dipilih'),
  districtCode: z.string().optional(),
  cropPlan: cropPlanSchema,
  cashFlowItems: z.array(cashFlowItemSchema),
  monthlyHouseholdExpenseRupiah: z.number().int().nonnegative('Pengeluaran rumah tangga bulanan harus berupa bilangan bulat positif'),
  openingBalanceRupiah: z.number().int().nonnegative('Saldo awal harus berupa bilangan bulat positif'),
  emergencyReserveRupiah: z.number().int().nonnegative('Dana darurat harus berupa bilangan bulat positif'),
  financingOptions: z.array(financingOptionSchema).max(2, 'Maksimal 2 skema pembiayaan untuk komparasi'),
  notes: z.string().max(2000).optional(),
});
