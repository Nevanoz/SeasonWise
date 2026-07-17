create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_locale text not null default 'id-ID' check (preferred_locale = 'id-ID'),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create table public.plans (
  id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 100), province_code text not null, regency_code text not null, district_code text,
  schema_version integer not null default 1 check (schema_version > 0), status text not null default 'draft' check (status in ('draft','complete','archived')),
  source text not null default 'new' check (source in ('new','guest_migration','seed')),
  monthly_household_expense_rupiah bigint not null check (monthly_household_expense_rupiah >= 0), opening_balance_rupiah bigint not null check (opening_balance_rupiah >= 0), emergency_reserve_rupiah bigint not null check (emergency_reserve_rupiah >= 0),
  notes text check (char_length(notes) <= 2000), deleted_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (id, owner_id)
);
create index plans_owner_updated_idx on public.plans(owner_id, updated_at desc, id desc) where deleted_at is null;

create table public.crop_plans (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null unique, owner_id uuid not null,
  crop_type text not null check (crop_type in ('rice','corn','chili','coffee','palm_oil')), template_version text not null,
  planting_date date not null, estimated_harvest_date date not null, cycle_duration_days integer not null check (cycle_duration_days > 0),
  production_phases jsonb not null default '[]', expected_harvest_quantity numeric(18,3) not null check (expected_harvest_quantity >= 0), quantity_unit text not null,
  expected_selling_price_rupiah bigint not null check (expected_selling_price_rupiah >= 0), expected_total_harvest_income_rupiah bigint not null check (expected_total_harvest_income_rupiah >= 0), assumptions jsonb not null default '[]',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (estimated_harvest_date > planting_date),
  foreign key (plan_id, owner_id) references public.plans(id, owner_id) on delete cascade
);

create table public.cash_flow_items (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null, owner_id uuid not null,
  item_type text not null check (item_type in ('income','production_expense')), category text not null, amount_rupiah bigint not null check (amount_rupiah >= 0), timing_date date not null,
  description text check (char_length(description) <= 300), is_harvest_income boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  foreign key (plan_id, owner_id) references public.plans(id, owner_id) on delete cascade
);
create index cash_flow_items_plan_date_idx on public.cash_flow_items(plan_id, timing_date);

create table public.financing_options (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null, owner_id uuid not null,
  name text not null check (char_length(name) between 1 and 100), principal_rupiah bigint not null check (principal_rupiah >= 0), interest_rate_bps integer not null check (interest_rate_bps between 0 and 100000), interest_period text not null check (interest_period in ('MONTHLY','ANNUAL')),
  administration_fee_rupiah bigint not null default 0 check (administration_fee_rupiah >= 0), other_upfront_fees_rupiah bigint not null default 0 check (other_upfront_fees_rupiah >= 0), financing_start_date date not null,
  grace_period_months integer not null default 0 check (grace_period_months = 0), number_of_installments integer not null check (number_of_installments > 0), repayment_frequency text not null check (repayment_frequency in ('MONTHLY','ONCE')), repayment_structure text not null check (repayment_structure in ('FLAT_MONTHLY','BULLET')), first_repayment_date date not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (first_repayment_date >= financing_start_date),
  check ((repayment_structure = 'BULLET' and repayment_frequency = 'ONCE' and number_of_installments = 1) or (repayment_structure = 'FLAT_MONTHLY' and repayment_frequency = 'MONTHLY')),
  foreign key (plan_id, owner_id) references public.plans(id, owner_id) on delete cascade
);

create table public.scenario_configs (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null, owner_id uuid not null, name text not null,
  mode text not null check (mode in ('EXPECTED','MILD','SEVERE','CUSTOM')), enabled_harvest_delay boolean not null default false, harvest_delay_months integer not null default 0 check (harvest_delay_months between 0 and 24),
  enabled_income_reduction boolean not null default false, harvest_income_reduction_bps integer not null default 0 check (harvest_income_reduction_bps between 0 and 10000), enabled_input_increase boolean not null default false, input_cost_increase_bps integer not null default 0 check (input_cost_increase_bps between 0 and 100000), config_version text not null default 'prototype-1',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), foreign key (plan_id, owner_id) references public.plans(id, owner_id) on delete cascade
);

create table public.calculation_snapshots (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null, owner_id uuid not null, financing_option_id uuid references public.financing_options(id) on delete set null,
  original_input jsonb not null, normalized_input jsonb not null, result jsonb not null, scenario_config jsonb not null, engine_version text not null, risk_config_version text not null, input_checksum text not null, created_at timestamptz not null default now(),
  foreign key (plan_id, owner_id) references public.plans(id, owner_id) on delete cascade
);

create table public.external_data_snapshots (
  id uuid primary key default gen_random_uuid(), provider text not null, data_type text not null check (data_type = 'market_price'), region_code text not null, commodity text not null, unit text not null,
  source text not null, acquisition_status text not null check (acquisition_status in ('live','mock')), data_date timestamptz, last_checked_at timestamptz not null, raw_reference_id text, normalized_payload jsonb not null, schema_version integer not null default 1, expires_at timestamptz, created_at timestamptz not null default now()
);
create index external_cache_lookup_idx on public.external_data_snapshots(provider, region_code, commodity, unit, created_at desc);

create table public.report_metadata (
  id uuid primary key default gen_random_uuid(), plan_id uuid not null, owner_id uuid not null, calculation_snapshot_id uuid references public.calculation_snapshots(id) on delete set null,
  anonymous_farmer_identifier text, engine_version text not null, report_version integer not null default 1, created_at timestamptz not null default now(),
  foreign key (plan_id, owner_id) references public.plans(id, owner_id) on delete cascade
);

create or replace function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
do $$ declare t text; begin foreach t in array array['profiles','plans','crop_plans','cash_flow_items','financing_options','scenario_configs'] loop execute format('create trigger %I before update on public.%I for each row execute function public.set_updated_at()', 'set_'||t||'_updated_at', t); end loop; end $$;

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$ begin insert into public.profiles(id) values(new.id) on conflict do nothing; return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security; alter table public.plans enable row level security; alter table public.crop_plans enable row level security; alter table public.cash_flow_items enable row level security; alter table public.financing_options enable row level security; alter table public.scenario_configs enable row level security; alter table public.calculation_snapshots enable row level security; alter table public.external_data_snapshots enable row level security; alter table public.report_metadata enable row level security;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
do $$ declare t text; begin foreach t in array array['plans','crop_plans','cash_flow_items','financing_options','scenario_configs','report_metadata'] loop
  execute format('create policy %I on public.%I for select to authenticated using ((select auth.uid()) = owner_id)', t||'_select_own', t);
  execute format('create policy %I on public.%I for insert to authenticated with check ((select auth.uid()) = owner_id)', t||'_insert_own', t);
  execute format('create policy %I on public.%I for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id)', t||'_update_own', t);
  execute format('create policy %I on public.%I for delete to authenticated using ((select auth.uid()) = owner_id)', t||'_delete_own', t);
end loop; end $$;
create policy snapshots_select_own on public.calculation_snapshots for select to authenticated using ((select auth.uid()) = owner_id);
create policy snapshots_insert_own on public.calculation_snapshots for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy snapshots_delete_own on public.calculation_snapshots for delete to authenticated using ((select auth.uid()) = owner_id);
