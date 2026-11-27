export type TariffGroup =
  | "Domestic"
  | "Commercial"
  | "Agricultural"
  | "Other LT"
  | "EV"
  | "High Tension"
  | "Extra High Tension"
  | "Temporary";

export type TariffKind = "flat" | "slabs" | "slabs3" | "customSlabs";
export type FixedBasis = "connection" | "kW" | "kVA";
export type ConsumptionUnit = "kWh" | "kVAh";
export type TariffPeriodId = "old" | "2025-26" | "2026-27";

export type TariffSubtype =
  | "default" | "single" | "three" | "large" | "htcommercial" | "medium"
  | "small" | "municipal" | "advert" | "evlt" | "evht";

export interface TariffConfig {
  group: TariffGroup;
  unit?: ConsumptionUnit;
  kind: TariffKind;
  rates: number[];
  labels: string[];
  thresholds?: number[];
  fixed: number;
  fixedBasis: FixedBasis;
  ed: number | null;
  loadLabel: string;
  hint: string;
}

interface TariffRateSet {
  kind: TariffKind;
  rates: number[];
  fixed: number;
  fixedBasis: FixedBasis;
  thresholds?: number[];
  labels?: string[];
  ed?: number | null;
}

export interface TariffPeriod {
  id: TariffPeriodId;
  label: string;
  range: string;
  edRate: number;
}

export const FIXED_CHARGE_MONTH = 365 / 12;
export const ENERGY_SLAB_MONTH = 30;
export const MC_RATE_BEFORE_APR_2026 = 0.12;
export const MC_RATE_FROM_APR_2026 = 0.16;
export const FIXED_LOAD_FACTOR = 0.85;
export const ED_RATE_BEFORE_APR_2026 = 0.09;
export const ED_RATE_FROM_APR_2026 = 0.09;
export const ED_RATE_LTDS_II = 0.09;
export const ED_RATE_AGRICULTURAL = 0;
export const ED_RATE_DEFAULT = 0.11;
export const TARIFF_CUTOFFS = ["2025-11-01", "2026-04-01"] as const;
export const TARIFF_PERIOD_ENDS = ["2025-10-31", "2026-03-31"] as const;

export const TARIFF_PERIODS: TariffPeriod[] = [
  { id: "old", label: "Old tariff", range: "Before 01-11-2025", edRate: ED_RATE_BEFORE_APR_2026 },
  { id: "2025-26", label: "Approved tariff 2025–26", range: "01-11-2025 to 31-03-2026", edRate: ED_RATE_BEFORE_APR_2026 },
  { id: "2026-27", label: "Tariff 2026–27", range: "From 01-04-2026", edRate: ED_RATE_FROM_APR_2026 },
];

export const TARIFFS = {
  "LTDS-I": { group: "Domestic", kind: "flat", rates: [2.9], labels: ["All units"], fixed: 30, fixedBasis: "connection", ed: 0.09, loadLabel: "Sanctioned load (kW)", hint: "₹30 per connection per month; applicable only for load below 250 watts. Energy rate ₹2.90 per unit." },
  "LTDS-II": { group: "Domestic", kind: "slabs", rates: [2.95, 3.75, 4.8, 5.0, 5.4], labels: ["0–100", "101–200", "201–300", "301–400", "Above 400"], fixed: 30, fixedBasis: "kW", ed: 0.09, loadLabel: "Sanctioned load (kW)", hint: "₹30 per kW per month fixed charge, with consumption charged across five energy slabs." },
  "LTDS-III": { group: "Domestic", kind: "slabs", rates: [3.0, 3.8, 4.85, 5.05, 5.45], labels: ["0–100", "101–200", "201–300", "301–400", "Above 400"], fixed: 30, fixedBasis: "kW", ed: 0.09, loadLabel: "Sanctioned load (kW)", hint: "₹30 per kW per month fixed charge, with consumption charged across five energy slabs." },
  "NDS-I": { group: "Commercial", kind: "slabs3", rates: [4.6, 4.8, 5.75], labels: ["0–100", "101–200", "Above 200"], fixed: 120, fixedBasis: "kW", ed: null, loadLabel: "Sanctioned load (kW)", hint: "LT Commercial: select Single Phase (₹50/kW/month) or Three Phase (₹120/kW/month). Energy slabs follow the applicable tariff period." },
  "NDS-II": { group: "Commercial", kind: "slabs3", rates: [4.65, 4.75, 5.8], labels: ["0–100", "101–200", "Above 200"], fixed: 120, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load (kVA)", hint: "₹120 per kVA per month fixed charge, with consumption charged across three energy slabs." },
  "NDS-III": { group: "Commercial", kind: "flat", rates: [6.7], labels: ["All units"], fixed: 160, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load (kVA)", hint: "₹160 per kVA per month fixed charge, with a flat energy rate of ₹6.70 per unit." },
  "NDS-IV": { group: "Commercial", kind: "flat", rates: [5.55], labels: ["All units"], fixed: 120, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load (kVA)", hint: "₹120 per kVA per month fixed charge, with a flat energy rate of ₹5.55 per unit." },
  "NDS-V": { group: "Commercial", unit: "kWh", kind: "flat", rates: [2.95], labels: ["All units"], fixed: 30, fixedBasis: "kW", ed: null, loadLabel: "Sanctioned load (kW)", hint: "₹30 per kW per month fixed charge, with a flat energy rate of ₹2.95 per unit." },
  "LTAS-I": { group: "Agricultural", unit: "kWh", kind: "flat", rates: [2.9], labels: ["All units"], fixed: 10, fixedBasis: "kW", ed: 0, loadLabel: "Sanctioned load (kW)", hint: "Agricultural pumping supply: ₹10 per kW per month and ₹2.90 per kWh." },
  "LTAS-II": { group: "Agricultural", unit: "kVAh", kind: "flat", rates: [2.95], labels: ["All units"], fixed: 20, fixedBasis: "kVA", ed: 0, loadLabel: "Sanctioned load (kVA)", hint: "Agricultural pumping supply: ₹20 per kVA per month and ₹2.95 per kVAh." },
  "LTAS-III": { group: "Agricultural", unit: "kVAh", kind: "flat", rates: [3.1], labels: ["All units"], fixed: 20, fixedBasis: "kVA", ed: 0, loadLabel: "Sanctioned load (kVA)", hint: "Agricultural pumping supply: ₹20 per kVA per month and ₹3.10 per kVAh." },
  "LTIS-I": { group: "Other LT", unit: "kVAh", kind: "customSlabs", thresholds: [500, 1000], rates: [4.5, 4.6, 4.7], labels: ["0–500", "501–1000", "Above 1000"], fixed: 210, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load (kVA)", hint: "Small power and medium supply: ₹210 per kVA per month. Slab thresholds are prorated on a 30-day basis." },
  "LTPS-I": { group: "Other LT", unit: "kVAh", kind: "flat", rates: [5.55], labels: ["All units"], fixed: 220, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load (kVA)", hint: "Water works and government supply: ₹220 per kVA per month and ₹5.55 per kVAh." },
  "LTPS-II": { group: "Other LT", unit: "kWh", kind: "flat", rates: [5.55], labels: ["All units"], fixed: 220, fixedBasis: "kW", ed: null, loadLabel: "Sanctioned load (kW)", hint: "Public lighting and sign board supply: ₹220 per kW per month and ₹5.55 per kWh." },
  "LTPS-III": { group: "Other LT", unit: "kWh", kind: "flat", rates: [5.55], labels: ["All units"], fixed: 220, fixedBasis: "kW", ed: null, loadLabel: "Sanctioned load (kW)", hint: "Defence, railway and MES supply: ₹220 per kW per month and ₹5.55 per kWh." },
  "LTEV-I": { group: "EV", unit: "kVAh", kind: "flat", rates: [4.4], labels: ["All units"], fixed: 30, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load (kVA)", hint: "Electric vehicle supply: ₹30 per kVA per month and ₹4.40 per kVAh." },
  "HTS-I": { group: "High Tension", unit: "kVAh", kind: "flat", rates: [5.5], labels: ["All units"], fixed: 40, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "HTS-I: ₹40 per kVA per month and ₹5.50 per kVAh." },
  "HTS-II": { group: "High Tension", unit: "kVAh", kind: "flat", rates: [5.6], labels: ["All units"], fixed: 125, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "HTS-II: ₹125 per kVA per month and ₹5.60 per kVAh." },
  "HTS-III": { group: "High Tension", unit: "kVAh", kind: "flat", rates: [2.85], labels: ["All units"], fixed: 20, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "HTS-III: ₹20 per kVA per month and ₹2.85 per kVAh." },
  "HTS-IV": { group: "High Tension", unit: "kVAh", kind: "flat", rates: [4.15], labels: ["All units"], fixed: 220, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "HTS-IV: ₹220 per kVA per month and ₹4.15 per kVAh." },
  "HTS-V": { group: "High Tension", unit: "kVAh", kind: "flat", rates: [5.0], labels: ["All units"], fixed: 225, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "HTS-V: ₹225 per kVA per month and ₹5.00 per kVAh." },
  "HTS-VI": { group: "High Tension", unit: "kVAh", kind: "flat", rates: [4.35], labels: ["All units"], fixed: 100, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "HTS-VI: ₹100 per kVA per month and ₹4.35 per kVAh." },
  "EHTS-I": { group: "Extra High Tension", unit: "kVAh", kind: "flat", rates: [5.55], labels: ["All units"], fixed: 120, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "EHTS-I: ₹120 per kVA per month and ₹5.55 per kVAh." },
  "EHTS-II": { group: "Extra High Tension", unit: "kVAh", kind: "flat", rates: [4.1], labels: ["All units"], fixed: 240, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "EHTS-II: ₹240 per kVA per month and ₹4.10 per kVAh." },
  "EHTS-III": { group: "Extra High Tension", unit: "kVAh", kind: "flat", rates: [4.75], labels: ["All units"], fixed: 220, fixedBasis: "kVA", ed: null, loadLabel: "Sanctioned load / demand (kVA)", hint: "EHTS-III: ₹220 per kVA per month and ₹4.75 per kVAh." },
  TEMP: { group: "Temporary", unit: "kWh", kind: "flat", rates: [0], labels: ["All units"], fixed: 0, fixedBasis: "kW", ed: null, loadLabel: "Sanctioned load (kW)", hint: "Temporary supply is charged at the relevant tariff plus 50%. This is a manual placeholder and must be adjusted before use." },
} satisfies Record<string, TariffConfig>;

export type TariffKey = keyof typeof TARIFFS;

const RATES_2025_26: Partial<Record<TariffKey, TariffRateSet>> = {
  "LTDS-I": { kind: "flat", rates: [2.75], fixed: 30, fixedBasis: "connection", ed: 0.09 },
  "LTDS-II": { kind: "slabs", rates: [2.8, 3.75, 4.8, 5, 5.4], fixed: 30, fixedBasis: "kW", ed: 0.09 },
  "LTDS-III": { kind: "slabs", rates: [2.85, 3.8, 4.85, 5.05, 5.45], fixed: 30, fixedBasis: "kW", ed: 0.09 },
  "NDS-I": { kind: "slabs3", rates: [4.5, 4.6, 5.5], fixed: 120, fixedBasis: "kW" },
  "NDS-II": { kind: "slabs3", rates: [4.55, 4.65, 5.55], fixed: 120, fixedBasis: "kVA" },
  "NDS-III": { kind: "flat", rates: [6.6], fixed: 160, fixedBasis: "kVA" },
  "NDS-IV": { kind: "flat", rates: [5.0], fixed: 120, fixedBasis: "kVA" },
  "NDS-V": { kind: "flat", rates: [2.8], fixed: 30, fixedBasis: "kW" },
  "LTAS-I": { kind: "flat", rates: [2.85], fixed: 10, fixedBasis: "kW", ed: 0 },
  "LTAS-II": { kind: "flat", rates: [2.9], fixed: 20, fixedBasis: "kVA", ed: 0 },
  "LTAS-III": { kind: "flat", rates: [3.1], fixed: 20, fixedBasis: "kVA", ed: 0 },
  "LTIS-I": { kind: "customSlabs", thresholds: [500, 1000], rates: [4.4, 4.5, 4.6], fixed: 200, fixedBasis: "kVA" },
  "LTPS-I": { kind: "flat", rates: [5.5], fixed: 220, fixedBasis: "kVA" },
  "LTPS-II": { kind: "flat", rates: [5.5], fixed: 220, fixedBasis: "kW" },
  "LTPS-III": { kind: "flat", rates: [5.5], fixed: 220, fixedBasis: "kW" },
  "LTEV-I": { kind: "flat", rates: [4.3], fixed: 25, fixedBasis: "kVA" },
  "HTS-I": { kind: "flat", rates: [5.4], fixed: 30, fixedBasis: "kVA" },
  "HTS-II": { kind: "flat", rates: [5.5], fixed: 120, fixedBasis: "kVA" },
  "HTS-III": { kind: "flat", rates: [2.8], fixed: 20, fixedBasis: "kVA" },
  "HTS-IV": { kind: "flat", rates: [4.0], fixed: 220, fixedBasis: "kVA" },
  "HTS-V": { kind: "flat", rates: [4.5], fixed: 220, fixedBasis: "kVA" },
  "HTS-VI": { kind: "flat", rates: [4.25], fixed: 50, fixedBasis: "kVA" },
  "EHTS-I": { kind: "flat", rates: [5.45], fixed: 120, fixedBasis: "kVA" },
  "EHTS-II": { kind: "flat", rates: [3.95], fixed: 240, fixedBasis: "kVA" },
  "EHTS-III": { kind: "flat", rates: [4.5], fixed: 220, fixedBasis: "kVA" },
};

const RATES_OLD: Partial<Record<TariffKey, TariffRateSet>> = {
  "LTDS-II": { kind: "slabs", rates: [2.75, 4.8, 5.4], thresholds: [150, 400], labels: ["0–150", "151–400", "Above 400"], fixed: 30, fixedBasis: "kW", ed: 0.09 },
  "NDS-I": { kind: "slabs", rates: [4.5, 4.7, 5.9], thresholds: [150, 400], labels: ["0–150", "151–400", "Above 400"], fixed: 120, fixedBasis: "kW" },
  "HTS-IV": { kind: "flat", rates: [4.35], fixed: 240, fixedBasis: "kW" },
  "LTAS-I": { kind: "flat", rates: [2.85], fixed: 0, fixedBasis: "kW", ed: 0 },
  "LTPS-II": { kind: "flat", rates: [5.5], fixed: 150, fixedBasis: "connection" },
  "LTEV-I": { kind: "flat", rates: [4.3], fixed: 0, fixedBasis: "connection" },
};

export const TARIFF_SUBTYPES: Partial<
  Record<TariffKey, { value: TariffSubtype; label: string }[]>
> = {
  "NDS-I": [
    { value: "three", label: "LT Commercial – Three Phase (₹120/kW/month)" },
    { value: "single", label: "LT Commercial – Single Phase (₹50/kW/month)" },
  ],
  "HTS-IV": [
    { value: "large", label: "Large Industry" },
    { value: "htcommercial", label: "HT Commercial" },
  ],
  "LTPS-II": [
    { value: "municipal", label: "Municipal / Street Lighting" },
    { value: "advert", label: "Advertisement / Neon Sign" },
  ],
  "LTEV-I": [
    { value: "evlt", label: "EV Charging LT" },
    { value: "evht", label: "EV Charging HT" },
  ],
};

export function getSubtypeOptions(category: TariffKey): { value: TariffSubtype; label: string }[] {
  return TARIFF_SUBTYPES[category] ?? [];
}

export function getDefaultSubtype(category: TariffKey): TariffSubtype {
  return TARIFF_SUBTYPES[category]?.[0]?.value ?? "default";
}

export function getSubtypeLabel(category: TariffKey, subtype: TariffSubtype): string {
  return TARIFF_SUBTYPES[category]?.find((option) => option.value === subtype)?.label ?? "Standard";
}

export const TARIFF_GROUPS: { label: string; keys: TariffKey[] }[] = [
  { label: "Domestic supply", keys: ["LTDS-I", "LTDS-II", "LTDS-III"] },
  { label: "Commercial / non-residential", keys: ["NDS-I", "NDS-II", "NDS-III", "NDS-IV", "NDS-V"] },
  { label: "Agricultural pumping supply (2026–27)", keys: ["LTAS-I", "LTAS-II", "LTAS-III"] },
  { label: "Small power & medium supply (2026–27)", keys: ["LTIS-I"] },
  { label: "Water works / government & public services (2026–27)", keys: ["LTPS-I", "LTPS-II", "LTPS-III"] },
  { label: "Electric vehicle (2026–27)", keys: ["LTEV-I"] },
  { label: "High tension (2026–27)", keys: ["HTS-I", "HTS-II", "HTS-III", "HTS-IV", "HTS-V", "HTS-VI"] },
  { label: "Extra high tension (2026–27)", keys: ["EHTS-I", "EHTS-II", "EHTS-III"] },
  { label: "Temporary supply", keys: ["TEMP"] },
];

export function getConsumptionUnit(config: TariffConfig): ConsumptionUnit {
  return config.unit ?? (config.group === "Commercial" ? "kVAh" : "kWh");
}

export function getLoadUnit(config: TariffConfig): string {
  return /\(([^)]+)\)\s*$/.exec(config.loadLabel)?.[1] ?? "kW";
}

export function getLoadLabel(config: TariffConfig): string {
  return config.loadLabel.replace(/\s*\([^)]*\)\s*$/, "");
}

export function getBaseThresholds(config: TariffConfig): number[] {
  if (config.thresholds) return config.thresholds;
  return config.kind === "slabs3" ? [100, 200] : [100, 200, 300, 400];
}

function parseIsoDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const timestamp = Date.UTC(year, month - 1, day);
  const date = new Date(timestamp);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return timestamp;
}

function pad2(value: number): string {
  return value.toString().padStart(2, "0");
}

export function addDays(value: string, days: number): string {
  const timestamp = parseIsoDate(value);
  if (timestamp === null) return value;
  const date = new Date(timestamp + days * 86_400_000);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function billingDays(from: string, to: string): number | null {
  if (!from || !to) return null;
  const start = parseIsoDate(from);
  const end = parseIsoDate(to);
  if (start === null || end === null) return null;
  return Math.floor((end - start) / 86_400_000);
}

export function tariffPeriodFor(date: string): TariffPeriodId {
  if (date < "2025-11-01") return "old";
  if (date < "2026-04-01") return "2025-26";
  return "2026-27";
}

export function getTariffPeriod(id: TariffPeriodId): TariffPeriod {
  return TARIFF_PERIODS.find((period) => period.id === id) ?? TARIFF_PERIODS[2];
}

export function edRateFor(category: TariffKey): number {
  if (category === "LTDS-II") return ED_RATE_LTDS_II;
  if (TARIFFS[category]?.group === "Agricultural") return ED_RATE_AGRICULTURAL;
  return ED_RATE_DEFAULT;
}

export function mcRateFor(date: string): number {
  return date < "2026-04-01" ? MC_RATE_BEFORE_APR_2026 : MC_RATE_FROM_APR_2026;
}

function fallbackLabels(kind: TariffKind): string[] {
  if (kind === "flat") return ["All units"];
  if (kind === "slabs3") return ["0–100", "101–200", "Above 200"];
  if (kind === "customSlabs") return ["0–500", "501–1000", "Above 1000"];
  return ["0–100", "101–200", "201–300", "301–400", "Above 400"];
}

function mergeRateSet(base: TariffConfig, rates: TariffRateSet): TariffConfig {
  const sameKind = rates.kind === base.kind;
  return {
    ...base,
    kind: rates.kind,
    rates: rates.rates,
    fixed: rates.fixed,
    fixedBasis: rates.fixedBasis,
    thresholds: rates.thresholds ?? (sameKind ? base.thresholds : undefined),
    labels: rates.labels ?? (sameKind ? base.labels : fallbackLabels(rates.kind)),
    ed: rates.ed === undefined ? base.ed : rates.ed,
  };
}

export function resolveTariff(
  category: TariffKey,
  periodStart: string,
  subtype: TariffSubtype = "default",
): TariffConfig {
  const base = TARIFFS[category];
  const period = tariffPeriodFor(periodStart);
  let config: TariffConfig;

  if (period === "old") {
    const oldRates = RATES_OLD[category];
    const fallback = RATES_2025_26[category];
    config = oldRates ? mergeRateSet(base, oldRates) : fallback ? mergeRateSet(base, fallback) : base;

    if (category === "HTS-IV" && subtype === "htcommercial") {
      config = mergeRateSet(base, { kind: "flat", rates: [4.65], fixed: 120, fixedBasis: "kW" });
    }
    if (category === "LTPS-II" && subtype === "advert") {
      config = mergeRateSet(base, { kind: "flat", rates: [6.6], fixed: 160, fixedBasis: "connection" });
    }
    if (category === "LTEV-I" && subtype === "evht") {
      config = mergeRateSet(base, { kind: "flat", rates: [4.0], fixed: 0, fixedBasis: "connection" });
    }
  } else if (period === "2025-26") {
    const rates = RATES_2025_26[category];
    config = rates ? mergeRateSet(base, rates) : base;
    if (category === "HTS-IV" && subtype === "htcommercial") {
      const htCommercial = RATES_2025_26["HTS-II"];
      if (htCommercial) config = mergeRateSet(base, htCommercial);
    }
  } else {
    config = base;
  }

  if (category === "NDS-I") {
    config = { ...config, fixed: subtype === "single" ? 50 : 120, fixedBasis: "kW" };
  }

  return config;
}

export interface BillSegmentDates {
  start: string;
  end: string;
  days: number;
}

export function segmentBillingPeriods(from: string, to: string): BillSegmentDates[] {
  if (!from || !to || to <= from) return [];
  const firstBilledDay = addDays(from, 1);
  const windows = [
    { start: firstBilledDay, end: TARIFF_PERIOD_ENDS[0] },
    { start: TARIFF_CUTOFFS[0], end: TARIFF_PERIOD_ENDS[1] },
    { start: TARIFF_CUTOFFS[1], end: to },
  ];
  const segments: BillSegmentDates[] = [];
  for (const window of windows) {
    const start = window.start > firstBilledDay ? window.start : firstBilledDay;
    const end = window.end < to ? window.end : to;
    const elapsed = billingDays(start, end);
    if (elapsed !== null && elapsed >= 0) {
      segments.push({ start, end, days: elapsed + 1 });
    }
  }
  return segments;
}

export interface BillInputs {
  from: string;
  to: string;
  units: number;
  load: number;
  /** FPPCA as a rupee amount for the whole billing window. */
  fppca?: number;
  /** Legacy: FPPCA as a percentage of energy plus fixed charges. */
  fppcaPercent?: number;
  subtype?: TariffSubtype;
}

export interface SlabRow {
  label: string;
  units: number;
  rate: number;
  amount: number;
}

export interface BillSegment {
  period: TariffPeriodId;
  label: string;
  from: string;
  to: string;
  days: number;
  units: number;
  rows: SlabRow[];
  energy: number;
  edRate: number;
  ed: number;
  mcRate: number;
  mc: number;
  fixedRate: number;
  fixedBasis: FixedBasis;
  fixedLoad: number;
  fixedLoadLabel: string;
  fixed: number;
  total: number;
}

export interface BillResult {
  category: TariffKey;
  subtype: TariffSubtype;
  unit: ConsumptionUnit;
  days: number;
  months: number;
  calculatedLoad: number;
  segments: BillSegment[];
  rows: SlabRow[];
  energy: number;
  ed: number;
  mc: number;
  fixed: number;
  fppca: number;
  total: number;
  exactLimit: number;
  slabLimit: number;
}

function splitSlabRows(
  config: TariffConfig,
  units: number,
  days: number,
): { rows: SlabRow[]; exactLimit: number; slabLimit: number } {
  if (config.kind === "flat") {
    const rate = config.rates[0] ?? 0;
    return {
      rows: [{ label: config.labels[0] ?? "All units", units, rate, amount: units * rate }],
      exactLimit: 0,
      slabLimit: 0,
    };
  }

  const baseThresholds = getBaseThresholds(config);
  const exactLimit = (baseThresholds[0] * days) / ENERGY_SLAB_MONTH;
  const thresholds = baseThresholds.map((threshold) => Math.round((threshold * days) / ENERGY_SLAB_MONTH));

  let previous = 0;
  const quantities = thresholds.map((threshold) => {
    const limit = Math.max(0, threshold);
    const quantity = Math.max(0, Math.min(limit - previous, units - previous));
    previous = limit;
    return quantity;
  });
  quantities.push(Math.max(0, units - previous));

  const rows: SlabRow[] = quantities.map((quantity, index) => ({
    label: config.labels[index] ?? "Remaining units",
    units: quantity,
    rate: config.rates[index] ?? 0,
    amount: quantity * (config.rates[index] ?? 0),
  }));

  return { rows, exactLimit, slabLimit: thresholds[0] ?? 0 };
}

export function calculateBill(category: TariffKey, inputs: BillInputs): BillResult {
  const { from, to, units, load } = inputs;
  const subtype = inputs.subtype ?? getDefaultSubtype(category);

  const hasFppcaAmount = typeof inputs.fppca === "number" && Number.isFinite(inputs.fppca);
  const hasFppcaPercent = typeof inputs.fppcaPercent === "number" && Number.isFinite(inputs.fppcaPercent);
  const fppcaAmount = hasFppcaAmount ? (inputs.fppca as number) : 0;
  const fppcaPercent = !hasFppcaAmount && hasFppcaPercent ? (inputs.fppcaPercent as number) : null;

  const days = billingDays(from, to) ?? 0;
  // Fixed charges bill both reading dates, i.e. elapsed days + 1.
  const fixedDays = days > 0 ? days : 0;
  const months = fixedDays / FIXED_CHARGE_MONTH;
  const calculatedLoad = load * FIXED_LOAD_FACTOR;
  const periodDates = segmentBillingPeriods(from, to);
  const unit = getConsumptionUnit(TARIFFS[category]);

  const empty: BillResult = {
    category,
    subtype,
    unit,
    days,
    months,
    calculatedLoad,
    segments: [],
    rows: [],
    energy: 0,
    ed: 0,
    mc: 0,
    fixed: 0,
    fppca: fppcaPercent === null ? fppcaAmount : 0,
    total: fppcaPercent === null ? fppcaAmount : 0,
    exactLimit: 0,
    slabLimit: 0,
  };

  if (days <= 0 || periodDates.length === 0) return empty;

  let allocatedUnits = 0;
  let exactLimit = 0;
  let slabLimit = 0;
  let firstSlabPeriod = true;

  const segments: BillSegment[] = periodDates.map((segment, index) => {
    const isLast = index === periodDates.length - 1;
    const segmentUnits = isLast ? Math.max(0, units - allocatedUnits) : (units * segment.days) / days;
    allocatedUnits += segmentUnits;

    const config = resolveTariff(category, segment.start, subtype);
    const split = splitSlabRows(config, segmentUnits, segment.days);

    if (config.kind !== "flat" && firstSlabPeriod) {
      exactLimit = split.exactLimit;
      slabLimit = split.slabLimit;
      firstSlabPeriod = false;
    }

    const energy = split.rows.reduce((sum, row) => sum + row.amount, 0);
    const edRate = edRateFor(category);
    const ed = edRate * segmentUnits;
    const mcRate = mcRateFor(segment.start);
    const mc = mcRate * segmentUnits;
    const isOldTariff = segment.start < "2025-11-01";
    const segmentFixedDays = days > 0 ? (segment.days / days) * fixedDays : 0;
    const fixedLoad = config.fixedBasis === "connection" ? 1 : isOldTariff ? load : calculatedLoad;
    const fixed = config.fixed * fixedLoad * (segmentFixedDays / FIXED_CHARGE_MONTH);

    return {
      period: tariffPeriodFor(segment.start),
      label: getTariffPeriod(tariffPeriodFor(segment.start)).label,
      from: segment.start,
      to: segment.end,
      days: segment.days,
      units: segmentUnits,
      rows: split.rows,
      energy,
      edRate,
      ed,
      mcRate,
      mc,
      fixedRate: config.fixed,
      fixedBasis: config.fixedBasis,
      fixedLoad,
      fixedLoadLabel:
        config.fixedBasis === "connection"
          ? "Connection-based"
          : isOldTariff
            ? "Full sanctioned load"
            : "Sanctioned load × 0.85",
      fixed,
      total: energy + ed + mc + fixed,
    };
  });

  const rows = segments.flatMap((segment) =>
    segment.rows.map((row) => ({ ...row, label: `${segment.label} · ${row.label}` })),
  );

  const energy = segments.reduce((sum, segment) => sum + segment.energy, 0);
  const ed = segments.reduce((sum, segment) => sum + segment.ed, 0);
  const mc = segments.reduce((sum, segment) => sum + segment.mc, 0);
  const fixed = segments.reduce((sum, segment) => sum + segment.fixed, 0);
  const fppca = fppcaPercent === null ? fppcaAmount : ((energy + fixed) * fppcaPercent) / 100;

  return {
    category,
    subtype,
    unit,
    days,
    months,
    calculatedLoad,
    segments,
    rows,
    energy,
    ed,
    mc,
    fixed,
    fppca,
    total: energy + ed + mc + fixed + fppca,
    exactLimit,
    slabLimit,
  };
}
