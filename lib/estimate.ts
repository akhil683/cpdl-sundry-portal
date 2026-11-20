import {
  TARIFFS,
  type BillResult,
  type BillSegment,
  type FixedBasis,
  type SlabRow,
  type TariffKey,
  type TariffPeriodId,
  type TariffSubtype,
} from "@/lib/tariff";

export const ESTIMATE_STORAGE_KEY = "cpdl-to-be-charged-state-v1";

export interface EstimateForm {
  category: TariffKey;
  subtype: TariffSubtype;
  from: string;
  to: string;
  units: string;
  load: string;
  fppca: string;
}

export interface StoredEstimateResult extends BillResult {
  units: number;
  load: number;
}

export interface StoredEstimateState {
  form: EstimateForm;
  result: StoredEstimateResult | null;
}

const PERIOD_IDS: TariffPeriodId[] = ["old", "2025-26", "2026-27"];
const FIXED_BASES: FixedBasis[] = ["connection", "kW", "kVA"];
const SUBTYPES: TariffSubtype[] = [
  "default",
  "single",
  "three",
  "large",
  "htcommercial",
  "medium",
  "small",
  "municipal",
  "advert",
  "evlt",
  "evht",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSlabRow(value: unknown): value is SlabRow {
  if (!isRecord(value)) return false;

  return (
    typeof value.label === "string" &&
    isNumber(value.units) &&
    isNumber(value.rate) &&
    isNumber(value.amount)
  );
}

function isBillSegment(value: unknown): value is BillSegment {
  if (!isRecord(value)) return false;

  return (
    typeof value.period === "string" &&
    PERIOD_IDS.includes(value.period as TariffPeriodId) &&
    typeof value.label === "string" &&
    typeof value.from === "string" &&
    typeof value.to === "string" &&
    isNumber(value.days) &&
    isNumber(value.units) &&
    Array.isArray(value.rows) &&
    value.rows.every(isSlabRow) &&
    isNumber(value.energy) &&
    isNumber(value.edRate) &&
    isNumber(value.ed) &&
    isNumber(value.mcRate) &&
    isNumber(value.mc) &&
    isNumber(value.fixedRate) &&
    typeof value.fixedBasis === "string" &&
    FIXED_BASES.includes(value.fixedBasis as FixedBasis) &&
    isNumber(value.fixedLoad) &&
    typeof value.fixedLoadLabel === "string" &&
    isNumber(value.fixed) &&
    isNumber(value.total)
  );
}

function isEstimateForm(value: unknown): value is EstimateForm {
  if (!isRecord(value)) return false;

  return (
    typeof value.category === "string" &&
    Object.prototype.hasOwnProperty.call(TARIFFS, value.category) &&
    typeof value.subtype === "string" &&
    SUBTYPES.includes(value.subtype as TariffSubtype) &&
    typeof value.from === "string" &&
    typeof value.to === "string" &&
    typeof value.units === "string" &&
    typeof value.load === "string" &&
    typeof value.fppca === "string"
  );
}

function isStoredEstimateResult(value: unknown): value is StoredEstimateResult {
  if (!isRecord(value)) return false;

  return (
    typeof value.category === "string" &&
    Object.prototype.hasOwnProperty.call(TARIFFS, value.category) &&
    typeof value.subtype === "string" &&
    SUBTYPES.includes(value.subtype as TariffSubtype) &&
    (value.unit === "kWh" || value.unit === "kVAh") &&
    isNumber(value.days) &&
    isNumber(value.months) &&
    isNumber(value.calculatedLoad) &&
    Array.isArray(value.segments) &&
    value.segments.every(isBillSegment) &&
    Array.isArray(value.rows) &&
    value.rows.every(isSlabRow) &&
    isNumber(value.energy) &&
    isNumber(value.ed) &&
    isNumber(value.mc) &&
    isNumber(value.fixed) &&
    isNumber(value.fppca) &&
    isNumber(value.total) &&
    isNumber(value.exactLimit) &&
    isNumber(value.slabLimit) &&
    isNumber(value.units) &&
    isNumber(value.load)
  );
}

/**
 * Read the last calculation kept for the To be charged workspace. The form
 * inputs and the estimate are stored together so a refresh restores exactly
 * what the user last saw.
 */
export function readStoredEstimate(): StoredEstimateState | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(ESTIMATE_STORAGE_KEY);
    if (!raw) return null;

    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || !isEstimateForm(parsed.form)) return null;

    return {
      form: parsed.form,
      result: isStoredEstimateResult(parsed.result) ? parsed.result : null,
    };
  } catch {
    return null;
  }
}

export function writeStoredEstimate(state: StoredEstimateState): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(ESTIMATE_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
