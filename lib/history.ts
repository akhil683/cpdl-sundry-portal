import {
  TARIFFS,
  type BillSegment,
  type ConsumptionUnit,
  type FixedBasis,
  type SlabRow,
  type TariffKey,
  type TariffPeriodId,
  type TariffSubtype,
} from "@/lib/tariff";

export const HISTORY_STORAGE_KEY = "cpdl-sundry-calculation-history-v1";
export const HISTORY_UPDATED_EVENT = "cpdl:history-updated";
export const HISTORY_LIMIT = 100;

export interface HistoryEntry {
  id: string;
  createdAt: string;
  category: TariffKey;
  from: string;
  to: string;
  days: number;
  units: number;
  load: number;
  fppca: number;
  edRate: number;
  unit: ConsumptionUnit;
  months: number;
  exactLimit: number;
  slabLimit: number;
  rows: SlabRow[];
  energy: number;
  ed: number;
  mc: number;
  fixed: number;
  total: number;
  subtype?: TariffSubtype;
  calculatedLoad?: number;
  segments?: BillSegment[];
}

export type HistorySnapshot = Omit<HistoryEntry, "id" | "createdAt">;

export type SaveCalculationStatus = "saved" | "duplicate" | "unavailable";

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isSlabRow(value: unknown): value is SlabRow {
  if (!value || typeof value !== "object") return false;

  const row = value as Record<string, unknown>;

  return (
    typeof row.label === "string" &&
    isNumber(row.units) &&
    isNumber(row.rate) &&
    isNumber(row.amount)
  );
}

const PERIOD_IDS: TariffPeriodId[] = ["old", "2025-26", "2026-27"];
const FIXED_BASES: FixedBasis[] = ["connection", "kW", "kVA"];

function isBillSegment(value: unknown): value is BillSegment {
  if (!value || typeof value !== "object") return false;

  const segment = value as Record<string, unknown>;

  return (
    typeof segment.period === "string" &&
    PERIOD_IDS.includes(segment.period as TariffPeriodId) &&
    typeof segment.label === "string" &&
    typeof segment.from === "string" &&
    typeof segment.to === "string" &&
    isNumber(segment.days) &&
    isNumber(segment.units) &&
    isNumber(segment.energy) &&
    isNumber(segment.edRate) &&
    isNumber(segment.ed) &&
    isNumber(segment.mc) &&
    isNumber(segment.fixedRate) &&
    typeof segment.fixedBasis === "string" &&
    FIXED_BASES.includes(segment.fixedBasis as FixedBasis) &&
    isNumber(segment.fixedLoad) &&
    typeof segment.fixedLoadLabel === "string" &&
    isNumber(segment.fixed) &&
    isNumber(segment.total) &&
    Array.isArray(segment.rows) &&
    segment.rows.every(isSlabRow)
  );
}

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== "object") return false;

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    typeof entry.createdAt === "string" &&
    !Number.isNaN(Date.parse(entry.createdAt)) &&
    typeof entry.category === "string" &&
    Object.prototype.hasOwnProperty.call(TARIFFS, entry.category) &&
    typeof entry.from === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.from) &&
    typeof entry.to === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(entry.to) &&
    isNumber(entry.days) &&
    isNumber(entry.units) &&
    isNumber(entry.load) &&
    isNumber(entry.fppca) &&
    isNumber(entry.edRate) &&
    (entry.unit === "kWh" || entry.unit === "kVAh") &&
    isNumber(entry.months) &&
    isNumber(entry.exactLimit) &&
    isNumber(entry.slabLimit) &&
    isNumber(entry.energy) &&
    isNumber(entry.ed) &&
    isNumber(entry.mc) &&
    isNumber(entry.fixed) &&
    isNumber(entry.total) &&
    Array.isArray(entry.rows) &&
    entry.rows.every(isSlabRow) &&
    (entry.subtype === undefined || typeof entry.subtype === "string") &&
    (entry.calculatedLoad === undefined ||
      isNumber(entry.calculatedLoad)) &&
    (entry.segments === undefined ||
      (Array.isArray(entry.segments) && entry.segments.every(isBillSegment)))
  );
}

export function readHistory(): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(isHistoryEntry)
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .slice(0, HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export function writeHistory(entries: HistoryEntry[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(entries.slice(0, HISTORY_LIMIT)),
    );
    return true;
  } catch {
    return false;
  }
}

function createHistoryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isSameCalculation(
  entry: HistoryEntry,
  snapshot: HistorySnapshot,
): boolean {
  return (
    entry.category === snapshot.category &&
    entry.from === snapshot.from &&
    entry.to === snapshot.to &&
    entry.units === snapshot.units &&
    entry.load === snapshot.load &&
    entry.fppca === snapshot.fppca &&
    entry.edRate === snapshot.edRate &&
    (entry.subtype ?? "default") === (snapshot.subtype ?? "default")
  );
}

export function saveCalculation(
  snapshot: HistorySnapshot,
): SaveCalculationStatus {
  const current = readHistory();
  const latest = current[0];

  if (latest && isSameCalculation(latest, snapshot)) {
    return "duplicate";
  }

  const entry: HistoryEntry = {
    ...snapshot,
    id: createHistoryId(),
    createdAt: new Date().toISOString(),
  };

  const saved = writeHistory([entry, ...current].slice(0, HISTORY_LIMIT));

  if (saved && typeof window !== "undefined") {
    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
  }

  return saved ? "saved" : "unavailable";
}
