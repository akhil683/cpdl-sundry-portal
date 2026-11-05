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

export const FIXED_CHARGE_MONTH = 365 / 12;
export const ENERGY_SLAB_MONTH = 30;
export const MC_RATE = 0.16;

/**
 * Tariff schedule values carried over from the current CPDL sundry billing
 * workbook. Keep these figures aligned with the applicable tariff order.
 */
export const TARIFFS = {
  "LTDS-I": {
    group: "Domestic",
    kind: "flat",
    rates: [2.9],
    labels: ["All units"],
    fixed: 30,
    fixedBasis: "connection",
    ed: 0.09,
    loadLabel: "Connected load (kW)",
    hint: "₹30 per connection per month; applicable only for connected loads below 250 watts. Energy rate ₹2.90 per unit.",
  },
  "LTDS-II": {
    group: "Domestic",
    kind: "slabs",
    rates: [2.95, 3.75, 4.8, 5.0, 5.4],
    labels: ["0–100", "101–200", "201–300", "301–400", "Above 400"],
    fixed: 30,
    fixedBasis: "kW",
    ed: 0.09,
    loadLabel: "Connected load (kW)",
    hint: "₹30 per kW per month fixed charge, with consumption charged across five energy slabs.",
  },
  "LTDS-III": {
    group: "Domestic",
    kind: "slabs",
    rates: [3.0, 3.8, 4.85, 5.05, 5.45],
    labels: ["0–100", "101–200", "201–300", "301–400", "Above 400"],
    fixed: 30,
    fixedBasis: "kW",
    ed: 0.09,
    loadLabel: "Connected load (kW)",
    hint: "₹30 per kW per month fixed charge, with consumption charged across five energy slabs.",
  },
  "NDS-I": {
    group: "Commercial",
    kind: "slabs3",
    rates: [4.6, 4.8, 5.75],
    labels: ["0–100", "101–200", "Above 200"],
    fixed: 120,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "₹120 per kVA per month fixed charge, with consumption charged across three energy slabs.",
  },
  "NDS-II": {
    group: "Commercial",
    kind: "slabs3",
    rates: [4.65, 4.75, 5.8],
    labels: ["0–100", "101–200", "Above 200"],
    fixed: 120,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "₹120 per kVA per month fixed charge, with consumption charged across three energy slabs.",
  },
  "NDS-III": {
    group: "Commercial",
    kind: "flat",
    rates: [6.7],
    labels: ["All units"],
    fixed: 160,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "₹160 per kVA per month fixed charge, with a flat energy rate of ₹6.70 per unit.",
  },
  "NDS-IV": {
    group: "Commercial",
    kind: "flat",
    rates: [5.55],
    labels: ["All units"],
    fixed: 120,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "₹120 per kVA per month fixed charge, with a flat energy rate of ₹5.55 per unit.",
  },
  "NDS-V": {
    group: "Commercial",
    unit: "kWh",
    kind: "flat",
    rates: [2.95],
    labels: ["All units"],
    fixed: 30,
    fixedBasis: "kW",
    ed: null,
    loadLabel: "Connected load (kW)",
    hint: "₹30 per kW per month fixed charge, with a flat energy rate of ₹2.95 per unit.",
  },
  "LTAS-I": {
    group: "Agricultural",
    unit: "kWh",
    kind: "flat",
    rates: [2.9],
    labels: ["All units"],
    fixed: 10,
    fixedBasis: "kW",
    ed: 0,
    loadLabel: "Connected load (kW)",
    hint: "Agricultural pumping supply: ₹10 per kW per month and ₹2.90 per kWh.",
  },
  "LTAS-II": {
    group: "Agricultural",
    unit: "kVAh",
    kind: "flat",
    rates: [2.95],
    labels: ["All units"],
    fixed: 20,
    fixedBasis: "kVA",
    ed: 0,
    loadLabel: "Connected load (kVA)",
    hint: "Agricultural pumping supply: ₹20 per kVA per month and ₹2.95 per kVAh.",
  },
  "LTAS-III": {
    group: "Agricultural",
    unit: "kVAh",
    kind: "flat",
    rates: [3.1],
    labels: ["All units"],
    fixed: 20,
    fixedBasis: "kVA",
    ed: 0,
    loadLabel: "Connected load (kVA)",
    hint: "Agricultural pumping supply: ₹20 per kVA per month and ₹3.10 per kVAh.",
  },
  "SPMS-LTDS-I": {
    group: "Other LT",
    unit: "kVAh",
    kind: "customSlabs",
    thresholds: [500, 1000],
    rates: [4.5, 4.6, 4.7],
    labels: ["0–500", "501–1000", "Above 1000"],
    fixed: 210,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "Small power and medium supply: ₹210 per kVA per month. Slab thresholds are prorated on a 30-day basis.",
  },
  "LTPS-I": {
    group: "Other LT",
    unit: "kVAh",
    kind: "flat",
    rates: [5.55],
    labels: ["All units"],
    fixed: 220,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "Water works and government supply: ₹220 per kVA per month and ₹5.55 per kVAh.",
  },
  "LTPS-II": {
    group: "Other LT",
    unit: "kWh",
    kind: "flat",
    rates: [5.55],
    labels: ["All units"],
    fixed: 220,
    fixedBasis: "kW",
    ed: null,
    loadLabel: "Connected load (kW)",
    hint: "Public lighting and sign board supply: ₹220 per kW per month and ₹5.55 per kWh.",
  },
  "LTPS-III": {
    group: "Other LT",
    unit: "kWh",
    kind: "flat",
    rates: [5.55],
    labels: ["All units"],
    fixed: 220,
    fixedBasis: "kW",
    ed: null,
    loadLabel: "Connected load (kW)",
    hint: "Defence, railway and MES supply: ₹220 per kW per month and ₹5.55 per kWh.",
  },
  "LTEV-I": {
    group: "EV",
    unit: "kVAh",
    kind: "flat",
    rates: [4.4],
    labels: ["All units"],
    fixed: 30,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Connected load (kVA)",
    hint: "Electric vehicle supply: ₹30 per kVA per month and ₹4.40 per kVAh.",
  },
  "HTS-I": {
    group: "High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [5.5],
    labels: ["All units"],
    fixed: 40,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "HTS-I: ₹40 per kVA per month and ₹5.50 per kVAh.",
  },
  "HTS-II": {
    group: "High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [5.6],
    labels: ["All units"],
    fixed: 125,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "HTS-II: ₹125 per kVA per month and ₹5.60 per kVAh.",
  },
  "HTS-III": {
    group: "High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [2.85],
    labels: ["All units"],
    fixed: 20,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "HTS-III: ₹20 per kVA per month and ₹2.85 per kVAh.",
  },
  "HTS-IV": {
    group: "High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [4.15],
    labels: ["All units"],
    fixed: 220,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "HTS-IV: ₹220 per kVA per month and ₹4.15 per kVAh.",
  },
  "HTS-V": {
    group: "High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [5.0],
    labels: ["All units"],
    fixed: 225,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "HTS-V: ₹225 per kVA per month and ₹5.00 per kVAh.",
  },
  "HTS-VI": {
    group: "High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [4.35],
    labels: ["All units"],
    fixed: 100,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "HTS-VI: ₹100 per kVA per month and ₹4.35 per kVAh.",
  },
  "EHTS-I": {
    group: "Extra High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [5.55],
    labels: ["All units"],
    fixed: 120,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "EHTS-I: ₹120 per kVA per month and ₹5.55 per kVAh.",
  },
  "EHTS-II": {
    group: "Extra High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [4.1],
    labels: ["All units"],
    fixed: 240,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "EHTS-II: ₹240 per kVA per month and ₹4.10 per kVAh.",
  },
  "EHTS-III": {
    group: "Extra High Tension",
    unit: "kVAh",
    kind: "flat",
    rates: [4.75],
    labels: ["All units"],
    fixed: 220,
    fixedBasis: "kVA",
    ed: null,
    loadLabel: "Contract demand (kVA)",
    hint: "EHTS-III: ₹220 per kVA per month and ₹4.75 per kVAh.",
  },
  TEMP: {
    group: "Temporary",
    unit: "kWh",
    kind: "flat",
    rates: [0],
    labels: ["All units"],
    fixed: 0,
    fixedBasis: "kW",
    ed: null,
    loadLabel: "Connected load (kW)",
    hint: "Temporary supply is charged at the relevant tariff plus 50%. This is a manual placeholder and must be adjusted before use.",
  },
} satisfies Record<string, TariffConfig>;

export type TariffKey = keyof typeof TARIFFS;

export const TARIFF_GROUPS: { label: string; keys: TariffKey[] }[] = [
  {
    label: "Domestic supply",
    keys: ["LTDS-I", "LTDS-II", "LTDS-III"],
  },
  {
    label: "Commercial / non-residential",
    keys: ["NDS-I", "NDS-II", "NDS-III", "NDS-IV", "NDS-V"],
  },
  {
    label: "Agricultural pumping supply (2026–27)",
    keys: ["LTAS-I", "LTAS-II", "LTAS-III"],
  },
  {
    label: "Small power & medium supply (2026–27)",
    keys: ["SPMS-LTDS-I"],
  },
  {
    label: "Water works / government & public services (2026–27)",
    keys: ["LTPS-I", "LTPS-II", "LTPS-III"],
  },
  {
    label: "Electric vehicle (2026–27)",
    keys: ["LTEV-I"],
  },
  {
    label: "High tension (2026–27)",
    keys: ["HTS-I", "HTS-II", "HTS-III", "HTS-IV", "HTS-V", "HTS-VI"],
  },
  {
    label: "Extra high tension (2026–27)",
    keys: ["EHTS-I", "EHTS-II", "EHTS-III"],
  },
  {
    label: "Temporary supply",
    keys: ["TEMP"],
  },
];

export function getConsumptionUnit(config: TariffConfig): ConsumptionUnit {
  return config.unit ?? (config.group === "Commercial" ? "kVAh" : "kWh");
}

export function getLoadUnit(config: TariffConfig): string {
  const match = /\(([^)]+)\)\s*$/.exec(config.loadLabel);
  return match?.[1] ?? "kW";
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

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return timestamp;
}

/** Elapsed billing days. The from date is excluded from the count. */
export function billingDays(from: string, to: string): number | null {
  if (!from || !to) return null;

  const start = parseIsoDate(from);
  const end = parseIsoDate(to);

  if (start === null || end === null) return null;

  return Math.floor((end - start) / 86_400_000);
}

export interface BillInputs {
  days: number;
  units: number;
  load: number;
  fppca: number;
  edRate: number;
}

export interface SlabRow {
  label: string;
  units: number;
  rate: number;
  amount: number;
}

export interface BillResult {
  unit: ConsumptionUnit;
  days: number;
  months: number;
  exactLimit: number;
  slabLimit: number;
  rows: SlabRow[];
  energy: number;
  ed: number;
  mc: number;
  fixed: number;
  fppca: number;
  total: number;
}

export function calculateBill(
  config: TariffConfig,
  inputs: BillInputs,
): BillResult {
  const { days, units, load, fppca, edRate } = inputs;
  const months = days / FIXED_CHARGE_MONTH;
  const baseThresholds = getBaseThresholds(config);
  const exactLimit = (baseThresholds[0] * days) / ENERGY_SLAB_MONTH;
  const slabLimit = Math.round(exactLimit);

  let quantities: number[];

  if (config.kind === "flat") {
    quantities = [units];
  } else {
    const thresholds = baseThresholds.map((threshold) =>
      Math.round((threshold * days) / ENERGY_SLAB_MONTH),
    );

    let previous = 0;
    quantities = thresholds.map((threshold) => {
      const limit = Math.max(0, threshold);
      const quantity = Math.max(
        0,
        Math.min(limit - previous, units - previous),
      );
      previous = limit;
      return quantity;
    });
    quantities.push(Math.max(0, units - previous));
  }

  const rows: SlabRow[] = quantities.map((quantity, index) => ({
    label: config.labels[index] ?? "Remaining units",
    units: quantity,
    rate: config.rates[index] ?? 0,
    amount: quantity * (config.rates[index] ?? 0),
  }));

  const energy = rows.reduce((sum, row) => sum + row.amount, 0);
  const ed = edRate * units;
  const mc = MC_RATE * units;
  const fixed =
    config.fixed *
    (config.fixedBasis === "connection" ? 1 : load) *
    months;
  const total = energy + ed + mc + fixed + fppca;

  return {
    unit: getConsumptionUnit(config),
    days,
    months,
    exactLimit,
    slabLimit,
    rows,
    energy,
    ed,
    mc,
    fixed,
    fppca,
    total,
  };
}
