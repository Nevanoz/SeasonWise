# MusimAman — Frontend Blueprint

## 1. Objective dan stack

Bangun pengalaman mobile-first yang memungkinkan pengguna menyelesaikan simulasi tanpa akun atau network. Stack: Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui, React Hook Form, Zod, Recharts, Zustand hanya untuk cross-route draft state, Vitest, dan Playwright.

Target: Android Chrome, iPhone Safari, desktop Chrome; WCAG 2.2 AA. Bahasa UI utama Bahasa Indonesia. Code identifiers tetap English.

## 2. Route structure

```text
/
/demo
/plans/new
/plans/[planId]/edit
/plans/[planId]/results
/plans/[planId]/compare
/plans/[planId]/report
/saved
/auth/sign-in
/auth/sign-up
/auth/callback
/privacy
/disclaimer
```

- `/` adalah Server Component untuk landing dan source/disclaimer summary.
- Flow, charts, scenario toggles, local storage, dan chat adalah Client Components.
- `/saved` melakukan server session check, lalu Client Component menangani local/cloud tabs.
- `/report` membaca current snapshot, tidak melakukan calculation baru saat print.
- `/demo` membuat deep clone seed, menyimpan sebagai local guest plan, lalu redirect ke result.

## 3. Component hierarchy

```text
AppShell
├── Header / ConnectivityBadge / DataStatusBadge
├── LandingHero / TryDemoButton
├── PlanWizard
│   ├── WizardProgress
│   ├── FarmHouseholdStep
│   │   ├── RegionFields
│   │   ├── CropTemplatePicker
│   │   ├── CropTimeline
│   │   ├── CashFlowItemList
│   │   └── HouseholdExpenseFields
│   ├── FinancingStep
│   │   ├── FinancingStructurePicker
│   │   ├── RatePeriodFields
│   │   └── RepaymentPreview
│   └── ReviewStep
├── ResultsDashboard
│   ├── ResilienceStatus
│   ├── CashFlowChart
│   ├── MetricCards
│   ├── MonthlyLedgerTable
│   ├── ScenarioControls
│   ├── RiskFactorBreakdown
│   ├── ExternalDataPanel
│   └── ChatPanel
├── FinancingComparison
├── SavedPlanList
└── PrintReport
```

## 4. Primary flow

### Step 1 — Farm and household plan

Satu halaman dengan collapsible sections:

1. Location: `provinceCode`, `regencyCode`, optional `districtCode`; GPS tidak digunakan.
2. Crop template: rice, corn, chili, coffee, palm oil.
3. Planting/harvest dates dan editable phases.
4. Expected quantity, unit, editable selling price, computed expected harvest income.
5. Repeatable production costs dan additional incomes.
6. Monthly minimum household expense, opening balance, emergency reserve.

### Step 2 — Financing

Masukkan satu primary option dan optional comparison option. Tampilkan contoh label “12% per tahun”, bukan “12%” saja. `ratePeriod` wajib dipilih. Tampilkan preview total interest dan payment dates dari shared engine.

### Step 3 — Results and comparison

Default membuka expected mode. User mengaktifkan delayed harvest, reduced income, dan increased inputs sendiri. Setiap status menunjukkan angka sumber dan disclaimer.

## 5. State ownership

- React Hook Form: raw editable form state per wizard.
- Zod resolver: immediate field validation dan cross-field validation.
- Zustand `usePlanDraftStore`: current draft id, wizard progress, unsaved flag, active scenario, comparison selection. Jangan simpan calculation logic.
- `GuestPlanRepository`: versioned local persistence.
- React Query atau lightweight fetch wrapper: external data, chat, cloud CRUD. Jika menambah React Query terlalu lambat, gunakan typed `fetch` + local state.
- Derived results: `useMemo(() => calculatePlan(normalizedInput))`; tidak disimpan sebagai editable state.
- Supabase session: cookie-based server/client helpers.

## 6. Form contracts

Gunakan schemas dari `@musimaman/validation`:

```ts
type CurrencyRupiah = number; // integer, safe integer, >= 0

interface CashFlowItemForm {
  id: string;
  type: "income" | "production_expense";
  category: string;
  amountRupiah: number;
  timingDate: string; // YYYY-MM-DD
  description?: string;
  isHarvestIncome?: boolean;
}

interface PlanFormValues {
  schemaVersion: 1;
  title: string;
  region: RegionSelection;
  cropPlan: CropPlanInput;
  cashFlowItems: CashFlowItemForm[];
  monthlyHouseholdExpenseRupiah: number;
  openingBalanceRupiah: number;
  emergencyReserveRupiah: number;
  financingOptions: FinancingOptionInput[];
  notes?: string;
}
```

Cross-field rules:

- harvest date > planting date;
- cash-flow item date berada dalam display horizon;
- at least one harvest income;
- financing start and first repayment within supported horizon;
- exactly one or two active financing options for MVP;
- `amountRupiah` dan principal adalah safe integers;
- rate `bps` integer 0–100000; UI percent dikonversi satu kali;
- bullet has one installment; monthly flat has `numberOfInstallments >= 1`.

## 7. Chart contract

```ts
interface CashFlowChartPoint {
  month: string; // YYYY-MM
  incomeRupiah: number;
  financingInflowRupiah: number;
  productionExpenseRupiah: number;
  householdExpenseRupiah: number;
  financingPaymentRupiah: number;
  netCashFlowRupiah: number;
  runningBalanceRupiah: number;
  isCashGap: boolean;
}
```

Recharts:

- bars: income dan total outflow;
- line: running balance;
- horizontal zero line;
- patterned/red-outline cash-gap region, tidak mengandalkan warna;
- accessible summary di atas chart: “Saldo terendah -Rp… pada …”.
- table equivalent selalu tersedia di bawah chart.

## 8. Guest storage

Key:

```text
musimaman:guest-plans:v1
musimaman:active-plan-id
musimaman:demo-data-version
```

Envelope:

```ts
interface LocalPlanEnvelope {
  storageVersion: 1;
  plan: PlanInput;
  updatedAt: string;
  lastResult?: CalculationSnapshot;
}
```

Behavior:

- debounce save 500 ms setelah valid partial form;
- validate on read; corrupt records dipindahkan ke `musimaman:quarantine:v1`;
- maksimal 10 guest plans;
- “Save to cloud” menampilkan consent summary sebelum request;
- local plan tidak dihapus otomatis setelah migration;
- browser storage unavailable → in-memory mode dengan warning.

## 9. Authentication UI

Gunakan email/password untuk demo reliability. Sign-up fields hanya email dan password; nama/telepon tidak wajib. Auth callback tetap tersedia jika magic link diaktifkan kemudian.

States: idle, submitting, invalid credentials, email confirmation required, session expired, offline. Setelah login, tawarkan “Salin rencana lokal ke akun” dan jangan menjalankan migration tanpa confirmation.

## 10. External-data panel

Render `DataStatusBadge` untuk `live`, `cached`, `mock`, `unavailable`. Selalu tampilkan:

- source dan attribution;
- region dan commodity;
- value/unit bila ada;
- `dataDate`;
- `lastCheckedAt`;
- warning bila stale;
- tombol “Gunakan sebagai asumsi” yang hanya mengisi field setelah confirmation.

Market price hanya menyarankan editable selling price. Tidak ada silent mutation.

## 11. AI chat UI

- Chat ditutup secara default pada mobile.
- Sebelum pertama kali memakai chat, jelaskan current plan summary akan dikirim ke Groq melalui backend.
- Chat history hanya `sessionStorage`; clear on tab close.
- Render plain text only; no raw HTML/Markdown execution.
- Show referenced sections chips dan disclaimer bila `disclaimerRequired`.
- Timeout/error/rate limit → deterministic explanation button.
- Out-of-scope response tetap tampil sebagai normal assistant message.

## 12. Print

`/report` menggunakan `@media print`:

- A4, 12–14 mm margins, hide nav/chat/buttons;
- avoid page breaks within metric cards dan monthly table rows;
- show report timestamp, engine/config versions, external data statuses;
- anonymous identifier optional; no email, phone, exact village by default;
- force light background and visible chart/table;
- test Chrome print-to-PDF; Safari uses simplified table.

## 13. Responsive dan accessibility

- Base width 320 px; main form max-width 720 px; results max-width 1200 px.
- Touch targets minimum 44×44 px.
- Labels persist; placeholder bukan label.
- Error linked with `aria-describedby`; summary moves focus to first invalid field.
- Wizard supports keyboard; focus heading after navigation.
- Status uses icon, text, and color.
- Currency inputs accept digits, show formatted display on blur, store integer.
- Respect `prefers-reduced-motion`.
- Plain-language helper under interest period, bullet repayment, cash gap, and simulation.

## 14. Error and fallback behavior

| Failure | UI response |
|---|---|
| API offline | Calculator tetap aktif; cloud/chat/external panel show offline |
| Market-price timeout | Cached then mock; source status visible |
| Price unavailable | Editable manual field; dated fallback card |
| Groq timeout/429 | Template explanation |
| Supabase unavailable | Guest save; cloud action retryable |
| Invalid local data | Quarantine and recovery notice |
| Engine validation error | No result; field-level correction links |

## 15. Task acceptance

### Application shell

- **Objective:** navigable, responsive shell.
- **Priority/owner:** P0, frontend.
- **Input/output:** routes/design tokens → accessible layout.
- **Dependencies:** none.
- **Acceptance/DoD:** 320 px–desktop, keyboard navigation, fallback boundary.
- **Risk/fallback:** styling delay → use default shadcn tokens.

### Plan wizard

- **Objective:** valid `PlanInput`.
- **Priority/owner:** P0, frontend.
- **Dependencies:** shared schemas/templates.
- **Acceptance/DoD:** all five crops editable; repeatable items; no invalid currency/date submission.
- **Risk/fallback:** long form → collapsible sections, prefilled demo.

### Results and scenarios

- **Objective:** explain engine output.
- **Priority/owner:** P0, frontend/shared.
- **Acceptance/DoD:** chart/table/metrics match engine snapshot; combined scenarios work.
- **Fallback:** table-only if chart blocks progress.

### Saved plans

- **Objective:** guest and authenticated persistence.
- **Priority/owner:** P0, both.
- **Acceptance/DoD:** create/list/open/update/duplicate/delete/migrate.
- **Fallback:** cloud basic CRUD; no advanced filters.

### Print and demo

- **Objective:** reliable judging flow.
- **Priority/owner:** P0, frontend/shared.
- **Acceptance/DoD:** one-click seed, visible “synthetic”, print contains required sections.
- **Fallback:** static chart screenshot plus live numeric table only if print chart fails.
