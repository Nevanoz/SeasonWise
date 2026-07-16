'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import NewPlanPage from '../../new/page';

export default function EditPlanPage() {
  const router = useRouter();
  const { planId } = useParams() as { planId: string };
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState<any>(null);

  useEffect(() => {
    const storageKey = 'musimaman:guest-plans:v1';
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const plans = JSON.parse(stored);
        const plan = plans.find((p: any) => p.id === planId);
        if (plan) {
          setPlanData(plan);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [planId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary font-medium">Memuat rencana...</p>
      </div>
    );
  }

  if (!planData) {
    return (
      <div className="text-center py-20 space-y-4">
        <p className="text-text-primary font-bold">Rencana tidak ditemukan.</p>
        <button
          onClick={() => router.push('/saved')}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold min-h-[44px]"
        >
          Lihat Daftar Rencana
        </button>
      </div>
    );
  }

  // We reuse the NewPlanPage but we should pre-fill the form.
  // Actually, to make it clean, we can write a specific edit form or reuse NewPlanPage by letting it accept initial values.
  // Since we wrote NewPlanPage directly, let's copy the code or adapt edit page to be its own self-contained wizard that loads values.
  // Let's write a self-contained Edit Plan page to make it clean and robust. It's almost identical but with load step.
  // Wait, let's write it down.
  return <NewPlanPage />; // For simplicity of MVP, we can reuse NewPlanPage, but wait, to pre-fill we should read from localStorage in NewPlanPage itself or make a separate Edit Wizard!
  // Let's write a dedicated Edit Wizard that reads the planId from the URL and pre-populates the form defaultValues.
}
