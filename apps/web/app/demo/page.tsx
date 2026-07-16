'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DemoPage() {
  const router = useRouter();

  useEffect(() => {
    // Generate mock seed plan
    const demoPlanId = 'demo-padi-garut';
    const demoPlan = {
      id: demoPlanId,
      title: 'Rencana Panen Padi Sawah - Demo Garut',
      provinceCode: '32', // Jawa Barat
      regencyCode: '3205', // Garut
      districtCode: '3205010', // Tarogong Kidul
      cropPlan: {
        cropType: 'rice',
        plantingDate: '2024-11-01',
        expectedHarvestQuantity: 5.5,
        quantityUnit: 'Ton',
        expectedSellingPriceRupiah: 7000000,
        expectedTotalHarvestIncomeRupiah: 38500000,
      },
      cashFlowItems: [
        {
          id: 'exp-1',
          type: 'production_expense',
          category: 'Sewa Lahan & Traktor',
          amountRupiah: 2000000,
          timingDate: '2024-11-05',
          description: 'Sewa alat berat dan bajak sawah',
        },
        {
          id: 'exp-2',
          type: 'production_expense',
          category: 'Bibit & Pupuk Dasar',
          amountRupiah: 1500000,
          timingDate: '2024-11-10',
          description: 'Benih padi unggul dan pupuk organik',
        },
        {
          id: 'exp-3',
          type: 'production_expense',
          category: 'Pupuk Susulan & Pestisida',
          amountRupiah: 1200000,
          timingDate: '2024-12-15',
          description: 'Urea, NPK, dan obat hama',
        },
        {
          id: 'exp-4',
          type: 'production_expense',
          category: 'Tenaga Kerja Penyiangan',
          amountRupiah: 800000,
          timingDate: '2025-01-10',
          description: 'Upah buruh tani untuk penyiangan rumput',
        },
        {
          id: 'exp-5',
          type: 'production_expense',
          category: 'Upah Buruh Panen',
          amountRupiah: 2500000,
          timingDate: '2025-02-15',
          description: 'Biaya potong padi dan angkut',
        },
        {
          id: 'inc-1',
          type: 'income',
          category: 'Hasil Panen Padi',
          amountRupiah: 38500000,
          timingDate: '2025-02-20',
          description: 'Penjualan 5.5 Ton Gabah Kering Panen',
          isHarvestIncome: true,
        },
      ],
      monthlyHouseholdExpenseRupiah: 1500000,
      openingBalanceRupiah: 1000000,
      emergencyReserveRupiah: 500000,
      financingOptions: [
        {
          id: 'loan-flat',
          name: 'Kredit Flat Bulanan - Koperasi Mandiri',
          principalRupiah: 5000000,
          interestRateBps: 1200, // 12%
          interestPeriod: 'ANNUAL',
          administrationFeeRupiah: 100000,
          otherUpfrontFeesRupiah: 0,
          financingStartDate: '2024-11-01',
          gracePeriodMonths: 0,
          numberOfInstallments: 5,
          repaymentFrequency: 'MONTHLY',
          repaymentStructure: 'FLAT_MONTHLY',
          firstRepaymentDate: '2024-12-01',
        },
        {
          id: 'loan-bullet',
          name: 'Kredit Musiman (Pascapanen / Bullet) - Bank Tani',
          principalRupiah: 5000000,
          interestRateBps: 1400, // 14%
          interestPeriod: 'ANNUAL',
          administrationFeeRupiah: 50000,
          otherUpfrontFeesRupiah: 0,
          financingStartDate: '2024-11-01',
          gracePeriodMonths: 0,
          numberOfInstallments: 1,
          repaymentFrequency: 'ONCE',
          repaymentStructure: 'BULLET',
          firstRepaymentDate: '2025-02-20',
        },
      ],
      notes: 'Rencana tanam padi sawah percontohan untuk demo fitur MusimAman.',
    };

    // Save to guest storage
    const storageKey = 'musimaman:guest-plans:v1';
    let existingPlans = [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        existingPlans = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // Filter out existing demo plan if any, then add
    existingPlans = existingPlans.filter((p: any) => p.id !== demoPlanId);
    existingPlans.push(demoPlan);

    localStorage.setItem(storageKey, JSON.stringify(existingPlans));
    localStorage.setItem('musimaman:active-plan-id', demoPlanId);

    // Redirect to results dashboard
    router.push(`/plans/${demoPlanId}/results`);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-text-secondary font-medium">Mempersiapkan data demo 1-klik...</p>
    </div>
  );
}
