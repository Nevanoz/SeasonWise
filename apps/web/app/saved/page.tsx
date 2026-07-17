'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Trash2, Copy, Edit3, ArrowRight, Eye, ShieldAlert, Cloud, Info } from 'lucide-react';
import { deleteGuestPlan, duplicateGuestPlan, loadGuestPlans, type StoredPlan } from '../../lib/guest-plans';
import { apiRequest, toBackendPlan, type CloudPlanList, type CloudPlanSummary } from '../../lib/api';

export default function SavedPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'local' | 'cloud'>('local');
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [cloudPlans, setCloudPlans] = useState<CloudPlanSummary[]>([]);
  const [cloudStatus, setCloudStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    loadLocalPlans();
  }, []);
  useEffect(() => {
    if (activeTab === 'cloud') void loadCloudPlans();
  }, [activeTab]);


  const loadLocalPlans = () => {
    setPlans(loadGuestPlans());
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus rencana simulasi ini?')) return;
    deleteGuestPlan(id);
    loadLocalPlans();
  };

  const handleDuplicatePlan = (plan: StoredPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    duplicateGuestPlan(plan.id);
    loadLocalPlans();
  };

  const loadCloudPlans = async () => {
    setCloudStatus('loading');
    try {
      const data = await apiRequest<CloudPlanList>('/plans');
      setCloudPlans(data.plans);
      setCloudStatus('idle');
    } catch {
      setCloudStatus('error');
    }
  };

  const handleMigrateToCloud = async () => {
    if (!consentChecked) {
      alert('Anda harus memberikan izin persetujuan pemindahan data terlebih dahulu.');
      return;
    }
    setCloudStatus('loading');
    try {
      for (const plan of plans as StoredPlan[]) {
        await apiRequest('/plans', { method: 'POST', body: JSON.stringify({ plan: toBackendPlan(plan), source: 'guest_migration' }) });
      }
      await loadCloudPlans();
      setShowConsentModal(false);
      setConsentChecked(false);
      setActiveTab('cloud');
    } catch (error) {
      setCloudStatus('error');
      alert(error instanceof Error ? error.message : 'Migrasi cloud gagal.');
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="space-y-8">
        {/* Header */}
        <div className="bg-white border border-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Daftar Rencana Keuangan Anda</h1>
          <p className="text-xs text-text-secondary mt-0.5">Kelola rencana simulasi pertanian dan pinjaman yang telah Anda buat.</p>
        </div>
        <button
          onClick={() => router.push('/plans/new')}
          className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 min-h-[44px]"
        >
          Buat Rencana Baru
        </button>
      </div>

      {/* Cloud Migration Promo Banner */}
      {plans.length > 0 && activeTab === 'local' && (
        <div className="bg-white border border-primary/20 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#E8EFE8] text-primary rounded-lg">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-text-primary">Amankan data Anda ke Cloud</h2>
              <p className="text-xs text-text-secondary mt-0.5">Sinkronisasikan rencana lokal Anda agar dapat diakses di perangkat lain kapan saja.</p>
            </div>
          </div>
          <button
            onClick={() => setShowConsentModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 min-h-[44px]"
          >
            Migrasikan ke Cloud <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setActiveTab('local')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'local' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Rencana Lokal (Guest - {plans.length})
        </button>
        <button
          onClick={() => setActiveTab('cloud')}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'cloud' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          Rencana Awan (Cloud - {cloudPlans.length})
        </button>
      </div>

      {/* Plans List */}
      {activeTab === 'local' ? (
        plans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                onClick={() => router.push(`/plans/${plan.id}/results`)}
                onKeyDown={(event) => { if (event.key === "Enter") router.push("/plans/" + plan.id + "/results"); }}
                role="link"
                tabIndex={0}
                className="bg-white border border-border p-6 rounded-xl hover:border-primary transition-colors duration-300 cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start gap-2">
                    <h3 className="font-bold text-text-primary text-sm line-clamp-1">{plan.title}</h3>
                    <span className="px-2 py-0.5 bg-[#E8EFE8] text-primary text-[9px] font-bold rounded uppercase">
                      {plan.cropPlan?.cropType}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                    {plan.notes || 'Tidak ada deskripsi catatan.'}
                  </p>
                  <p className="text-[10px] text-text-secondary">
                    Terakhir diubah: {new Date(plan.updatedAt || '').toLocaleDateString('id-ID')}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center border-t border-border pt-4 mt-2">
                  <span className="text-xs font-semibold text-primary flex items-center gap-1">
                    Lihat Hasil <Eye className="w-3.5 h-3.5" />
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/plans/${plan.id}/edit`);
                      }}
                      className="min-h-[44px] min-w-[44px] p-2 border border-border rounded-lg bg-white text-text-secondary hover:bg-background/25"
                      aria-label="Edit rencana" title="Edit Data"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicatePlan(plan, e)}
                      className="min-h-[44px] min-w-[44px] p-2 border border-border rounded-lg bg-white text-text-secondary hover:bg-background/25"
                      aria-label="Duplikat rencana" title="Duplikat"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeletePlan(plan.id, e)}
                      className="min-h-[44px] min-w-[44px] p-2 border border-border rounded-lg bg-white text-red-600 hover:bg-red-50"
                      aria-label="Hapus rencana" title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-border p-12 rounded-xl text-center space-y-4">
            <Info className="w-12 h-12 text-text-secondary opacity-40 mx-auto" />
            <h3 className="font-bold text-text-primary text-sm">Belum Ada Rencana Tersimpan</h3>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              Simulasi yang Anda buat sebagai tamu akan muncul di sini. Mulailah simulasi pertama Anda sekarang.
            </p>
            <button
              onClick={() => router.push('/plans/new')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold min-h-[44px]"
            >
              Buat Rencana Baru
            </button>
          </div>
        )
      ) : (
        <div className="bg-white border border-border p-8 rounded-xl space-y-4">
          <Cloud className="w-10 h-10 text-primary mx-auto" />
          {cloudStatus === 'loading' ? (
            <p role="status" className="text-center text-xs text-text-secondary">Memuat rencana cloud...</p>
          ) : cloudStatus === 'error' ? (
            <div className="text-center space-y-3">
              <p role="alert" className="text-xs text-red-700">Masuk terlebih dahulu atau periksa koneksi backend.</p>
              <button onClick={() => router.push('/auth/sign-in')} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold min-h-[44px]">Masuk Akun</button>
            </div>
          ) : cloudPlans.length ? (
            <div className="divide-y divide-border">
              {cloudPlans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between gap-4 py-4">
                  <div><h3 className="text-sm font-bold text-text-primary">{plan.title}</h3><p className="text-xs text-text-secondary">Diperbarui {new Date(plan.updated_at).toLocaleDateString('id-ID')}</p></div>
                  <span className="rounded-full bg-[#E8EFE8] px-3 py-1 text-[10px] font-bold uppercase text-primary">Cloud</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-xs text-text-secondary">Belum ada rencana cloud. Migrasikan rencana lokal setelah masuk.</p>
          )}
        </div>
      )}

      {/* Consent Modal Dialog */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="consent-title" className="bg-white border border-border p-6 rounded-xl max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-yellow-50 text-[#986924] rounded-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 id="consent-title" className="text-sm font-bold text-text-primary">Konfirmasi Izin Pemindahan</h3>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Semua rencana simulasi yang saat ini tersimpan di browser lokal Anda akan diunggah ke server cloud MusimAman. Tindakan ini memerlukan otentikasi akun.
                </p>
              </div>
            </div>

            {/* Explicit Checkbox (Accessibility constraint) */}
            <div className="flex items-start gap-2.5 p-3 bg-background/25 border border-border rounded-lg">
              <input
                id="consent-check"
                type="checkbox"
                checked={consentChecked}
                onChange={(e) => setConsentChecked(e.target.checked)}
                className="mt-0.5 w-4.5 h-4.5 rounded border-border focus:ring-primary accent-primary"
              />
              <label htmlFor="consent-check" className="text-xs text-text-primary leading-tight font-medium cursor-pointer">
                Saya memberikan persetujuan eksplisit untuk memindahkan data simulasi kas pertanian lokal saya ke server awan MusimAman.
              </label>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConsentModal(false)}
                className="px-4 py-2 text-xs font-bold border border-border rounded-lg bg-white text-text-secondary hover:bg-background/20 min-h-[44px]"
              >
                Batal
              </button>
              <button
                onClick={handleMigrateToCloud}
                disabled={!consentChecked}
                className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-lg hover:opacity-90 disabled:opacity-50 min-h-[44px]"
              >
                Setuju & Migrasikan
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}


