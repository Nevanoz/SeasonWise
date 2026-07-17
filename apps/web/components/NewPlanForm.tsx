'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { planFormSchema } from '@musimaman/validation';
import { CROP_TEMPLATES } from '@musimaman/config';
import { CropType } from '@musimaman/shared-types';
import { Leaf, Plus, Trash2, Coins, ArrowRight, ArrowLeft, Check, HelpCircle } from 'lucide-react';
import { saveGuestPlan } from '../lib/guest-plans';

type PlanFormValues = z.infer<typeof planFormSchema>;

const INDONESIA_REGIONS = {
  provinces: [
    { code: '32', name: 'Jawa Barat' },
    { code: '33', name: 'Jawa Tengah' },
    { code: '34', name: 'DI Yogyakarta' },
    { code: '35', name: 'Jawa Timur' },
    { code: '12', name: 'Sumatera Utara' },
  ],
  regencies: {
    '32': [
      { code: '3205', name: 'Kabupaten Garut' },
      { code: '3204', name: 'Kabupaten Bandung' },
      { code: '3209', name: 'Kabupaten Cirebon' },
    ],
    '33': [
      { code: '3323', name: 'Kabupaten Temanggung' },
      { code: '3318', name: 'Kabupaten Pati' },
    ],
    '34': [
      { code: '3402', name: 'Kabupaten Bantul' },
      { code: '3404', name: 'Kabupaten Sleman' },
    ],
    '35': [
      { code: '3507', name: 'Kabupaten Malang' },
      { code: '3509', name: 'Kabupaten Jember' },
    ],
    '12': [
      { code: '1207', name: 'Kabupaten Deli Serdang' },
      { code: '1212', name: 'Kabupaten Toba' },
    ],
  } as Record<string, { code: string; name: string }[]>,
};

export function NewPlanForm({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedCrop, setSelectedCrop] = useState<CropType | null>(initialData?.cropPlan?.cropType || null);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: initialData || {
      schemaVersion: 1,
      title: '',
      provinceCode: '',
      regencyCode: '',
      cropPlan: {
        cropType: 'rice' as CropType,
        plantingDate: new Date().toISOString().split('T')[0],
        estimatedHarvestDate: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
        cycleDurationDays: 120,
        expectedHarvestQuantity: 0,
        quantityUnit: 'Ton',
        expectedSellingPriceRupiah: 0,
        expectedTotalHarvestIncomeRupiah: 0,
      },
      cashFlowItems: [] as any[],
      monthlyHouseholdExpenseRupiah: 0,
      openingBalanceRupiah: 0,
      emergencyReserveRupiah: 0,
      financingOptions: [
        {
          id: crypto.randomUUID(),
          name: 'Skema Pembiayaan Utama',
          principalRupiah: 0,
          interestRateBps: 0,
          interestPeriod: 'ANNUAL' as const,
          administrationFeeRupiah: 0,
          otherUpfrontFeesRupiah: 0,
          financingStartDate: new Date().toISOString().split('T')[0],
          gracePeriodMonths: 0,
          numberOfInstallments: 1,
          repaymentFrequency: 'MONTHLY' as const,
          repaymentStructure: 'FLAT_MONTHLY' as const,
          firstRepaymentDate: new Date().toISOString().split('T')[0],
        }
      ],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'cashFlowItems',
  });

  const watchProvince = watch('provinceCode');
  const watchCropPlan = watch('cropPlan');
  const watchFinancingOptions = watch('financingOptions');
  const regencies = watchProvince ? INDONESIA_REGIONS.regencies[watchProvince] || [] : [];

  // Update total harvest income automatically
  const qty = parseFloat(watchCropPlan?.expectedHarvestQuantity?.toString() || '0');
  const price = parseInt(watchCropPlan?.expectedSellingPriceRupiah?.toString() || '0', 10);
  const computedIncome = Math.round(qty * price);

  React.useEffect(() => {
    if (!isNaN(computedIncome)) {
      setValue('cropPlan.expectedTotalHarvestIncomeRupiah', computedIncome);
    }
  }, [qty, price, computedIncome, setValue]);

  // Load Crop Template defaults
  const handleApplyTemplate = (type: CropType) => {
    setSelectedCrop(type);
    const template = CROP_TEMPLATES[type];
    if (!template) return;

    setValue('cropPlan.cropType', type);
    setValue('cropPlan.expectedHarvestQuantity', template.expectedYieldPerHa);
    setValue('cropPlan.quantityUnit', template.quantityUnit);
    setValue('cropPlan.expectedSellingPriceRupiah', template.expectedSellingPriceRupiah);
    setValue('cropPlan.expectedTotalHarvestIncomeRupiah', template.expectedYieldPerHa * template.expectedSellingPriceRupiah);
    setValue('cropPlan.cycleDurationDays', template.cycleDurationMonths * 30);


    // Populate typical expenses based on plantingDate
    const pDate = watchCropPlan?.plantingDate || new Date().toISOString().split('T')[0];
    const plantingBaseDate = new Date(pDate);

    // Clear old items and add new ones
    setValue('cashFlowItems', []);

    template.typicalExpenses.forEach((exp) => {
      const expDate = new Date(plantingBaseDate);
      expDate.setMonth(expDate.getMonth() + exp.monthOffset);
      
      append({
        id: crypto.randomUUID(),
        type: 'production_expense',
        category: exp.category,
        amountRupiah: exp.amountPerHa,
        timingDate: expDate.toISOString().split('T')[0],
        description: exp.description,
      });
    });

    // Add expected harvest income item to cashFlowItems too!
    const harvestDate = new Date(plantingBaseDate);
    harvestDate.setMonth(harvestDate.getMonth() + template.cycleDurationMonths);
    setValue('cropPlan.plantingDate', pDate);
    
    setValue('cropPlan.estimatedHarvestDate', harvestDate.toISOString().split('T')[0]);

    append({
      id: crypto.randomUUID(),
      type: 'income',
      category: `Hasil Panen ${template.name.split(' ')[0]}`,
      amountRupiah: template.expectedYieldPerHa * template.expectedSellingPriceRupiah,
      timingDate: harvestDate.toISOString().split('T')[0],
      description: `Penjualan ${template.expectedYieldPerHa} ${template.quantityUnit} ${template.name}`,
      isHarvestIncome: true,
    });
  };

  const [compareEnabled, setCompareEnabled] = useState(false);

  const handleToggleCompare = () => {
    if (!compareEnabled) {
      // Add secondary loan structure with defaults
      setValue('financingOptions', [
        watchFinancingOptions[0],
        {
          id: 'loan-secondary',
          name: 'Skema Pembiayaan Pembanding',
          principalRupiah: watchFinancingOptions[0]?.principalRupiah || 0,
          interestRateBps: 0,
          interestPeriod: 'ANNUAL' as const,
          administrationFeeRupiah: 0,
          otherUpfrontFeesRupiah: 0,
          financingStartDate: watchFinancingOptions[0]?.financingStartDate || new Date().toISOString().split('T')[0],
          gracePeriodMonths: 0,
          numberOfInstallments: 1,
          repaymentFrequency: 'MONTHLY' as const,
          repaymentStructure: 'BULLET' as const,
          firstRepaymentDate: watchFinancingOptions[0]?.firstRepaymentDate || new Date().toISOString().split('T')[0],
        }
      ]);
    } else {
      // Keep only first
      setValue('financingOptions', [watchFinancingOptions[0]]);
    }
    setCompareEnabled(!compareEnabled);
  };

  const onSubmit = (data: PlanFormValues) => {
    const planId = initialData?.id || crypto.randomUUID();
    const result = saveGuestPlan({ ...data, id: planId });
    try {
      localStorage.setItem('musimaman:active-plan-id', planId);
    } catch { /* storage utility already keeps an in-memory fallback */ }
    if (!result.persisted) {
      alert('Penyimpanan browser tidak tersedia. Rencana tetap aktif selama tab ini terbuka.');
    }
    router.push(`/plans/${planId}/results`);
  };

  const nextStep = () => setStep((s) => Math.min(3, s + 1));
  const prevStep = () => setStep((s) => Math.max(1, s - 1));

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Wizard Progress Header */}
        <div className="bg-white border border-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-text-primary font-sans">Buat Simulasi Arus Kas Baru</h1>
            <p className="text-xs text-text-secondary font-sans">Lengkapi data untuk mendeteksi potensi cash gap.</p>
          </div>
          
          {/* Step indicators */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${step >= 1 ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary'}`}>1</div>
            <div className="w-8 h-0.5 bg-border" />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${step >= 2 ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary'}`}>2</div>
            <div className="w-8 h-0.5 bg-border" />
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border text-xs font-bold ${step >= 3 ? 'bg-primary text-white border-primary' : 'border-border text-text-secondary'}`}>3</div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* STEP 1: LAHAN & DOMESTIK */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Informasi Dasar & Lokasi */}
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <h2 className="text-base font-bold text-text-primary border-b border-border pb-2 font-sans">Informasi Rencana & Wilayah</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Nama Rencana *</label>
                    <input
                      id="title"
                      type="text"
                      placeholder="Contoh: Panen Cabai Garut 2024"
                      {...register('title')}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 focus:bg-white focus:outline-primary min-h-[44px]"
                    />
                    {errors.title && <span className="text-xs text-red-600 font-sans">{errors.title.message}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="provinceCode" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Provinsi *</label>
                    <select
                      id="provinceCode"
                      {...register('provinceCode')}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 focus:bg-white focus:outline-primary min-h-[44px]"
                    >
                      <option value="">Pilih Provinsi</option>
                      {INDONESIA_REGIONS.provinces.map(p => (
                        <option key={p.code} value={p.code}>{p.name}</option>
                      ))}
                    </select>
                    {errors.provinceCode && <span className="text-xs text-red-600 font-sans">{errors.provinceCode.message}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="regencyCode" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Kabupaten *</label>
                    <select
                      id="regencyCode"
                      disabled={!watchProvince}
                      {...register('regencyCode')}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 focus:bg-white focus:outline-primary disabled:opacity-50 min-h-[44px]"
                    >
                      <option value="">Pilih Kabupaten</option>
                      {regencies.map(r => (
                        <option key={r.code} value={r.code}>{r.name}</option>
                      ))}
                    </select>
                    {errors.regencyCode && <span className="text-xs text-red-600 font-sans">{errors.regencyCode.message}</span>}
                  </div>
                </div>
              </div>

              {/* Template picker */}
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <div>
                  <h2 className="text-base font-bold text-text-primary font-sans">Pilih Template Komoditas</h2>
                  <p className="text-xs text-text-secondary mt-0.5 font-sans">Pilih salah satu untuk memuat asumsi fase tanam & biaya rata-rata.</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {(Object.keys(CROP_TEMPLATES) as CropType[]).map((type) => {
                    const active = selectedCrop === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleApplyTemplate(type)}
                        className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 text-center transition-colors ${
                          active 
                            ? 'border-primary bg-[#E8EFE8] text-primary' 
                            : 'border-border hover:border-primary/50 text-text-secondary'
                        }`}
                      >
                        <Leaf className="w-5 h-5 mb-1" />
                        <span className="text-xs font-bold font-sans">{CROP_TEMPLATES[type].name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Parameter Hasil Panen */}
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <h2 className="text-base font-bold text-text-primary border-b border-border pb-2 font-sans">Target & Estimasi Panen</h2>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="plantingDate" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Tanggal Tanam</label>
                    <input
                      id="plantingDate"
                      type="date"
                      {...register('cropPlan.plantingDate')}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 min-h-[44px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="expectedHarvestQuantity" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Estimasi Hasil Panen</label>
                    <div className="flex rounded-lg overflow-hidden border border-border bg-background/30">
                      <input
                        id="expectedHarvestQuantity"
                        type="number"
                        step="any"
                        placeholder="0"
                        {...register('cropPlan.expectedHarvestQuantity', { valueAsNumber: true })}
                        className="flex-1 p-2.5 text-sm bg-transparent focus:outline-none min-h-[44px]"
                      />
                      <input
                        type="text"
                        readOnly
                        {...register('cropPlan.quantityUnit')}
                        className="w-16 p-2.5 text-sm bg-white text-center border-l border-border focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="expectedSellingPriceRupiah" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Harga Jual (Rp/Unit)</label>
                    <input
                      id="expectedSellingPriceRupiah"
                      type="number"
                      placeholder="0"
                      {...register('cropPlan.expectedSellingPriceRupiah', { valueAsNumber: true })}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 min-h-[44px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="expectedTotalHarvestIncomeRupiah" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Total Proyeksi Pendapatan</label>
                    <div className="border border-border p-2.5 rounded-lg text-sm bg-surface-container font-bold text-primary min-h-[44px] flex items-center justify-between">
                      <span className="font-sans">Rp</span>
                      <span className="font-mono">{computedIncome.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Flow Items (Daftar Biaya Operasional) */}
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <h2 className="text-base font-bold text-text-primary font-sans">Biaya Operasional & Pendapatan Tambahan</h2>
                    <p className="text-xs text-text-secondary font-sans">Masukkan pengeluaran masa tanam hingga panen.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => append({
                      id: crypto.randomUUID(),
                      type: 'production_expense',
                      category: '',
                      amountRupiah: 0,
                      timingDate: watchCropPlan?.plantingDate || new Date().toISOString().split('T')[0],
                      description: '',
                    })}
                    className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline font-sans"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah Transaksi
                  </button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, idx) => {
                    const isHarvest = watch(`cashFlowItems.${idx}.isHarvestIncome`);
                    return (
                      <div key={field.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 p-4 border border-border rounded-lg relative bg-background/10">
                        <div className="md:col-span-2">
                          <label htmlFor={`cf-type-${idx}`} className="text-[10px] font-bold uppercase text-text-secondary font-sans">Jenis</label>
                          <select
                            id={`cf-type-${idx}`}
                            disabled={isHarvest}
                            {...register(`cashFlowItems.${idx}.type` as const)}
                            className="w-full border border-border p-2 rounded text-xs bg-white min-h-[44px] disabled:opacity-50 font-sans"
                          >
                            <option value="production_expense">Biaya Produksi</option>
                            <option value="income">Pendapatan Lain</option>
                          </select>
                        </div>

                        <div className="md:col-span-3">
                          <label htmlFor={`cf-category-${idx}`} className="text-[10px] font-bold uppercase text-text-secondary font-sans">Kategori</label>
                          <input
                            id={`cf-category-${idx}`}
                            type="text"
                            disabled={isHarvest}
                            placeholder="Contoh: Pupuk NPK, Bibit"
                            {...register(`cashFlowItems.${idx}.category` as const)}
                            className="w-full border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label htmlFor={`cf-amount-${idx}`} className="text-[10px] font-bold uppercase text-text-secondary font-sans">Jumlah (Rupiah)</label>
                          <input
                            id={`cf-amount-${idx}`}
                            type="number"
                            placeholder="0"
                            {...register(`cashFlowItems.${idx}.amountRupiah` as const, { valueAsNumber: true })}
                            className="w-full border border-border p-2 rounded text-xs bg-white min-h-[44px] font-mono"
                          />
                        </div>

                        <div className="md:col-span-3">
                          <label htmlFor={`cf-date-${idx}`} className="text-[10px] font-bold uppercase text-text-secondary font-sans">Tanggal</label>
                          <input
                            id={`cf-date-${idx}`}
                            type="date"
                            {...register(`cashFlowItems.${idx}.timingDate` as const)}
                            className="w-full border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          />
                        </div>

                        <div className="md:col-span-1 flex items-end justify-center pb-1">
                          {!isHarvest && (
                            <button
                              type="button"
                              onClick={() => remove(idx)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Hapus baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Domestik & Saldo Awal */}
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <h2 className="text-base font-bold text-text-primary border-b border-border pb-2 font-sans">Kebutuhan Rumah Tangga & Saldo Awal</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col gap-2">
                    <label htmlFor="monthlyHouseholdExpenseRupiah" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Pengeluaran Keluarga / Bulan</label>
                    <input
                      id="monthlyHouseholdExpenseRupiah"
                      type="number"
                      placeholder="Contoh: 1500000"
                      {...register('monthlyHouseholdExpenseRupiah', { valueAsNumber: true })}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 min-h-[44px]"
                    />
                    {errors.monthlyHouseholdExpenseRupiah && <span className="text-xs text-red-600 font-sans">{errors.monthlyHouseholdExpenseRupiah.message}</span>}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="openingBalanceRupiah" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Saldo Awal Kas Aktif</label>
                    <input
                      id="openingBalanceRupiah"
                      type="number"
                      placeholder="0"
                      {...register('openingBalanceRupiah', { valueAsNumber: true })}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 min-h-[44px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor="emergencyReserveRupiah" className="text-xs font-bold uppercase tracking-wider text-text-secondary font-sans">Simpanan / Dana Darurat</label>
                    <input
                      id="emergencyReserveRupiah"
                      type="number"
                      placeholder="0"
                      {...register('emergencyReserveRupiah', { valueAsNumber: true })}
                      className="border border-border p-2.5 rounded-lg text-sm bg-background/30 min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-end pt-4">
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!watch('title') || !watchProvince || !watch('regencyCode')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg disabled:opacity-50 hover:opacity-90 min-h-[44px] font-sans"
                >
                  Lanjutkan Ke Pembiayaan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: FINANCING */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-2">
                  <div>
                    <h2 className="text-base font-bold text-text-primary font-sans">Struktur Pembiayaan (Pinjaman)</h2>
                    <p className="text-xs text-text-secondary font-sans">Masukkan pengajuan pinjaman untuk mensimulasikan beban cicilan.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleCompare}
                    className={`px-3 py-1.5 text-xs font-bold rounded border transition-colors font-sans ${
                      compareEnabled 
                        ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
                        : 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20'
                    }`}
                  >
                    {compareEnabled ? 'Hapus Skema Pembanding' : 'Bandingkan dengan Skema Lain'}
                  </button>
                </div>

                {/* Option A & B containers */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Loan Primary */}
                  <div className="border border-border p-4 rounded-xl space-y-4 bg-background/5">
                    <h3 className="text-sm font-bold text-primary flex items-center gap-1.5 font-sans">
                      <Coins className="w-4 h-4" /> Skema Utama (A)
                    </h3>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-1">
                        <label htmlFor="primary-loan-name" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Nama Kreditur / Program</label>
                        <input
                          id="primary-loan-name"
                          type="text"
                          {...register('financingOptions.0.name')}
                          className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-principal" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Pokok Plafon (Rp)</label>
                          <input
                            id="primary-principal"
                            type="number"
                            {...register('financingOptions.0.principalRupiah', { valueAsNumber: true })}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-mono"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-rate" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Suku Bunga (%)</label>
                          <div className="flex rounded border border-border overflow-hidden bg-white">
                            <input
                              id="primary-rate"
                              type="number"
                              step="any"
                              placeholder="0"
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                setValue('financingOptions.0.interestRateBps', isNaN(val) ? 0 : Math.round(val * 100));
                              }}
                              className="flex-1 p-2 text-xs focus:outline-none min-h-[44px]"
                            />
                            <span className="p-2 text-xs text-text-secondary bg-[#E8EFE8] font-bold font-sans">%</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-rate-period" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Metode Bunga</label>
                          <select
                            id="primary-rate-period"
                            {...register('financingOptions.0.interestPeriod')}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          >
                            <option value="ANNUAL">Per Tahun (Annual)</option>
                            <option value="MONTHLY">Per Bulan (Monthly)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-repay-structure" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Struktur Repayment</label>
                          <select
                            id="primary-repay-structure"
                            {...register('financingOptions.0.repaymentStructure')}
                            onChange={(e) => {
                              const val = e.target.value as 'FLAT_MONTHLY' | 'BULLET';
                              setValue('financingOptions.0.repaymentStructure', val);
                              setValue('financingOptions.0.repaymentFrequency', val === 'FLAT_MONTHLY' ? 'MONTHLY' : 'ONCE');
                              if (val === 'BULLET') {
                                setValue('financingOptions.0.numberOfInstallments', 1);
                              }
                            }}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          >
                            <option value="FLAT_MONTHLY">Cicilan Flat Bulanan</option>
                            <option value="BULLET">Pascapanen (Bullet)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-installments" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Jumlah Cicilan</label>
                          <input
                            id="primary-installments"
                            type="number"
                            disabled={watchFinancingOptions[0]?.repaymentStructure === 'BULLET'}
                            {...register('financingOptions.0.numberOfInstallments', { valueAsNumber: true })}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] disabled:opacity-50 font-sans"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-admin-fee" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Biaya Admin (Upfront)</label>
                          <input
                            id="primary-admin-fee"
                            type="number"
                            {...register('financingOptions.0.administrationFeeRupiah', { valueAsNumber: true })}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-disburse-date" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Tanggal Pencairan</label>
                          <input
                            id="primary-disburse-date"
                            type="date"
                            {...register('financingOptions.0.financingStartDate')}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="primary-repay-date" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Tanggal Jatuh Tempo I</label>
                          <input
                            id="primary-repay-date"
                            type="date"
                            {...register('financingOptions.0.firstRepaymentDate')}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Loan Secondary (Conditional Compare) */}
                  {compareEnabled ? (
                    <div className="border-2 border-dashed border-primary/30 p-4 rounded-xl space-y-4 bg-primary/5">
                      <h3 className="text-sm font-bold text-[#986924] flex items-center gap-1.5 font-sans">
                        <Coins className="w-4 h-4" /> Skema Pembanding (B)
                      </h3>

                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="secondary-loan-name" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Nama Kreditur / Program</label>
                          <input
                            id="secondary-loan-name"
                            type="text"
                            {...register('financingOptions.1.name')}
                            className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-principal" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Pokok Plafon (Rp)</label>
                            <input
                              id="secondary-principal"
                              type="number"
                              {...register('financingOptions.1.principalRupiah', { valueAsNumber: true })}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-mono"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-rate" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Suku Bunga (%)</label>
                            <div className="flex rounded border border-border overflow-hidden bg-white">
                              <input
                                id="secondary-rate"
                                type="number"
                                step="any"
                                placeholder="0"
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value);
                                  setValue('financingOptions.1.interestRateBps', isNaN(val) ? 0 : Math.round(val * 100));
                                }}
                                className="flex-1 p-2 text-xs focus:outline-none min-h-[44px]"
                              />
                              <span className="p-2 text-xs text-text-secondary bg-[#E8EFE8] font-bold font-sans">%</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-rate-period" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Metode Bunga</label>
                            <select
                              id="secondary-rate-period"
                              {...register('financingOptions.1.interestPeriod')}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                            >
                              <option value="ANNUAL">Per Tahun (Annual)</option>
                              <option value="MONTHLY">Per Bulan (Monthly)</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-repay-structure" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Struktur Repayment</label>
                            <select
                              id="secondary-repay-structure"
                              {...register('financingOptions.1.repaymentStructure')}
                              onChange={(e) => {
                                const val = e.target.value as 'FLAT_MONTHLY' | 'BULLET';
                                setValue('financingOptions.1.repaymentStructure', val);
                                setValue('financingOptions.1.repaymentFrequency', val === 'FLAT_MONTHLY' ? 'MONTHLY' : 'ONCE');
                                if (val === 'BULLET') {
                                  setValue('financingOptions.1.numberOfInstallments', 1);
                                }
                              }}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                            >
                              <option value="FLAT_MONTHLY">Cicilan Flat Bulanan</option>
                              <option value="BULLET">Pascapanen (Bullet)</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-installments" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Jumlah Cicilan</label>
                            <input
                              id="secondary-installments"
                              type="number"
                              disabled={watchFinancingOptions[1]?.repaymentStructure === 'BULLET'}
                              {...register('financingOptions.1.numberOfInstallments', { valueAsNumber: true })}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] disabled:opacity-50 font-sans"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-admin-fee" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Biaya Admin (Upfront)</label>
                            <input
                              id="secondary-admin-fee"
                              type="number"
                              {...register('financingOptions.1.administrationFeeRupiah', { valueAsNumber: true })}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-disburse-date" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Tanggal Pencairan</label>
                            <input
                              id="secondary-disburse-date"
                              type="date"
                              {...register('financingOptions.1.financingStartDate')}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <label htmlFor="secondary-repay-date" className="text-[10px] font-bold uppercase text-text-secondary font-sans">Tanggal Jatuh Tempo I</label>
                            <input
                              id="secondary-repay-date"
                              type="date"
                              {...register('financingOptions.1.firstRepaymentDate')}
                              className="border border-border p-2 rounded text-xs bg-white min-h-[44px] font-sans"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-border p-6 rounded-xl flex flex-col justify-center items-center text-center text-text-secondary space-y-3 min-h-[250px] bg-white">
                      <HelpCircle className="w-8 h-8 opacity-40 text-text-secondary" />
                      <p className="text-xs font-sans">Bandingkan skema cicilan musiman (Bullet) vs flat bulanan untuk meminimalkan risiko cash gap sebelum panen.</p>
                      <button
                        type="button"
                        onClick={handleToggleCompare}
                        className="px-4 py-2 text-xs bg-white hover:bg-background/25 text-primary border border-primary rounded-lg font-bold min-h-[44px] font-sans"
                      >
                        Aktifkan Pembanding
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-text-secondary bg-white font-bold rounded-lg hover:bg-background/20 min-h-[44px] font-sans"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 min-h-[44px] font-sans"
                >
                  Lanjutkan Ke Review <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & SUBMIT */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white border border-border p-6 rounded-xl space-y-4">
                <h2 className="text-base font-bold text-text-primary border-b border-border pb-2 font-sans">Tinjau Data Rencana</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                  <div className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary font-sans">Detail Lahan & Komoditas</h3>
                    <div className="space-y-1">
                      <p className="flex justify-between text-xs font-sans"><span>Judul Rencana:</span> <span className="font-bold">{watch('title')}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Komoditas:</span> <span className="font-bold">{watchCropPlan?.cropType?.toUpperCase()}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Lokasi:</span> <span className="font-bold">ID-{watch('provinceCode')}-{watch('regencyCode')}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Mulai Tanam:</span> <span className="font-bold">{watchCropPlan?.plantingDate}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Estimasi Hasil:</span> <span className="font-bold">{watchCropPlan?.expectedHarvestQuantity} {watchCropPlan?.quantityUnit}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Total Proyeksi Pendapatan:</span> <span className="font-bold text-primary font-mono">Rp {computedIncome.toLocaleString('id-ID')}</span></p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary font-sans">Keuangan Rumah Tangga & Kas</h3>
                    <div className="space-y-1">
                      <p className="flex justify-between text-xs font-sans"><span>Sewa & Upah Kerja Lahan:</span> <span className="font-bold">{fields.filter(x => x.type === 'production_expense').length} Transaksi</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Dana Rumah Tangga / Bln:</span> <span className="font-bold font-mono">Rp {parseInt(watch('monthlyHouseholdExpenseRupiah')?.toString() || '0').toLocaleString('id-ID')}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Saldo Awal Kas:</span> <span className="font-bold text-primary font-mono">Rp {parseInt(watch('openingBalanceRupiah')?.toString() || '0').toLocaleString('id-ID')}</span></p>
                      <p className="flex justify-between text-xs font-sans"><span>Dana Cadangan / Darurat:</span> <span className="font-bold text-primary font-mono">Rp {parseInt(watch('emergencyReserveRupiah')?.toString() || '0').toLocaleString('id-ID')}</span></p>
                    </div>
                  </div>
                </div>

                {/* Financing summaries */}
                <div className="border-t border-border pt-4 space-y-4">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-text-secondary font-sans">Struktur Pembiayaan</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    {watchFinancingOptions.map((opt, idx) => (
                      <div key={opt.id} className="bg-background/25 border border-border p-4 rounded-xl">
                        <p className="font-bold text-xs text-primary uppercase mb-2 font-sans">Skema Pembiayaan {idx === 0 ? 'Utama (A)' : 'Pembanding (B)'}</p>
                        <p className="flex justify-between text-xs font-sans"><span>Kreditur:</span> <span className="font-bold">{opt.name}</span></p>
                        <p className="flex justify-between text-xs font-sans"><span>Plafon Pokok:</span> <span className="font-bold font-mono">Rp {parseInt(opt.principalRupiah?.toString() || '0', 10).toLocaleString('id-ID')}</span></p>
                        <p className="flex justify-between text-xs font-sans"><span>Suku Bunga:</span> <span className="font-bold">{(opt.interestRateBps / 100).toFixed(2)}% per {opt.interestPeriod === 'MONTHLY' ? 'Bulan' : 'Tahun'}</span></p>
                        <p className="flex justify-between text-xs font-sans"><span>Bentuk Cicilan:</span> <span className="font-bold">{opt.repaymentStructure === 'FLAT_MONTHLY' ? 'Flat Bulanan' : 'Pascapanen (Bullet)'}</span></p>
                        <p className="flex justify-between text-xs font-sans"><span>Tenor Pembayaran:</span> <span className="font-bold">{opt.numberOfInstallments} Kali</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation buttons */}
              <div className="flex justify-between pt-4">
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center gap-2 px-6 py-3 border border-border text-text-secondary bg-white font-bold rounded-lg hover:bg-background/20 min-h-[44px] font-sans"
                >
                  <ArrowLeft className="w-4 h-4" /> Kembali
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-lg hover:opacity-90 min-h-[44px] font-sans"
                >
                  Hitung Proyeksi Arus Kas <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

