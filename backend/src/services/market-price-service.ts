import type { SupabaseClient } from "@supabase/supabase-js";
import { LRUCache } from "lru-cache";
import mockData from "../mocks/market-prices.json" with { type: "json" };
import { MarketPriceContextSchema, type MarketPriceContext, type MarketPriceQuery } from "../schemas/market-price.js";

type CacheRow = { normalized_payload: unknown; expires_at: string | null };

export class MarketPriceService {
  private readonly memory: LRUCache<string, MarketPriceContext>;
  constructor(private readonly admin: SupabaseClient | null, memoryTtlMs: number, private readonly durableTtlSeconds: number) {
    this.memory = new LRUCache({ max: 200, ttl: memoryTtlMs });
  }
  private key(query: MarketPriceQuery) { return `market:mock:v1:${query.provinceCode}:${query.commodity}:${query.unit}`; }
  async get(query: MarketPriceQuery): Promise<MarketPriceContext> {
    const key = this.key(query); const hot = this.memory.get(key);
    if (hot) return { ...hot, status: hot.status === "unavailable" ? "unavailable" : "cached" };
    const durable = await this.readDurable(query);
    if (durable) { this.memory.set(key, durable); return durable; }
    const generated = this.mock(query);
    this.memory.set(key, generated);
    await this.writeDurable(query, generated);
    return generated;
  }
  private async readDurable(query: MarketPriceQuery): Promise<MarketPriceContext | null> {
    if (!this.admin) return null;
    const { data } = await this.admin.from("external_data_snapshots").select("normalized_payload,expires_at").eq("data_type", "market_price").eq("provider", "mock").eq("region_code", query.provinceCode).eq("commodity", query.commodity).eq("unit", query.unit).order("created_at", { ascending: false }).limit(1).maybeSingle<CacheRow>();
    if (!data?.expires_at || new Date(data.expires_at).getTime() <= Date.now()) return null;
    const parsed = MarketPriceContextSchema.safeParse(data.normalized_payload);
    return parsed.success ? { ...parsed.data, status: "cached", stale: false } : null;
  }
  private mock(query: MarketPriceQuery): MarketPriceContext {
    const row = mockData.prices.find((item) => item.commodity === query.commodity && item.provinceCode === query.provinceCode);
    const now = new Date().toISOString();
    if (!row) return { commodity: query.commodity, region: query.provinceCode, unit: query.unit, priceRupiah: null, rangeRupiah: null, source: mockData.source, dataDate: mockData.dataDate, lastCheckedAt: now, status: "unavailable", stale: false, synthetic: true, canAutofill: false };
    const canAutofill = row.unit === query.unit;
    return { commodity: row.commodity, region: row.region, unit: row.unit, priceRupiah: row.priceRupiah, rangeRupiah: { low: row.lowRupiah, high: row.highRupiah }, source: mockData.source, dataDate: mockData.dataDate, lastCheckedAt: now, status: "mock", stale: false, synthetic: true, canAutofill };
  }
  private async writeDurable(query: MarketPriceQuery, value: MarketPriceContext) {
    if (!this.admin || value.status === "unavailable") return;
    await this.admin.from("external_data_snapshots").insert({ provider: "mock", data_type: "market_price", region_code: query.provinceCode, commodity: query.commodity, unit: query.unit, source: value.source, acquisition_status: value.status, data_date: value.dataDate, last_checked_at: value.lastCheckedAt, normalized_payload: value, expires_at: new Date(Date.now() + this.durableTtlSeconds * 1000).toISOString() });
  }
}
