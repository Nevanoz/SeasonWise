import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const schema = readFileSync(resolve("supabase/migrations/202607160001_initial_schema.sql"), "utf8");
const functions = readFileSync(resolve("supabase/migrations/202607160002_plan_functions.sql"), "utf8");
const seed = readFileSync(resolve("supabase/seed.sql"), "utf8");

describe("database contracts", () => {
  it("enables RLS on every public table", () => {
    for (const table of ["profiles","plans","crop_plans","cash_flow_items","financing_options","scenario_configs","calculation_snapshots","external_data_snapshots","report_metadata"]) expect(schema).toContain(`alter table public.${table} enable row level security`);
  });
  it("uses composite plan ownership foreign keys", () => expect((schema.match(/foreign key \(plan_id, owner_id\)/g) ?? []).length).toBeGreaterThanOrEqual(6));
  it("keeps shared market cache service-only", () => { expect(schema).toContain("external_data_snapshots enable row level security"); expect(schema).not.toMatch(/policy .*external_data_snapshots/); });
  it("defines atomic plan functions", () => { for (const name of ["create_plan","get_plan","replace_plan","duplicate_plan","soft_delete_plan"]) expect(functions).toContain(`function public.${name}`); });
  it("seeds the required rice demonstration outcomes", () => { expect(seed).toContain("Demo Sintetis Rencana Padi Juli"); expect(seed).toContain('"minimumBalanceRupiah":480000'); expect(seed).toContain('"maximumCashGapRupiah":4140000'); expect(seed).toContain('"minimumBalanceRupiah":2100000'); expect(seed).toContain("Data simulasi/sintetis"); });
});