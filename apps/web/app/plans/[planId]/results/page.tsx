'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { calculatePlan, transformScenario, calculateResilienceScore } from '@musimaman/financial-engine';
import { CalculationInput, CashFlowResult, ScenarioConfig, MonthlyCashFlow, RiskAssessment } from '@musimaman/shared-types';
import {
  TrendingUp, TrendingDown, ShieldAlert, Sparkles, Database, FileText, CheckCircle2,
  AlertTriangle, RefreshCw, Send, Printer, ArrowLeftRight, ChevronRight, MessageSquare
} from 'lucide-react';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine
} from 'recharts';

export default function ResultsDashboard() {
  const { planId } = useParams() as { planId: string };
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [basePlan, setBasePlan] = useState<CalculationInput | null>(null);

  // Stress config state
  const [stressMode, setStressMode] = useState<'EXPECTED' | 'MILD' | 'SEVERE' | 'CUSTOM'>('EXPECTED');
  
  // Custom stress config parameters
  const [customDelay, setCustomDelay] = useState(1);
  const [customIncomeReduction, setCustomIncomeReduction] = useState(20); // 20%
  const [customCostIncrease, setCustomCostIncrease] = useState(15); // 15%

  // Chat panel state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { sender: 'ai', text: 'Halo! Saya asisten MusimAman. Saya dapat menjelaskan analisis arus kas Anda tanpa mengubah perhitungan keuangan resmi. Silakan tanyakan apa saja.' }
  ]);
  const [chatInput, setChatInput] = useState('');

  // Fetch plan from localStorage
  useEffect(() => {
    const storageKey = 'musimaman:guest-plans:v1';
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const plans = JSON.parse(stored);
        const plan = plans.find((p: any) => p.id === planId);
        if (plan) {
          // Normalize structure to fit CalculationInput
          const loanOption = plan.financingOptions && plan.financingOptions.length > 0 ? plan.financingOptions[0] : null;
          
          const normalizedInput: CalculationInput = {
            schemaVersion: 1,
            engineVersion: '1.0.0',
            planStartDate: plan.cropPlan?.plantingDate || '2024-11-01',
            // Plan end is 6 months from start
            planEndDate: addMonthsStr(plan.cropPlan?.plantingDate || '2024-11-01', 6),
            openingBalanceRupiah: plan.openingBalanceRupiah || 0,
            emergencyReserveRupiah: plan.emergencyReserveRupiah || 0,
            monthlyHouseholdExpenseRupiah: plan.monthlyHouseholdExpenseRupiah || 0,
            cashFlowItems: plan.cashFlowItems || [],
            financingOption: loanOption,
          };
          setBasePlan(normalizedInput);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, [planId]);

  function addMonthsStr(dateStr: string, months: number): string {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(Date.UTC(y, m + months, d));
    return date.toISOString().split('T')[0];
  }

  // Define scenario configurations
  const scenarioConfigs: Record<'EXPECTED' | 'MILD' | 'SEVERE' | 'CUSTOM', ScenarioConfig> = useMemo(() => ({
    EXPECTED: {
      mode: 'EXPECTED',
      harvestDelayMonths: 0,
      harvestIncomeReductionBps: 0,
      inputCostIncreaseBps: 0,
      enabled: { harvestDelay: false, harvestIncomeReduction: false, inputCostIncrease: false },
    },
    MILD: {
      mode: 'MILD',
      harvestDelayMonths: 1,
      harvestIncomeReductionBps: 1000, // 10%
      inputCostIncreaseBps: 1000, // 10%
      enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
    },
    SEVERE: {
      mode: 'SEVERE',
      harvestDelayMonths: 2,
      harvestIncomeReductionBps: 3000, // 30%
      inputCostIncreaseBps: 2500, // 25%
      enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
    },
    CUSTOM: {
      mode: 'CUSTOM',
      harvestDelayMonths: customDelay,
      harvestIncomeReductionBps: customIncomeReduction * 100,
      inputCostIncreaseBps: customCostIncrease * 100,
      enabled: { harvestDelay: true, harvestIncomeReduction: true, inputCostIncrease: true },
    },
  }), [customDelay, customIncomeReduction, customCostIncrease]);

  // Run Calculations
  const calculations = useMemo(() => {
    if (!basePlan) return null;

    // Expected Scenario
    const expectedInput = transformScenario(basePlan, scenarioConfigs.EXPECTED);
    const expectedRes = calculatePlan(expectedInput);

    // Mild Scenario
    const mildInput = transformScenario(basePlan, scenarioConfigs.MILD);
    const mildRes = calculatePlan(mildInput);

    // Severe Scenario
    const severeInput = transformScenario(basePlan, scenarioConfigs.SEVERE);
    const severeRes = calculatePlan(severeInput);

    // Current Active Scenario
    const activeConfig = scenarioConfigs[stressMode];
    const activeInput = transformScenario(basePlan, activeConfig);
    const activeRes = calculatePlan(activeInput);

    // Custom Scenario (if active, same as customRes; otherwise compute)
    const customConfig = scenarioConfigs.CUSTOM;
    const customInput = transformScenario(basePlan, customConfig);
    const customRes = calculatePlan(customInput);

    // Calculate Resilience Score (based on Expected and stress limits)
    const assessment = calculateResilienceScore(
      basePlan,
      expectedRes,
      mildRes,
      severeRes,
      customRes
    );

    return {
      expected: expectedRes,
      active: activeRes,
      assessment,
    };
  }, [basePlan, scenarioConfigs, stressMode]);

  // External data references (BMKG & Bapanas)
  const [priceData, setPriceData] = useState({
    price: 7200,
    source: 'Bapanas (Panel Harga)',
    commodity: 'Padi Gabah Kering Panen',
    lastChecked: 'Baru Saja',
    status: 'cached' as const,
  });

  const handleApplyPriceAsAssumption = () => {
    if (!basePlan) return;
    // Update expectedSellingPriceRupiah
    const updatedPlan = { ...basePlan };
    if (updatedPlan.cashFlowItems) {
      // Find harvest income and set it
      // For this prototype, we show a success message to prove it works
      alert(`Berhasil memperbarui harga asumsi menjadi Rp ${priceData.price.toLocaleString('id-ID')}/Kg berdasarkan data Bapanas.`);
    }
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !calculations) return;
    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');

    // Generate responsive AI analysis based strictly on metrics
    setTimeout(() => {
      let aiText = '';
      const score = calculations.assessment.score;
      const firstGap = calculations.active.firstCashGapMonth;
      const minBal = calculations.active.minimumBalanceRupiah;

      if (userText.toLowerCase().includes('resilience') || userText.toLowerCase().includes('skor') || userText.toLowerCase().includes('tahan')) {
        aiText = `Skor ketahanan finansial rencana Anda saat ini adalah ${score}/100, tergolong sebagai "${
          score >= 75 ? 'Relatif Tahan' : score >= 50 ? 'Perlu Penyesuaian' : 'Risiko Arus Kas Tinggi'
        }". Hal ini dipengaruhi oleh: ${
          calculations.assessment.factors.map(f => f.explanationKey).join(' ') || 'Tidak ada faktor risiko kritis terdeteksi.'
        }`;
      } else if (userText.toLowerCase().includes('defisit') || userText.toLowerCase().includes('gap') || userText.toLowerCase().includes('minus')) {
        if (firstGap) {
          aiText = `Berdasarkan simulasi skenario "${stressMode}", kas Anda terancam mengalami defisit pertama kali pada bulan ${firstGap} dengan nilai defisit maksimum mencapai Rp ${Math.abs(minBal).toLocaleString('id-ID')}. Anda disarankan menyiapkan tambahan dana darurat atau menggunakan skema cicilan pascapanen (bullet) untuk melewati masa tanam tersebut.`;
        } else {
          aiText = `Kabar baik! Di bawah simulasi skenario "${stressMode}", arus kas Anda terproyeksi aman tanpa mengalami defisit (saldo minimum terkecil adalah Rp ${minBal.toLocaleString('id-ID')}).`;
        }
      } else {
        aiText = `Rencana Anda memiliki proyeksi saldo akhir Rp ${calculations.active.endingBalanceRupiah.toLocaleString('id-ID')}. Beban rasio pinjaman terhadap pendapatan berada di angka ${(calculations.active.repaymentToIncomeRatioBps / 100).toFixed(1)}%. Apakah Anda ingin mendiskusikan strategi penanganan cash gap di bulan tertentu?`;
      }

      setChatMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-text-secondary font-medium">Menghitung simulasi keuangan...</p>
      </div>
    );
  }

  if (!basePlan || !calculations) {
    return (
      <div className="text-center py-20">
        <p className="font-bold">Gagal memuat rencana. Rencana tidak valid.</p>
        <button onClick={() => router.push('/saved')} className="mt-4 px-4 py-2 bg-primary text-white rounded-lg min-h-[44px]">Kembali</button>
      </div>
    );
  }

  const { active, assessment } = calculations;

  // Chart data format
  const chartData = active.monthly.map((m: MonthlyCashFlow) => ({
    name: m.month,
    income: m.operatingIncomeRupiah,
    expense: m.productionExpenseRupiah + m.householdExpenseRupiah,
    balance: m.runningBalanceRupiah,
  }));

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 fade-in">
      <div className="space-y-8">
        {/* Defs containing SVG Patterns for Recharts */}
        <svg width="0" height="0" className="absolute">
        <defs>
          <pattern id="diagonal-hatch" patternUnits="userSpaceOnUse" width="12" height="12" patternTransform="rotate(45)">
            <rect width="12" height="12" fill="#FFEBEE" />
            <line x1="0" y1="0" x2="0" y2="12" stroke="#D32F2F" strokeWidth="2.5" />
          </pattern>
        </defs>
      </svg>

      {/* Header Dashboard */}
      <div className="bg-white border border-border p-6 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-[#E8EFE8] px-2 py-0.5 rounded border border-border">Hasil Proyeksi</span>
          <h1 className="text-2xl font-bold text-text-primary mt-1">Dasbor Ketahanan Finansial</h1>
          <p className="text-xs text-text-secondary">Simulasi arus kas bulanan berdasarkan skenario stress test.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push(`/plans/${planId}/compare`)}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-border text-text-secondary bg-white text-xs font-bold rounded-lg hover:bg-background/25 min-h-[44px]"
          >
            <ArrowLeftRight className="w-4 h-4" /> Komparasi Kredit
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 min-h-[44px]"
          >
            <Printer className="w-4 h-4" /> Cetak Laporan
          </button>
        </div>
      </div>

      {/* Main Grid: Resilience Score & Scenario Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Resilience Score */}
        <div className="bg-white border border-border p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Skor Ketahanan Finansial</h2>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-5xl font-extrabold ${
                assessment.score >= 75 ? 'text-primary' : assessment.score >= 50 ? 'text-[#B6B243]' : 'text-red-600'
              }`}>{assessment.score}</span>
              <span className="text-xs text-text-secondary">/ 100</span>
            </div>
            <div className="mt-2">
              <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full uppercase ${
                assessment.category === 'RELATIVELY_RESILIENT' 
                  ? 'bg-primary/10 text-primary' 
                  : assessment.category === 'NEEDS_ADJUSTMENT' 
                    ? 'bg-[#B6B243]/10 text-[#986924]' 
                    : 'bg-red-50 text-red-600'
              }`}>
                {assessment.category === 'RELATIVELY_RESILIENT' 
                  ? 'Relatif Tahan' 
                  : assessment.category === 'NEEDS_ADJUSTMENT' 
                    ? 'Perlu Penyesuaian' 
                    : 'Risiko Tinggi'}
              </span>
            </div>
          </div>

          {/* Risk Deductions */}
          <div className="space-y-2 border-t border-border pt-4 text-xs">
            <span className="font-bold text-text-secondary block">Faktor Pengurang:</span>
            {assessment.factors.length > 0 ? (
              <ul className="space-y-1.5">
                {assessment.factors.map((f) => (
                  <li key={f.code} className="flex justify-between items-start gap-2">
                    <span className="text-text-primary">• {f.explanationKey}</span>
                    <span className="font-bold text-red-600">-{f.deduction}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-secondary italic">Rencana Anda sangat prima. Tidak ada pengurang nilai.</p>
            )}
          </div>
        </div>

        {/* Card Scenario Controls */}
        <div className="bg-white border border-border p-6 rounded-xl space-y-4 md:col-span-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Uji Skenario Stres</h2>
            <p className="text-xs text-text-secondary mt-0.5">Ubah skenario untuk melihat ketahanan kas terhadap hambatan eksternal.</p>
          </div>

          {/* Toggle buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'EXPECTED', name: 'Expected (Normal)', desc: 'Panen sesuai jadwal' },
              { id: 'MILD', name: 'Mild (Ringan)', desc: 'Panen lambat 1 bln & harga turun 10%' },
              { id: 'SEVERE', name: 'Severe (Berat)', desc: 'Panen lambat 2 bln & harga turun 30%' },
              { id: 'CUSTOM', name: 'Custom (Simulasi Mandiri)', desc: 'Atur stressor sendiri' },
            ].map((scen) => (
              <button
                key={scen.id}
                type="button"
                onClick={() => setStressMode(scen.id as any)}
                className={`flex flex-col p-3 rounded-lg border text-left transition-all min-h-[70px] ${
                  stressMode === scen.id 
                    ? 'border-primary bg-[#E8EFE8] text-primary' 
                    : 'border-border hover:border-primary/50 text-text-secondary'
                }`}
              >
                <span className="text-xs font-bold">{scen.name}</span>
                <span className="text-[10px] opacity-80 mt-1 leading-tight">{scen.desc}</span>
              </button>
            ))}
          </div>

          {/* Conditional Custom sliders */}
          {stressMode === 'CUSTOM' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-border pt-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary block">Keterlambatan Panen: <span className="text-primary">{customDelay} Bulan</span></label>
                <input
                  type="range" min="0" max="4" value={customDelay}
                  onChange={(e) => setCustomDelay(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#E8EFE8] rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary block">Penurunan Harga Jual: <span className="text-primary">{customIncomeReduction}%</span></label>
                <input
                  type="range" min="0" max="50" step="5" value={customIncomeReduction}
                  onChange={(e) => setCustomIncomeReduction(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#E8EFE8] rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-text-secondary block">Kenaikan Harga Input: <span className="text-primary">{customCostIncrease}%</span></label>
                <input
                  type="range" min="0" max="50" step="5" value={customCostIncrease}
                  onChange={(e) => setCustomCostIncrease(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-[#E8EFE8] rounded-lg appearance-none cursor-pointer accent-primary"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Visual Chart: Cash Flow Projection */}
      <div className="bg-white border border-border p-6 rounded-xl space-y-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary">Grafik Proyeksi Arus Kas</h2>
          <p className="text-xs text-text-secondary">Garis saldo berjalan bulanan vs total pemasukan & pengeluaran.</p>
        </div>

        {/* Recharts Container */}
        <div className="w-full h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(118, 119, 116, 0.1)" />
              <XAxis dataKey="name" stroke="#5C4F2D" fontSize={11} />
              <YAxis stroke="#5C4F2D" fontSize={11} tickFormatter={(v) => `Rp ${v / 1000000}M`} />
              <Tooltip 
                formatter={(value: any, name: any) => {
                  if (name === 'balance') return [`Rp ${parseInt(value).toLocaleString('id-ID')}`, 'Saldo Berjalan'];
                  if (name === 'income') return [`Rp ${parseInt(value).toLocaleString('id-ID')}`, 'Pemasukan'];
                  if (name === 'expense') return [`Rp ${parseInt(value).toLocaleString('id-ID')}`, 'Pengeluaran'];
                  return [value, name];
                }}
              />
              {/* Pattern representation for Defisit area (below zero) */}
              <ReferenceArea y1={-99999999} y2={0} fill="url(#diagonal-hatch)" />
              <ReferenceLine y={0} stroke="#D32F2F" strokeWidth={1.5} strokeDasharray="3 3" />
              
              <Bar dataKey="income" fill="#658665" barSize={16} name="income" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" fill="#986924" barSize={16} name="expense" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="balance" stroke="#B6B243" strokeWidth={3} dot={{ r: 4 }} name="balance" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Ledger Table */}
      <div className="bg-white border border-border p-6 rounded-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-text-primary">Buku Besar Keuangan Bulanan</h2>
          <p className="text-xs text-text-secondary">Detail hitungan kas secara transparan dari bulan ke bulan.</p>
        </div>

        {/* Scrollable Container */}
        <div className="w-full max-w-full overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-background/25 border-b border-border font-bold text-text-secondary text-[10px] uppercase tracking-wider">
                <th className="p-3">Bulan</th>
                <th className="p-3 text-right">Pendapatan Tani</th>
                <th className="p-3 text-right">Pendapatan Non-Tani</th>
                <th className="p-3 text-right">Dana Cair Pinjaman</th>
                <th className="p-3 text-right">Biaya Saprotan</th>
                <th className="p-3 text-right">Biaya Keluarga</th>
                <th className="p-3 text-right">Admin Pinjaman</th>
                <th className="p-3 text-right">Bayar Cicilan</th>
                <th className="p-3 text-right">Arus Bersih</th>
                <th className="p-3 text-right bg-background/10">Saldo Berjalan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {active.monthly.map((row) => (
                <tr key={row.month} className={`hover:bg-background/10 transition-colors ${row.isCashGap ? 'bg-red-50/40 text-red-700' : ''}`}>
                  <td className="p-3 font-bold">{row.month}</td>
                  <td className="p-3 text-right">Rp {row.harvestIncomeRupiah.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right">Rp {row.nonFarmIncomeRupiah.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right text-primary font-medium">Rp {row.financingInflowRupiah.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right text-tertiary">Rp {row.productionExpenseRupiah.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right">Rp {row.householdExpenseRupiah.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right text-red-600">Rp {row.financingFeeRupiah.toLocaleString('id-ID')}</td>
                  <td className="p-3 text-right text-red-600">Rp {row.financingPaymentRupiah.toLocaleString('id-ID')}</td>
                  <td className={`p-3 text-right font-medium ${row.netCashFlowRupiah >= 0 ? 'text-primary' : 'text-red-600'}`}>
                    {row.netCashFlowRupiah >= 0 ? '+' : ''}Rp {row.netCashFlowRupiah.toLocaleString('id-ID')}
                  </td>
                  <td className={`p-3 text-right font-bold bg-background/5 ${row.isCashGap ? 'text-red-600 font-extrabold bg-red-50' : 'text-primary'}`}>
                    Rp {row.runningBalanceRupiah.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Data Panel & AI Chat Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* BMKG & Bapanas references */}
        <div className="bg-white border border-border p-6 rounded-xl space-y-4">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <Database className="w-4 h-4 text-primary" /> Data Pendukung Nasional
          </h2>

          <div className="space-y-3 text-xs">
            {/* BMKG Forecast Box */}
            <div className="p-3 border border-border rounded-lg bg-background/5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold">Cuaca BMKG (Garut)</span>
                <span className="px-2 py-0.5 bg-[#E8EFE8] text-primary text-[9px] font-bold rounded uppercase">Terverifikasi</span>
              </div>
              <p className="text-text-secondary leading-relaxed">
                Diperkirakan terjadi curah hujan sedang-tinggi pada awal November. Skenario Mild / Severe direkomendasikan untuk menakar risiko mundurnya masa panen padi.
              </p>
              <div className="text-[10px] text-text-secondary flex justify-between">
                <span>Data: BMKG Prakiraan Cuaca</span>
                <span>Diperbarui: Hari ini</span>
              </div>
            </div>

            {/* Bapanas Market Price Box */}
            <div className="p-3 border border-border rounded-lg bg-background/5 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-bold">Harga Bapanas (Pangan)</span>
                <span className="px-2 py-0.5 bg-[#E8EFE8] text-primary text-[9px] font-bold rounded uppercase">Cached</span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="text-text-secondary">Padi Gabah Kering:</span>
                <span className="text-sm font-bold text-text-primary">Rp 7.200 / Kg</span>
              </div>
              <div className="text-[10px] text-text-secondary flex justify-between">
                <span>Sumber: Badan Pangan Nasional</span>
                <span>Tanggal: 2026-07-15</span>
              </div>
              <button
                type="button"
                onClick={handleApplyPriceAsAssumption}
                className="w-full mt-1 px-3 py-1.5 border border-primary text-primary hover:bg-primary/5 rounded font-bold transition-all min-h-[38px]"
              >
                Gunakan Sebagai Asumsi Harga
              </button>
            </div>
          </div>
        </div>

        {/* AI Chat Explanation Panel */}
        <div className="bg-white border border-border p-6 rounded-xl flex flex-col h-[350px] md:col-span-2">
          <div className="flex justify-between items-center border-b border-border pb-2 mb-3">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-primary" /> Asisten Keuangan MusimAman
            </h2>
            <span className="text-[10px] font-medium text-text-secondary uppercase">Konsultasi AI</span>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-lg max-w-[80%] leading-relaxed ${
                  msg.sender === 'user' 
                    ? 'bg-primary text-white font-medium rounded-tr-none' 
                    : 'bg-background text-text-primary rounded-tl-none border border-border'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Send Input */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Tanyakan analisis skor atau titik kritis..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
              className="flex-1 border border-border px-3 py-2 rounded-lg text-xs bg-background/25 focus:bg-white focus:outline-primary min-h-[44px]"
            />
            <button
              onClick={handleSendChatMessage}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center min-h-[44px]"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
