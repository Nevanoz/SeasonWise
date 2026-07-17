import type { ApiEnvelope, PlanFormValues } from '@musimaman/shared-types';
import { requireSupabaseBrowserClient } from './supabase';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class ApiError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

function optionalUuid(value: string | undefined) {
  return value && UUID_PATTERN.test(value) ? value : undefined;
}

export function toBackendPlan(plan: PlanFormValues) {
  return {
    schemaVersion: 1 as const,
    title: plan.title.trim(),
    region: {
      provinceCode: plan.provinceCode,
      regencyCode: plan.regencyCode,
      districtCode: plan.districtCode || null
    },
    cropPlan: {
      ...plan.cropPlan,
      templateVersion: 'v1',
      productionPhases: [],
      assumptions: []
    },
    cashFlowItems: plan.cashFlowItems.map((item) => ({ ...item, id: optionalUuid(item.id) })),
    monthlyHouseholdExpenseRupiah: plan.monthlyHouseholdExpenseRupiah,
    openingBalanceRupiah: plan.openingBalanceRupiah,
    emergencyReserveRupiah: plan.emergencyReserveRupiah,
    financingOptions: plan.financingOptions.map((option) => ({ ...option, id: optionalUuid(option.id) })),
    notes: plan.notes || undefined
  };
}

export async function apiRequest<T>(path: string, init: RequestInit = {}, authenticated = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (authenticated) {
    const client = requireSupabaseBrowserClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) throw new ApiError(401, 'AUTH_REQUIRED', 'Silakan masuk untuk mengakses data cloud.');
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }
  const response = await fetch(`${API_URL}/api/v1${path}`, { ...init, headers });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | { error?: { code?: string; message?: string; details?: unknown } } | null;
  if (!response.ok) {
    const failure = payload && 'error' in payload ? payload.error : undefined;
    throw new ApiError(response.status, failure?.code || 'API_ERROR', failure?.message || 'Permintaan ke server gagal.', failure?.details);
  }
  return (payload as ApiEnvelope<T>).data;
}

export interface CloudPlanSummary {
  id: string;
  title: string;
  status: string;
  schema_version: number;
  created_at: string;
  updated_at: string;
}

export interface CloudPlanList {
  plans: CloudPlanSummary[];
  nextCursor: string | null;
}
