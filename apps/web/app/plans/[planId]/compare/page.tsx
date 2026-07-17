'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculatePlan } from '@musimaman/financial-engine';
import { CalculationInput, CashFlowResult } from '@musimaman/shared-types';
import { ArrowLeft, CheckCircle2, ShieldAlert, Award, FileText } from 'lucide-react';

export default function ComparePage() {
  const { planId } = useParams() as { planId: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [basePlan, setBasePlan] = useState<any>(null);

  useEffect(() => {
    const storageKey = 'musimaman:guest-plans:v1';
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const plans = JSON.parse(stored);
        const plan = plans.find((p: any) => p.id === planId);
        if (plan) {
          setBasePlan(plan);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [planId]);

  const comparison = useMemo(() => {
    if (!basePlan || !basePlan.financingOptions || basePlan.financingOptions.length < 2) return null;

    const optA = basePlan.financingOptions[0];
    const optB = basePlan.financingOptions[1];

    const inputA: CalculationInput = {
      schemaVersion: 1,
      engineVersion: '1.0.0',
      planStartDate: basePlan.cropPlan?.plantingDate || '2024-11-01',
      planEndDate: addMonthsStr(basePlan.cropPlan?.plantingDate || '2024-11-01', 6),
      openingBalanceRupiah: basePlan.openingBalanceRupiah || 0,
      emergencyReserveRupiah: basePlan.emergencyReserveRupiah || 0,
      monthlyHouseholdExpenseRupiah: basePlan.monthlyHouseholdExpenseRupiah || 0,
      cashFlowItems: basePlan.cashFlowItems || [],
      financingOption: optA,
    };

    const inputB: CalculationInput = {
      ...inputA,
      financingOption: optB,
    };

    const resultA = calculatePlan(inputA);
    const resultB = calculatePlan(inputB);

    // Determine which is better based on tie-breaking display rules:
    // 1. fewer expected cash gaps
    // 2. lower worst max gap
    // 3. later first gap month
    // 4. higher ending balance
    // 5. lower total cost
    let winner = 'A';
    let reason = '';

    const gapsA = resultA.monthly.filter(m => m.runningBalanceRupiah < 0).length;
    const gapsB = resultB.monthly.filter(m => m.runningBalanceRupiah < 0).length;

    if (gapsA < gapsB) {
      winner = 'A';
      reason = 'memiliki jumlah bulan defisit kas (cash gap) yang lebih sedikit.';
    } else if (gapsB < gapsA) {
      winner = 'B';
      reason = 'memiliki jumlah bulan defisit kas (cash gap) yang lebih sedikit.';
    } else {
      // Tie break 2: lower max cash gap
      if (resultA.maximumCashGapRupiah < resultB.maximumCashGapRupiah) {
        winner = 'A';
        reason = 'memiliki nilai defisit kas maksimum yang lebih kecil.';
      } else if (resultB.maximumCashGapRupiah < resultA.maximumCashGapRupiah) {
        winner = 'B';
        reason = 'memiliki nilai defisit kas maksimum yang lebih kecil.';
      } else {
        // Tie break 4: higher ending balance
        if (resultA.endingBalanceRupiah > resultB.endingBalanceRupiah) {
          winner = 'A';
          reason = 'menghasilkan proyeksi saldo kas akhir yang lebih tinggi.';
        } else if (resultB.endingBalanceRupiah > resultA.endingBalanceRupiah) {
          winner = 'B';
          reason = 'menghasilkan proyeksi saldo kas akhir yang lebih tinggi.';
        } else {
          // Tie break 5: lower cost
          if (resultA.totalFinancingCostRupiah < resultB.totalFinancingCostRupiah) {
            winner = 'A';
            reason = 'memiliki beban biaya pembiayaan keseluruhan yang lebih murah.';
          } else if (resultB.totalFinancingCostRupiah < resultA.totalFinancingCostRupiah) {
            winner = 'B';
            reason = 'memiliki beban biaya pembiayaan keseluruhan yang lebih murah.';
          } else {
            winner = 'NONE';
            reason = 'keduanya memiliki profil risiko finansial yang setara.';
          }
        }
      }
    }

    return {
      resultA,
      resultB,
      optA,
      optB,
      winner,
      reason,
    };
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
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary font-medium">Menganalisis perbandingan pembiayaan...</p>
      </div>
    );
  }

  if (!basePlan || !basePlan.financingOptions || basePlan.financingOptions.length < 2 || !comparison) {
    return (
      <div className="text-center py-20 bg-white border border-border rounded-xl p-8 max-w-lg mx-auto space-y-4">
        <ShieldAlert className="w-12 h-12 text-[#986924] mx-auto" />
        <h2 className="text-lg font-bold text-text-primary">Perbandingan Tidak Dapat Dilakukan</h2>
        <p className="text-sm text-text-secondary">
          Simulasi ini membutuhkan minimal dua struktur pembiayaan untuk dibandingkan secara berdampingan. Silakan edit rencana dan tambahkan skema pembiayaan pembanding.
        </p>
        <button
          onClick={() => router.push(`/plans/${planId}/edit`)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold min-h-[44px]"
        >
          Edit Rencana & Tambah Skema
        </button>
      </div>
    );
  }

  const { resultA, resultB, optA, optB, winner, reason } = comparison;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-border pb-4">
        <button
          onClick={() => router.push(`/plans/${planId}/results`)}
          className="p-2 border border-border rounded-lg bg-white hover:bg-background/20"
        >
          <ArrowLeft className="w-4 h-4 text-text-secondary" />
        </button>
        <div>
          <span className="text-[10px] font-bold text-[#986924] uppercase tracking-wider bg-yellow-100/50 px-2 py-0.5 rounded border border-yellow-200">Perbandingan Produk</span>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">Komparasi Kredit Berdampingan</h1>
        </div>
      </div>

      {/* Decision recommendation banner */}
      <div className="bg-white border border-border p-6 rounded-xl flex items-start gap-4">
        <div className="p-2 bg-[#E8EFE8] text-primary rounded-lg">
          <Award className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-text-primary">Rekomendasi Hasil Simulasi</h2>
          <p className="text-sm text-text-secondary leading-relaxed">
            {winner === 'NONE' 
              ? `Kedua skema ${reason}`
              : `Struktur ${winner === 'A' ? 'A (' + optA.name + ')' : 'B (' + optB.name + ')'} relatif lebih tahan dalam simulasi ini karena ${reason}`}
          </p>
        </div>
      </div>

      {/* Side by side comparison table */}
      <div className="bg-white border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="bg-background/25 border-b border-border text-[10px] uppercase font-bold text-text-secondary">
              <th className="p-4 w-1/3">Metrik Pembanding</th>
              <th className="p-4 bg-primary/5 text-primary border-x border-border">Skema A: {optA.name}</th>
              <th className="p-4 text-[#986924]">Skema B: {optB.name}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            <tr>
              <td className="p-4 font-bold text-text-secondary">Pokok Pinjaman</td>
              <td className="p-4 bg-primary/5 border-x border-border font-medium">Rp {optA.principalRupiah.toLocaleString('id-ID')}</td>
              <td className="p-4 font-medium">Rp {optB.principalRupiah.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Suku Bunga</td>
              <td className="p-4 bg-primary/5 border-x border-border">{(optA.interestRateBps / 100).toFixed(2)}% ({optA.interestPeriod === 'MONTHLY' ? 'Bulanan' : 'Tahunan'})</td>
              <td className="p-4">{(optB.interestRateBps / 100).toFixed(2)}% ({optB.interestPeriod === 'MONTHLY' ? 'Bulanan' : 'Tahunan'})</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Repayment Structure</td>
              <td className="p-4 bg-primary/5 border-x border-border font-bold">{optA.repaymentStructure === 'FLAT_MONTHLY' ? 'Cicilan Flat Bulanan' : 'Pascapanen (Bullet)'}</td>
              <td className="p-4 font-bold">{optB.repaymentStructure === 'FLAT_MONTHLY' ? 'Cicilan Flat Bulanan' : 'Pascapanen (Bullet)'}</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Jumlah Tenor</td>
              <td className="p-4 bg-primary/5 border-x border-border">{optA.numberOfInstallments} Kali</td>
              <td className="p-4">{optB.numberOfInstallments} Kali</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Total Bunga (Rupiah)</td>
              <td className="p-4 bg-primary/5 border-x border-border text-red-600 font-medium">Rp {resultA.totalInterestRupiah.toLocaleString('id-ID')}</td>
              <td className="p-4 text-red-600 font-medium">Rp {resultB.totalInterestRupiah.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Total Biaya Upfront (Admin)</td>
              <td className="p-4 bg-primary/5 border-x border-border text-red-600">Rp {resultA.totalFeesRupiah.toLocaleString('id-ID')}</td>
              <td className="p-4 text-red-600">Rp {resultB.totalFeesRupiah.toLocaleString('id-ID')}</td>
            </tr>
            <tr className="bg-background/10 font-bold">
              <td className="p-4 text-text-secondary">Total Beban Pinjaman (Cost)</td>
              <td className="p-4 bg-primary/10 border-x border-border text-red-600">Rp {resultA.totalFinancingCostRupiah.toLocaleString('id-ID')}</td>
              <td className="p-4 text-red-600">Rp {resultB.totalFinancingCostRupiah.toLocaleString('id-ID')}</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Bulan Defisit Pertama</td>
              <td className="p-4 bg-primary/5 border-x border-border text-red-600 font-bold">{resultA.firstCashGapMonth || 'Tidak ada'}</td>
              <td className="p-4 text-red-600 font-bold">{resultB.firstCashGapMonth || 'Tidak ada'}</td>
            </tr>
            <tr>
              <td className="p-4 font-bold text-text-secondary">Defisit Kas Maksimum</td>
              <td className="p-4 bg-primary/5 border-x border-border font-bold text-red-600">Rp {resultA.maximumCashGapRupiah.toLocaleString('id-ID')}</td>
              <td className="p-4 font-bold text-red-600">Rp {resultB.maximumCashGapRupiah.toLocaleString('id-ID')}</td>
            </tr>
            <tr className="bg-[#E8EFE8]/40 font-bold">
              <td className="p-4 text-text-secondary">Proyeksi Saldo Akhir Kas</td>
              <td className="p-4 bg-primary/15 border-x border-primary/20 text-primary">Rp {resultA.endingBalanceRupiah.toLocaleString('id-ID')}</td>
              <td className="p-4 text-primary">Rp {resultB.endingBalanceRupiah.toLocaleString('id-ID')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
