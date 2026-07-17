'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculatePlan } from '@musimaman/financial-engine';
import { CalculationInput, CashFlowResult } from '@musimaman/shared-types';
import { Printer, ArrowLeft } from 'lucide-react';
import { getGuestPlan } from '../../../../lib/guest-plans';

export default function ReportPage() {
  const { planId } = useParams() as { planId: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [basePlan, setBasePlan] = useState<any>(null);

  useEffect(() => {
    const plan = getGuestPlan(planId);
    if (plan) setBasePlan(plan);
    setLoading(false);
  }, [planId]);

  const result = useMemo(() => {
    if (!basePlan) return null;
    const loanOption = basePlan.financingOptions && basePlan.financingOptions.length > 0 ? basePlan.financingOptions[0] : null;

    const input: CalculationInput = {
      schemaVersion: 1,
      engineVersion: '1.0.0',
      planStartDate: basePlan.cropPlan?.plantingDate || '2024-11-01',
      planEndDate: addMonthsStr(basePlan.cropPlan?.plantingDate || '2024-11-01', 18),
      openingBalanceRupiah: basePlan.openingBalanceRupiah || 0,
      emergencyReserveRupiah: basePlan.emergencyReserveRupiah || 0,
      monthlyHouseholdExpenseRupiah: basePlan.monthlyHouseholdExpenseRupiah || 0,
      cashFlowItems: basePlan.cashFlowItems || [],
      financingOption: loanOption,
    };

    return calculatePlan(input);
  }, [basePlan]);

  function addMonthsStr(dateStr: string, months: number): string {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(y, m + months, d));
    return date.toISOString().split('T')[0];
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!basePlan || !result) {
    return (
      <div className="text-center py-20">
        <p className="font-bold">Laporan tidak ditemukan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="max-w-4xl mx-auto bg-white p-8 md:p-12 border border-border rounded-xl space-y-8 print:border-none print:p-0">
        {/* Top Controls - Hidden during print */}
      <div className="flex justify-between items-center border-b border-border pb-4 no-print">
        <button
          onClick={() => router.push(`/plans/${planId}/results`)}
          className="inline-flex items-center gap-1 text-xs text-text-secondary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Dasbor
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 min-h-[44px]"
        >
          <Printer className="w-4 h-4" /> Cetak Sekarang
        </button>
      </div>

      {/* Official Report Title */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary uppercase tracking-wider">Laporan Hasil Analisis Arus Kas</h1>
        <p className="text-sm font-semibold text-text-secondary">Rencana Kegiatan Usaha & Keuangan Keluarga - MusimAman</p>
        <div className="text-[10px] text-text-secondary space-x-4">
          <span>ID Dokumen: {planId.toUpperCase()}</span>
          <span>•</span>
          <span>Mesin Perhitungan: v1.0.0</span>
          <span>•</span>
          <span>Waktu Cetak: {new Date().toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Anonymized Profile */}
      <div className="border border-border p-4 rounded-xl space-y-2">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Informasi Rencana (Anonim)</h2>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <p><span>Judul Rencana:</span> <span className="font-bold">{basePlan.title}</span></p>
          <p><span>Komoditas:</span> <span className="font-bold">{basePlan.cropPlan?.cropType?.toUpperCase()}</span></p>
          <p><span>Lokasi Wilayah:</span> <span className="font-bold">ID-{basePlan.provinceCode}-{basePlan.regencyCode} (Kabupaten Terdaftar)</span></p>
          <p><span>Siklus Tanam:</span> <span className="font-bold">{basePlan.cropPlan?.plantingDate} s/d {result.monthly[result.monthly.length - 1]?.month}</span></p>
        </div>
      </div>

      {/* Financial Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-border p-4 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-text-secondary block">Saldo Minimum Kas</span>
          <span className={`text-xl font-bold block mt-1 ${result.minimumBalanceRupiah >= 0 ? 'text-primary' : 'text-red-600'}`}>
            Rp {result.minimumBalanceRupiah.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="border border-border p-4 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-text-secondary block">Defisit Kas Maksimum</span>
          <span className="text-xl font-bold text-red-600 block mt-1">
            Rp {result.maximumCashGapRupiah.toLocaleString('id-ID')}
          </span>
        </div>
        <div className="border border-border p-4 rounded-xl text-center">
          <span className="text-[10px] uppercase font-bold text-text-secondary block">Saldo Akhir Kas</span>
          <span className="text-xl font-bold text-primary block mt-1">
            Rp {result.endingBalanceRupiah.toLocaleString('id-ID')}
          </span>
        </div>
      </div>

      {/* Table details */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Detail Rincian Buku Kas Bulanan</h2>
        <table className="w-full text-[11px] text-left border border-border border-collapse">
          <thead>
            <tr className="bg-background/20 border-b border-border font-bold">
              <th className="p-2 border-r border-border">Bulan</th>
              <th className="p-2 text-right border-r border-border">Pendapatan Tani</th>
              <th className="p-2 text-right border-r border-border">Biaya Saprotan</th>
              <th className="p-2 text-right border-r border-border">Biaya Keluarga</th>
              <th className="p-2 text-right border-r border-border">Cicilan Pinjaman</th>
              <th className="p-2 text-right bg-background/5">Saldo Akhir</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {result.monthly.map((row) => (
              <tr key={row.month} className={row.isCashGap ? 'bg-red-50/20' : ''}>
                <td className="p-2 border-r border-border font-bold">{row.month}</td>
                <td className="p-2 text-right border-r border-border">Rp {row.harvestIncomeRupiah.toLocaleString('id-ID')}</td>
                <td className="p-2 text-right border-r border-border">Rp {row.productionExpenseRupiah.toLocaleString('id-ID')}</td>
                <td className="p-2 text-right border-r border-border">Rp {row.householdExpenseRupiah.toLocaleString('id-ID')}</td>
                <td className="p-2 text-right border-r border-border">Rp {row.financingPaymentRupiah.toLocaleString('id-ID')}</td>
                <td className={`p-2 text-right font-bold bg-background/5 ${row.isCashGap ? 'text-red-600' : 'text-primary'}`}>
                  Rp {row.runningBalanceRupiah.toLocaleString('id-ID')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legal Footer Disclaimer */}
      <div className="border-t border-border pt-6 mt-8 text-center space-y-4">
        <p className="text-xs text-text-primary leading-relaxed italic max-w-2xl mx-auto">
          Pemberitahuan: Alat bantu diskusi, bukan persetujuan kredit atau nasihat keuangan. Semua skenario adalah simulasi berdasarkan asumsi pengguna. MusimAman tidak bertanggung jawab atas keputusan nyata yang diambil berdasarkan simulasi ini.
        </p>
        <p className="text-[10px] text-text-secondary">
          © {new Date().getFullYear()} MusimAman. Platform Simulasi Keuangan Petani Indonesia.
        </p>
      </div>
      </div>
    </div>
  );
}
