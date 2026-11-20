import type { HistoryEntry } from "@/lib/history";
import {
  LEDGER_AMOUNT_FIELDS,
  ledgerRowTotal,
  numericValue,
  type LedgerEntry,
} from "@/lib/ledger";

export interface ChargeBreakdown {
  units: number;
  energy: number;
  ed: number;
  mc: number;
  fppca: number;
  fixed: number;
  solar: number;
  others: number;
  allowance: number;
}

export interface NetSummary {
  toBe: ChargeBreakdown;
  already: ChargeBreakdown;
  net: ChargeBreakdown;
  toBeTotal: number;
  alreadyTotal: number;
  netTotal: number;
}

export const NET_ROWS: {
  key: keyof ChargeBreakdown;
  label: string;
  isUnits?: boolean;
}[] = [
  { key: "units", label: "Units", isUnits: true },
  { key: "energy", label: "Energy charges (EC)" },
  { key: "ed", label: "Electricity duty (ED)" },
  { key: "mc", label: "Meter charges (MC)" },
  { key: "fppca", label: "FPPCA" },
  { key: "fixed", label: "Fixed charges" },
  { key: "solar", label: "Solar user charges" },
  { key: "others", label: "Others" },
  { key: "allowance", label: "Allowance" },
];

function emptyBreakdown(): ChargeBreakdown {
  return {
    units: 0,
    energy: 0,
    ed: 0,
    mc: 0,
    fppca: 0,
    fixed: 0,
    solar: 0,
    others: 0,
    allowance: 0,
  };
}

export function buildNetSummary(
  latest: HistoryEntry | null,
  ledger: LedgerEntry[],
): NetSummary {
  const toBe = emptyBreakdown();
  const already = emptyBreakdown();

  if (latest) {
    toBe.units = latest.units;
    toBe.energy = latest.energy;
    toBe.ed = latest.ed;
    toBe.mc = latest.mc;
    toBe.fppca = latest.fppca;
    toBe.fixed = latest.fixed;
  }

  ledger.forEach((entry) => {
    already.units += numericValue(entry.units);
    LEDGER_AMOUNT_FIELDS.forEach((field) => {
      already[field] += numericValue(entry[field]);
    });
  });

  const net = emptyBreakdown();
  NET_ROWS.forEach(({ key }) => {
    net[key] = toBe[key] - already[key];
  });

  const sum = (breakdown: ChargeBreakdown) =>
    NET_ROWS.filter((row) => !row.isUnits).reduce(
      (total, row) => total + breakdown[row.key],
      0,
    );

  const alreadyTotal = ledger.reduce(
    (total, entry) => total + ledgerRowTotal(entry),
    0,
  );

  return {
    toBe,
    already,
    net,
    toBeTotal: sum(toBe),
    alreadyTotal,
    netTotal: sum(toBe) - alreadyTotal,
  };
}
