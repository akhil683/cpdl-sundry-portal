export const LEDGER_STORAGE_KEY = "cpdl-charged-ledger-v1";
export const LEDGER_UPDATED_EVENT = "cpdl:ledger-updated";

export interface LedgerEntry {
  id: string;
  from: string;
  to: string;
  units: string;
  energy: string;
  fixed: string;
  mc: string;
  ed: string;
  solar: string;
  fppca: string;
  others: string;
}

export type LedgerSnapshot = Omit<LedgerEntry, "id">;

const FIELDS = [
  "from",
  "to",
  "units",
  "energy",
  "fixed",
  "mc",
  "ed",
  "solar",
  "fppca",
  "others",
] as const;

function isLedgerEntry(value: unknown): value is LedgerEntry {
  if (!value || typeof value !== "object") return false;

  const entry = value as Record<string, unknown>;

  return (
    typeof entry.id === "string" &&
    FIELDS.every((field) => typeof entry[field] === "string")
  );
}

export function readLedger(): LedgerEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
    if (!raw) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isLedgerEntry);
  } catch {
    return [];
  }
}

export function writeLedger(entries: LedgerEntry[]): boolean {
  if (typeof window === "undefined") return false;

  try {
    window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(LEDGER_UPDATED_EVENT));
    return true;
  } catch {
    return false;
  }
}

export function numericValue(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export const LEDGER_AMOUNT_FIELDS = [
  "energy",
  "fixed",
  "mc",
  "ed",
  "solar",
  "fppca",
  "others",
] as const;

export type LedgerAmountField = (typeof LEDGER_AMOUNT_FIELDS)[number];

export function ledgerRowTotal(entry: LedgerSnapshot): number {
  return LEDGER_AMOUNT_FIELDS.reduce(
    (sum, field) => sum + numericValue(entry[field]),
    0,
  );
}

export function isBlankLedgerEntry(entry: LedgerSnapshot): boolean {
  return (
    entry.from === "" &&
    entry.to === "" &&
    entry.units.trim() === "" &&
    LEDGER_AMOUNT_FIELDS.every((field) => entry[field].trim() === "")
  );
}

export function ledgerTotals(entries: LedgerSnapshot[]) {
  const totals = {
    units: 0,
    energy: 0,
    fixed: 0,
    mc: 0,
    ed: 0,
    solar: 0,
    fppca: 0,
    others: 0,
    grand: 0,
  };

  entries.forEach((entry) => {
    totals.units += numericValue(entry.units);
    LEDGER_AMOUNT_FIELDS.forEach((field) => {
      totals[field] += numericValue(entry[field]);
    });
    totals.grand += ledgerRowTotal(entry);
  });

  return totals;
}
