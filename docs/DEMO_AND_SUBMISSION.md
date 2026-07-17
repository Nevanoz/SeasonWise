# MusimAman — Demo and Submission

## 1. Seeded demo contract

Primary demo is synthetic and versioned. It represents:

- rice plan, four-month production cycle plus repayment display horizon;
- costs spread across land preparation, seed, fertilizer, labor, irrigation, transport;
- monthly household minimum expenses;
- opening balance and small emergency reserve;
- harvest income near cycle end;
- option A: flat monthly installments;
- option B: bullet/post-harvest repayment;
- expected scenario without a major gap;
- one-month harvest delay that causes a visible gap for option A;
- option B reducing or removing that timing gap.

Do not hand-edit displayed outputs. Adjust seed inputs, run engine, verify tests, then commit snapshot/checksum. All demo pages show **Data simulasi/sintetis**.

## 2. Two-minute script

| Time | Spoken narration | On-screen action | Expected visual | Live-API backup |
|---|---|---|---|---|
| 0:00–0:15 | “Pendapatan petani biasanya datang saat panen, tetapi biaya rumah tangga dan cicilan terus berjalan. Pinjaman yang terlihat terjangkau secara total masih dapat menimbulkan kekurangan kas sebelum panen.” | Landing page; point to seasonal timeline illustration | Problem and target user immediately clear | No API |
| 0:15–0:40 | “Kami buka contoh sintetis petani padi. Biaya produksi muncul di beberapa bulan, kebutuhan minimum rumah tangga dicatat tiap bulan, dan pendapatan utama masuk saat panen.” | Click **Coba Demo**; scroll crop timeline, costs, household expense, financing A | Four-month plan, rupiah amounts, synthetic badge | Seed is bundled in web |
| 0:40–0:58 | “Pada skenario yang diharapkan, rencana masih memiliki saldo minimum yang dapat dilihat di sini. Semua angka dihitung oleh deterministic TypeScript engine, bukan AI.” | Open result; highlight running-balance line, repayment markers, minimum balance | No major gap; engine/version visible | Browser engine |
| 0:58–1:20 | “Sekarang panen kami geser satu bulan. Ini simulasi, bukan prediksi. Kewajiban pembayaran tetap jatuh sebelum pendapatan panen, sehingga muncul gap.” | Enable **Panen terlambat 1 bulan**; show gap; ask chat “Mengapa gap terjadi?” | Chart crosses zero; first gap and max gap visible; concise explanation | If Groq fails click **Gunakan penjelasan berbasis aturan** |
| 1:20–1:40 | “Kami bandingkan struktur cicilan bulanan dengan pembayaran pascapanen. Jumlah dan waktu pembayaran terlihat transparan; MusimAman tidak memilih lender.” | Open comparison; focus worst-scenario gap and payment timing | Option B changes gap; reason codes visible | Local engine |
| 1:40–1:52 | “Referensi harga hanya memberi konteks. Sumber, tanggal, dan status live atau fallback selalu terlihat, dan pengguna sendiri yang memilih memasukkannya sebagai asumsi.” | External-data panel; data badges; open report preview | Attribution/timestamps/simulation warning/report | Show cached/mock cards |
| 1:52–2:00 | “MusimAman membantu petani memahami risiko musiman sebelum utang menjadi krisis.” | Return to concise impact screen/logo | Product name, value, repository/deployment QR if real links exist | No API |

Keep cursor movements slow and prepare tabs before recording. Do not show sign-up unless judging specifically asks; guest-first is a product advantage.

## 3. Backup demo

- Record a clean local/production screen capture before final submission.
- Keep `?demoOffline=1` restricted to development or obvious demo label; it forces mock external data and template chat.
- Keep screenshots of expected result, delayed gap, comparison, external status, and report.
- If production API fails, reload; browser engine and local seed still work.
- If Supabase fails, demonstrate guest save/reload.
- If all network fails, use locally served build or recorded video.

## 4. Devpost writing structure

### Inspiration

Mulai dari mismatch: income musiman, biaya dan repayment berkala. Jangan memakai unsupported national loss or default statistics.

### Problem

Jelaskan siapa pengguna, keputusan yang sulit, konsekuensi cash timing, dan mengapa generic monthly affordability tidak cukup.

### What MusimAman does

Three-step plan, deterministic cash flow, stress scenarios, financing timing comparison, external context, scoped explanation, print discussion sheet.

### How it works

Input → validation → shared financial engine → monthly ledger → metrics → prototype rules → optional Groq explanation. Tekankan bahwa AI bukan sumber angka.

### Why it is different

Agricultural seasonality, household minimum expenses, transparent timing gap, scenario combinations, and responsible external-data use.

### Indonesia focus

Bahasa Indonesia, rupiah integer, five crop templates, province/regency input, mobile-first/low-bandwidth guest mode, transparent price-source status, assisted use by cooperative staff.

### Architecture

Embed system diagram; Next.js/Vercel, Fastify/Railway, shared packages, Supabase, provider adapters, Groq proxy.

### Financial engine

Summarize flat/bullet assumptions, calendar-month ledger, cash-gap definition, integer rounding, versioned snapshots, exact tests.

### Stress scenarios

Describe delay, income reduction, input increase, combined/custom modes; explicitly say “simulation without probability”.

### AI usage

Groq only rewrites validated results; structured context, strict scope, number verifier, template fallback, no stored history by default.

### External data

For prices, name only the source actually integrated and state whether live/cached/mock. Never call mock data live.

### Responsible design

No approval, lender selection, yield-loss claim, or hidden score. Prototype thresholds are shown and require future expert validation.

### Technologies used

List exact dependencies and licenses from lockfile/source register.

### Challenges

Integer-safe formulas, timing semantics, low-literacy UX, provider instability, AI number control, and RLS.

### Accomplishments

Only shipped and tested capabilities; include test counts after they exist.

### What we learned

Explainability and timing matter more than adding a prediction model.

### Future development

Organizations, consent sharing, verified templates, more strategies/crops, historical data, expert thresholds, regional languages, offline sync—clearly future.

### Links

Add real repository, deployment, and video URLs only after available. Verify public access in incognito.

## 5. AI disclosure template

Replace bracketed content with actual tools and practices:

> Tim menggunakan [nama generative-AI tools] untuk membantu [brainstorming, drafting documentation, code suggestions, test-case generation]. Semua source code, architecture decisions, prompts, dan generated outputs ditinjau oleh anggota tim. Formula financial engine ditetapkan secara eksplisit dan diuji secara independen melalui unit tests serta manual calculation audit. AI bukan sumber angka keuangan. Groq hanya menerima structured, minimized context dan digunakan untuk menjelaskan hasil yang sudah dihitung oleh deterministic engine; ketika output tidak valid atau layanan gagal, MusimAman menggunakan deterministic explanation templates.

Also disclose model/provider names and whether AI-generated assets/code were used. Do not claim “no AI” if coding assistants were used.

## 6. Source and license register

Create `docs/SOURCES.md` with:

| Resource | Purpose | URL/version | License/terms | Access date | Shipped status |
|---|---|---|---|---|---|
| Bapanas/BPS/etc. | Price reference | Exact dataset | Verified terms | YYYY-MM-DD | live/snapshot/not used |
| Groq | Explanation | Model/API docs | Provider terms | YYYY-MM-DD | optional |
| npm packages | App/runtime | lockfile | Package licenses | commit date | used |

Keep a screenshot or metadata record for price source used in demo.

## 7. Submission checklist

### Repository

- Public from hackathon start.
- Initial commit before implementation.
- At least three meaningful commits.
- README setup works from clean checkout.
- `.env.example` contains no secrets.
- Licenses/sources/AI disclosure present.
- Demo build matches repository.
- Stop changes after deadline.

### Product

- Guest demo opens without credentials.
- Production URL works in incognito and mobile.
- Calculator works when API blocked.
- Auth/CRUD tested with non-demo account.
- External status labels accurate.
- Chat refuses unrelated prompt.
- Print preview works.

### Devpost

- One project and one track.
- All registered members added.
- Real repository, deployment, video URLs.
- Screenshots have readable rupiah/status text.
- Submission editable and submitted before deadline.

### Video

- Maximum around two minutes.
- Voice audible; browser zoom readable.
- Synthetic data label visible.
- Main gap interaction before 1:20.
- No real personal/financial data.
- Link accessible without permission request.

## 8. Judge Q&A readiness

Be ready to answer:

- Why flat interest? Prototype simplicity; assumptions visible; strategy registry supports future formulas.
- Why no credit ML? No validated labeled dataset; deterministic logic is safer and explainable.
- Does a price reference change income? No; it only suggests an optional user-confirmed assumption.
- Is the price live? Answer exact status and source shown.
- What if Groq fails? Template explanation; engine unaffected.
- How is privacy protected? Guest-local default, explicit cloud/chat consent, minimized context, RLS, no chat storage.
- What is validated? Formula unit tests, RLS, critical flow; agronomy/risk thresholds remain prototype assumptions.
