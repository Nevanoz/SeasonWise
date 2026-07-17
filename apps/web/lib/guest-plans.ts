import type { PlanFormValues } from '@musimaman/shared-types';
import { planFormSchema } from '@musimaman/validation';

export const GUEST_STORAGE_KEY = 'musimaman:guest-plans:v1';
const QUARANTINE_KEY = 'musimaman:guest-plans:quarantine:v1';
const STORAGE_VERSION = 1;
const MAX_GUEST_PLANS = 10;

export interface StoredPlan extends PlanFormValues {
  id: string;
  updatedAt: string;
  lastSnapshot?: unknown;
}

interface StorageEnvelope {
  storageVersion: 1;
  plans: Array<{ storageVersion: 1; updatedAt: string; plan: StoredPlan }>;
}

let memoryPlans: StoredPlan[] = [];

function addMonths(dateString: string, months: number) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1 + months, day)).toISOString().slice(0, 10);
}

function repairLegacyPlan(raw: Record<string, unknown>): Record<string, unknown> {
  const crop = { ...((raw.cropPlan as Record<string, unknown>) || {}) };
  const plantingDate = typeof crop.plantingDate === 'string' ? crop.plantingDate : new Date().toISOString().slice(0, 10);
  const cycleDurationDays = typeof crop.cycleDurationDays === 'number' ? crop.cycleDurationDays : 120;
  crop.plantingDate = plantingDate;
  crop.cycleDurationDays = cycleDurationDays;
  crop.estimatedHarvestDate = typeof crop.estimatedHarvestDate === 'string' ? crop.estimatedHarvestDate : addMonths(plantingDate, Math.max(1, Math.round(cycleDurationDays / 30)));
  return { ...raw, schemaVersion: 1, cropPlan: crop };
}

function parsePlans(raw: string | null): StoredPlan[] {
  if (!raw) return [];
  const parsed = JSON.parse(raw) as unknown;
  const candidates = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && parsed !== null && Array.isArray((parsed as StorageEnvelope).plans)
      ? (parsed as StorageEnvelope).plans.map((entry) => entry.plan)
      : [];
  const valid: StoredPlan[] = [];
  const invalid: unknown[] = [];
  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== 'object') { invalid.push(candidate); continue; }
    const repaired = repairLegacyPlan(candidate as Record<string, unknown>);
    const result = planFormSchema.safeParse(repaired);
    const id = (candidate as { id?: unknown }).id;
    if (result.success && typeof id === 'string' && id) {
      valid.push({ ...result.data, id, updatedAt: typeof (candidate as { updatedAt?: unknown }).updatedAt === 'string' ? (candidate as { updatedAt: string }).updatedAt : new Date().toISOString(), lastSnapshot: (candidate as { lastSnapshot?: unknown }).lastSnapshot });
    } else invalid.push(candidate);
  }
  if (invalid.length && typeof window !== 'undefined') {
    try { localStorage.setItem(QUARANTINE_KEY, JSON.stringify({ storageVersion: STORAGE_VERSION, quarantinedAt: new Date().toISOString(), records: invalid.slice(-10) })); } catch { /* in-memory fallback remains available */ }
  }
  return valid.slice(-MAX_GUEST_PLANS);
}

function persist(plans: StoredPlan[]) {
  memoryPlans = plans.slice(-MAX_GUEST_PLANS);
  if (typeof window === 'undefined') return false;
  const envelope: StorageEnvelope = { storageVersion: 1, plans: memoryPlans.map((plan) => ({ storageVersion: 1, updatedAt: plan.updatedAt, plan })) };
  try { localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(envelope)); return true; }
  catch { return false; }
}

export function loadGuestPlans(): StoredPlan[] {
  if (typeof window === 'undefined') return memoryPlans;
  try {
    const plans = parsePlans(localStorage.getItem(GUEST_STORAGE_KEY));
    if (plans.length || localStorage.getItem(GUEST_STORAGE_KEY)) persist(plans);
    return plans;
  } catch { return memoryPlans; }
}

export function saveGuestPlan(plan: Omit<StoredPlan, 'updatedAt'> & { updatedAt?: string }) {
  const updated: StoredPlan = { ...plan, updatedAt: plan.updatedAt || new Date().toISOString() };
  const plans = loadGuestPlans().filter((item) => item.id !== updated.id);
  plans.push(updated);
  return { plan: updated, persisted: persist(plans) };
}

export function deleteGuestPlan(id: string) {
  return persist(loadGuestPlans().filter((plan) => plan.id !== id));
}

export function getGuestPlan(id: string) {
  return loadGuestPlans().find((plan) => plan.id === id) || null;
}

export function duplicateGuestPlan(id: string) {
  const source = getGuestPlan(id);
  if (!source) return null;
  const copy: StoredPlan = { ...source, id: crypto.randomUUID(), title: `${source.title} (Salinan)`, updatedAt: new Date().toISOString(), lastSnapshot: undefined };
  persist([...loadGuestPlans(), copy]);
  return copy;
}
