import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../schemas/common.js";
import type { PlanInput } from "../schemas/plans.js";

type Cursor = { updatedAt: string; id: string };
function encodeCursor(value: Cursor): string { return Buffer.from(JSON.stringify(value)).toString("base64url"); }
function decodeCursor(value: string): Cursor {
  try { return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as Cursor; }
  catch { throw new AppError(422, "INVALID_CURSOR", "Cursor is invalid"); }
}
function databaseError(error: { message: string; code?: string } | null): never {
  if (error?.message.includes("PLAN_VERSION_CONFLICT")) throw new AppError(409, "PLAN_VERSION_CONFLICT", "Plan has been updated elsewhere");
  if (error?.message.includes("PLAN_NOT_FOUND")) throw new AppError(404, "PLAN_NOT_FOUND", "Plan not found");
  throw new AppError(503, "DATABASE_ERROR", "Database operation failed");
}

export class PlanRepository {
  constructor(private readonly client: SupabaseClient) {}
  async create(plan: PlanInput, source: string) {
    const { data, error } = await this.client.rpc("create_plan", { p_plan: plan, p_source: source });
    if (error) databaseError(error);
    return data;
  }
  async list(limit: number, cursor?: string) {
    let query = this.client.from("plans").select("id,title,status,schema_version,created_at,updated_at").is("deleted_at", null).order("updated_at", { ascending: false }).order("id", { ascending: false }).limit(limit + 1);
    if (cursor) {
      const parsed = decodeCursor(cursor);
      query = query.or(`updated_at.lt.${parsed.updatedAt},and(updated_at.eq.${parsed.updatedAt},id.lt.${parsed.id})`);
    }
    const { data, error } = await query;
    if (error) databaseError(error);
    const rows = data ?? [];
    const hasMore = rows.length > limit;
    const visible = rows.slice(0, limit);
    const last = visible.at(-1);
    return { plans: visible, nextCursor: hasMore && last ? encodeCursor({ updatedAt: last.updated_at, id: last.id }) : null };
  }
  async get(id: string) {
    const { data, error } = await this.client.rpc("get_plan", { p_plan_id: id });
    if (error) databaseError(error);
    if (!data) throw new AppError(404, "PLAN_NOT_FOUND", "Plan not found");
    return data;
  }
  async replace(id: string, expectedUpdatedAt: string, plan: PlanInput) {
    const { data, error } = await this.client.rpc("replace_plan", { p_plan_id: id, p_expected_updated_at: expectedUpdatedAt, p_plan: plan });
    if (error) databaseError(error);
    return data;
  }
  async duplicate(id: string, title: string) {
    const { data, error } = await this.client.rpc("duplicate_plan", { p_plan_id: id, p_title: title });
    if (error) databaseError(error);
    return data;
  }
  async softDelete(id: string) {
    const { data, error } = await this.client.rpc("soft_delete_plan", { p_plan_id: id });
    if (error) databaseError(error);
    return data;
  }
}
