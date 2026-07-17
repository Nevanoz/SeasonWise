# MusimAman — Architecture Diagrams

Companion untuk `PROJECT_BLUEPRINT.md`. Diagram di bawah adalah canonical visualization dari arsitektur yang dijelaskan dalam sepuluh blueprint files.

## 1. System context

```mermaid
flowchart LR
  U["Petani / staf koperasi / pendamping"] --> W["MusimAman Web"]
  W --> E["Deterministic Financial Engine"]
  W --> A["MusimAman API"]
  A --> S["Supabase"]
  A --> P["Verified Market Price Source"]
  A --> G["Groq"]
```

## 2. Frontend and backend architecture

```mermaid
flowchart TB
  subgraph Browser
    UI["Next.js UI"]
    LS["Local Storage"]
    CE["Shared Engine"]
  end
  subgraph API
    F["Fastify Routes"]
    SV["Services"]
    AD["Provider Adapters"]
  end
  subgraph Shared
    T["shared-types"]
    V["validation"]
    C["config"]
  end
  UI --> LS
  UI --> CE
  UI --> F
  F --> SV
  SV --> CE
  SV --> AD
  Browser --> Shared
  API --> Shared
```

## 3. Financial-engine data flow

```mermaid
flowchart LR
  I["PlanInput"] --> Z["Zod validation"]
  Z --> N["Normalize rate/date/rupiah"]
  N --> O["Operating cash-flow items"]
  N --> R["Repayment strategy"]
  O --> M["Monthly ledger"]
  R --> M
  M --> K["Cash-gap metrics"]
  K --> Q["Prototype risk rules"]
  K --> S["Versioned snapshot"]
```

## 4. Authentication and saved-plan flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web
  participant L as LocalStorage
  participant A as Supabase Auth
  participant D as PostgreSQL RLS
  U->>W: Create guest plan
  W->>L: Save locally
  U->>A: Sign up / sign in
  A-->>W: Authenticated session
  W->>U: Request migration consent
  U->>W: Confirm
  W->>D: Insert with owner_id
  D-->>W: Owned cloud plan
```

## 5. Market-price integration

```mermaid
flowchart TD
  Q["Market-price query"] --> H{"Fresh cache?"}
  H -->|Yes| C["Return cached + timestamp"]
  H -->|No| L["Call verified live provider"]
  L --> V{"Schema, unit, region valid?"}
  V -->|Yes| N["Normalize and cache"]
  N --> O["Return live"]
  V -->|No| S{"Stale cache exists?"}
  L -->|Timeout / error| S
  S -->|Yes| ST["Return stale cached + warning"]
  S -->|No| M{"Demo mock exists?"}
  M -->|Yes| MK["Return clearly labeled mock"]
  M -->|No| U["Return unavailable"]
  O --> X["User explicitly applies suggestion"]
  C --> X
  ST --> X
  MK --> X
```

## 6. AI chatbot request flow

```mermaid
sequenceDiagram
  participant U as User
  participant W as Web
  participant A as Fastify API
  participant E as Guardrails
  participant G as Groq
  participant T as Template Engine
  U->>W: Ask about active result
  W->>A: Message + minimized ChatContext
  A->>E: Sanitize and scope-check
  alt Out of scope or injection
    E-->>A: Fixed refusal
  else Allowed
    E->>G: Structured prompt
    G-->>E: JSON response
    E->>E: Zod + number-reference validation
    alt Valid
      E-->>A: Validated answer
    else Invalid / timeout / 429
      E->>T: Deterministic explanation
      T-->>A: Template answer
    end
  end
  A-->>W: Answer + references + disclaimer
```

## 7. Guest-mode and offline fallback

```mermaid
stateDiagram-v2
  [*] --> Guest
  Guest --> LocalPlan: Create / edit
  LocalPlan --> LocalResult: Browser engine
  LocalResult --> LocalPrint: Print report
  LocalResult --> Offline: Network unavailable
  Offline --> LocalResult: Calculation still works
  Offline --> CachedContext: Cached / mock enrichment
  Guest --> Authenticated: User signs in
  Authenticated --> CloudPlan: Explicit migration consent
  CloudPlan --> LocalPlan: API unavailable; continue locally
```

## 8. Database entity relationships

```mermaid
erDiagram
  AUTH_USERS ||--|| PROFILES : owns
  AUTH_USERS ||--o{ PLANS : owns
  PLANS ||--|| CROP_PLANS : contains
  PLANS ||--o{ CASH_FLOW_ITEMS : contains
  PLANS ||--o{ FINANCING_OPTIONS : compares
  PLANS ||--o{ SCENARIO_CONFIGS : simulates
  PLANS ||--o{ CALCULATION_SNAPSHOTS : records
  PLANS ||--o{ EXTERNAL_DATA_SNAPSHOTS : references
  PLANS ||--o{ REPORT_METADATA : produces
```

## 9. Deployment architecture

```mermaid
flowchart LR
  GH["Public GitHub monorepo"] --> VE["Vercel Web"]
  GH --> RW["Railway Fastify API"]
  VE --> RW
  VE --> SA["Supabase Auth"]
  RW --> DB["Supabase PostgreSQL"]
  RW --> MP["Verified Price Provider"]
  RW --> GR["Groq API"]
  RW --> MO["Versioned Mock Data"]
```
