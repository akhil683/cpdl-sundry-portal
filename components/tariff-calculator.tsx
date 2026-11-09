"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Copy,
  History as HistoryIcon,
  Info,
  Printer,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import {
  TARIFFS,
  TARIFF_GROUPS,
  billingDays,
  calculateBill,
  getBaseThresholds,
  getConsumptionUnit,
  getLoadLabel,
  getLoadUnit,
  type BillResult,
  type TariffKey,
} from "@/lib/tariff";
import {
  formatCurrency,
  formatDate,
  formatMonths,
  formatQuantity,
} from "@/lib/format";
import {
  saveCalculation,
  type SaveCalculationStatus,
} from "@/lib/history";

interface FormState {
  category: TariffKey;
  from: string;
  to: string;
  units: string;
  load: string;
  fppca: string;
  edRate: string;
}

interface FormErrors {
  dates?: string;
  units?: string;
  load?: string;
  fppca?: string;
  edRate?: string;
}

interface Estimate extends BillResult {
  category: TariffKey;
  units: number;
  load: number;
  edRate: number;
}

type StatusTone = "idle" | "success" | "error";
type CopyState = "idle" | "copied" | "error";

interface StatusState {
  tone: StatusTone;
  message: string;
}

const INITIAL_FORM: FormState = {
  category: "LTDS-II",
  from: "",
  to: "",
  units: "800",
  load: "5",
  fppca: "0",
  edRate: "0.09",
};

const INITIAL_STATUS: StatusState = {
  tone: "idle",
  message: "Enter a billing period and consumption, then calculate the estimate.",
};

function parseAmount(value: string): number {
  return value.trim() === "" ? 0 : Number(value);
}

function buildReport(
  estimate: Estimate,
  dates: { from: string; to: string },
): string {
  const config = TARIFFS[estimate.category];
  const baseThresholds = getBaseThresholds(config);
  const fixedUnit =
    config.fixedBasis === "connection" ? "connection" : config.fixedBasis;
  const lines = [
    "CPDL — SUNDRY BILL ESTIMATE",
    `Category: ${estimate.category}`,
    `Billing period: ${dates.from} to ${dates.to}`,
    `Billing days (elapsed): ${estimate.days}`,
    `Consumption: ${formatQuantity(estimate.units)} ${estimate.unit}`,
    `${getLoadLabel(config)}: ${formatQuantity(estimate.load)} ${getLoadUnit(config)}`,
    `Fixed-charge months (days ÷ 30.4167): ${formatMonths(estimate.months)}`,
  ];

  if (config.kind !== "flat") {
    lines.push(
      `First slab entitlement (${baseThresholds[0]} × days ÷ 30): ${estimate.exactLimit.toFixed(4)}`,
      `Rounded energy slab limit: ${estimate.slabLimit} ${estimate.unit}`,
    );
  }

  lines.push(
    "",
    "ENERGY CHARGES",
    ...estimate.rows.map(
      (row) =>
        `${row.label}: ${formatQuantity(row.units)} × ${formatCurrency(row.rate)} = ${formatCurrency(row.amount)}`,
    ),
    `Energy charges: ${formatCurrency(estimate.energy)}`,
    "",
    "OTHER CHARGES",
    `Electricity duty (${formatCurrency(estimate.edRate)} / ${estimate.unit}): ${formatCurrency(estimate.ed)}`,
    `MC tax (₹0.16 / ${estimate.unit}): ${formatCurrency(estimate.mc)}`,
    `Fixed charges (${formatCurrency(config.fixed)} / ${fixedUnit} / month × ${formatMonths(estimate.months)} months): ${formatCurrency(estimate.fixed)}`,
    `FPPCA: ${formatCurrency(estimate.fppca)}`,
    "",
    `APPROXIMATE TOTAL: ${formatCurrency(estimate.total)}`,
  );

  if (estimate.category === "LTDS-I" && estimate.load >= 0.25) {
    lines.push(
      "",
      "ELIGIBILITY CHECK",
      "LTDS-I is marked for connected loads below 250 W. Confirm the consumer's eligibility before use.",
    );
  }

  if (estimate.category === "TEMP") {
    lines.push(
      "",
      "TARIFF NOTE",
      "Temporary supply is charged at the relevant tariff plus 50%. The placeholder rate must be adjusted before use.",
    );
  }

  lines.push(
    "",
    "Estimate only. Verify the applicable tariff order and SOP before official billing.",
  );

  return lines.join("\n");
}

export function TariffCalculator() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [status, setStatus] = useState<StatusState>(INITIAL_STATUS);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [historyStatus, setHistoryStatus] =
    useState<SaveCalculationStatus | null>(null);

  const reportRef = useRef("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  const config = TARIFFS[form.category];
  const unit = getConsumptionUnit(config);
  const loadUnit = getLoadUnit(config);
  const loadLabel = getLoadLabel(config);
  const liveDays = billingDays(form.from, form.to);
  const visibleDays = liveDays !== null && liveDays > 0 ? liveDays : null;

  function clearCopyTimer() {
    if (copyTimer.current) {
      clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }
  }

  function markCopyState(next: CopyState) {
    clearCopyTimer();
    setCopyState(next);

    if (next !== "idle") {
      copyTimer.current = setTimeout(() => setCopyState("idle"), 1800);
    }
  }

  function clearCalculatedState() {
    setEstimate(null);
    setErrors({});
    setStatus(INITIAL_STATUS);
    setCopyState("idle");
    setHistoryStatus(null);
    reportRef.current = "";
    clearCopyTimer();
  }

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => {
      if (field === "category") {
        const category = value as TariffKey;
        const selected = TARIFFS[category];

        return {
          ...current,
          category,
          edRate: (selected.ed ?? 0).toFixed(2),
        };
      }

      return { ...current, [field]: value };
    });

    clearCalculatedState();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const days = billingDays(form.from, form.to);
    const units = parseAmount(form.units);
    const load = parseAmount(form.load);
    const fppca = parseAmount(form.fppca);
    const edValue = form.edRate.trim();
    const edRate = Number(edValue);

    if (!form.from || !form.to) {
      nextErrors.dates = "Select both the from and to dates.";
    } else if (days === null) {
      nextErrors.dates = "Enter valid billing dates.";
    } else if (days <= 0) {
      nextErrors.dates = "The to date must be after the from date.";
    }

    if (form.units.trim() === "" || !Number.isFinite(units) || units < 0) {
      nextErrors.units = "Enter total consumption as zero or more.";
    }

    if (form.load.trim() === "" || !Number.isFinite(load) || load < 0) {
      nextErrors.load = "Enter the connected load as zero or more.";
    }

    if (!Number.isFinite(fppca) || fppca < 0) {
      nextErrors.fppca = "Enter a valid FPPCA amount.";
    }

    if (
      edValue === "" ||
      !Number.isFinite(edRate) ||
      edRate < 0
    ) {
      nextErrors.edRate = "Enter a valid electricity duty rate.";
    }

    if (days === null || days <= 0) {
      setErrors(nextErrors);
      setEstimate(null);
      setCopyState("idle");
      reportRef.current = "";
      setStatus({
        tone: "error",
        message: "Check the highlighted billing dates and try again.",
      });
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setEstimate(null);
      setCopyState("idle");
      reportRef.current = "";
      setStatus({
        tone: "error",
        message: "Check the highlighted fields and try again.",
      });
      return;
    }

    const calculated = calculateBill(config, {
      days,
      units,
      load,
      fppca,
      edRate,
    });

    const nextEstimate: Estimate = {
      ...calculated,
      category: form.category,
      units,
      load,
      edRate,
    };

    const saveStatus = saveCalculation({
      category: nextEstimate.category,
      from: form.from,
      to: form.to,
      days: nextEstimate.days,
      units: nextEstimate.units,
      load: nextEstimate.load,
      fppca: nextEstimate.fppca,
      edRate: nextEstimate.edRate,
      unit: nextEstimate.unit,
      months: nextEstimate.months,
      exactLimit: nextEstimate.exactLimit,
      slabLimit: nextEstimate.slabLimit,
      rows: nextEstimate.rows,
      energy: nextEstimate.energy,
      ed: nextEstimate.ed,
      mc: nextEstimate.mc,
      fixed: nextEstimate.fixed,
      total: nextEstimate.total,
    });

    setEstimate(nextEstimate);
    setErrors({});
    setCopyState("idle");
    setHistoryStatus(saveStatus);
    setStatus({
      tone: "success",
      message:
        saveStatus === "unavailable"
          ? `Estimate prepared for ${form.category} across ${days} billing days. It could not be saved to browser history.`
          : saveStatus === "duplicate"
            ? `Estimate prepared for ${form.category} across ${days} billing days. This calculation is already in history.`
            : `Estimate prepared for ${form.category} across ${days} billing days and saved to history.`,
    });
    reportRef.current = buildReport(nextEstimate, {
      from: form.from,
      to: form.to,
    });
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    clearCalculatedState();
  }

  async function handleCopy() {
    if (!estimate || !reportRef.current) return;

    try {
      await navigator.clipboard.writeText(reportRef.current);
      markCopyState("copied");
    } catch {
      markCopyState("error");
    }
  }

  const hasEstimate = estimate !== null;
  const showEligibilityWarning =
    estimate?.category === "LTDS-I" && estimate.load >= 0.25;

  const copyLabel =
    copyState === "copied"
      ? "Copied"
      : copyState === "error"
        ? "Copy failed"
        : "Copy report";

  const metaSlabLabel =
    config.kind === "flat" ? "Energy rate" : "Slab limit";
  const metaSlabValue = estimate
    ? config.kind === "flat"
      ? formatCurrency(config.rates[0])
      : `${estimate.slabLimit} ${estimate.unit}`
    : "—";

  const statusIcon =
    status.tone === "success" ? (
      <CircleCheck size={14} strokeWidth={1.8} aria-hidden="true" />
    ) : status.tone === "error" ? (
      <CircleAlert size={14} strokeWidth={1.8} aria-hidden="true" />
    ) : (
      <Info size={14} strokeWidth={1.8} aria-hidden="true" />
    );

  return (
    <div className="calc-grid">
      <form className="card form-card" onSubmit={handleSubmit} noValidate>
        <div className="card-head">
          <div className="card-heading">
            <span className="card-index">01</span>
            <div>
              <h2>Billing inputs</h2>
              <p className="card-sub">
                Set the billing window, tariff category and consumption.
              </p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <fieldset className="form-section">
            <legend className="form-section-title">Billing period</legend>
            <p className="form-section-note" id="period-hint">
              Charges are prorated across the elapsed billing period. The from
              date is excluded from the day count.
            </p>

            <div className="period-grid">
              <div className="field">
                <label className="field-label" htmlFor="from-date">
                  From date
                </label>
                <input
                  id="from-date"
                  className="control"
                  type="date"
                  value={form.from}
                  onChange={(event) => updateField("from", event.target.value)}
                  aria-invalid={errors.dates ? true : undefined}
                  aria-describedby={
                    errors.dates ? "period-hint dates-error" : "period-hint"
                  }
                />
              </div>

              <div className="field">
                <label className="field-label" htmlFor="to-date">
                  To date
                </label>
                <input
                  id="to-date"
                  className="control"
                  type="date"
                  value={form.to}
                  onChange={(event) => updateField("to", event.target.value)}
                  aria-invalid={errors.dates ? true : undefined}
                  aria-describedby={
                    errors.dates ? "period-hint dates-error" : "period-hint"
                  }
                />
              </div>

              <div className="field">
                <span className="field-label">Billing days</span>
                <div
                  className={`readout${visibleDays === null ? " is-empty" : ""}`}
                >
                  <strong>{visibleDays ?? "—"}</strong>
                  {visibleDays !== null ? (
                    <span className="readout-unit">days</span>
                  ) : null}
                </div>
              </div>
            </div>

            {errors.dates ? (
              <p className="field-error" id="dates-error">
                <CircleAlert size={12} strokeWidth={2} aria-hidden="true" />
                {errors.dates}
              </p>
            ) : null}
          </fieldset>

          <fieldset className="form-section">
            <legend className="form-section-title">
              Tariff &amp; consumption
            </legend>
            <p className="form-section-note">
              Choose the applicable category and enter the metered values for
              this period.
            </p>

            <div className="field">
              <label className="field-label" htmlFor="tariff-category">
                Tariff category
              </label>
              <div className="select-wrap">
                <select
                  id="tariff-category"
                  className="control"
                  value={form.category}
                  onChange={(event) =>
                    updateField("category", event.target.value)
                  }
                  aria-describedby="category-hint"
                >
                  {TARIFF_GROUPS.map((group) => (
                    <optgroup key={group.label} label={group.label}>
                      {group.keys.map((key) => (
                        <option key={key} value={key}>
                          {key}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
              </div>
            </div>

            <div className="context-note" id="category-hint">
              <Info size={14} strokeWidth={1.8} aria-hidden="true" />
              <p>
                {config.hint} Consumption and slab thresholds are expressed in{" "}
                {unit}.
              </p>
            </div>

            <div className="form-grid">
              <div className="field">
                <label className="field-label" htmlFor="units">
                  Total consumption
                </label>
                <div className="input-group">
                  <input
                    id="units"
                    className="control control-suffix"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.units}
                    onChange={(event) =>
                      updateField("units", event.target.value)
                    }
                    aria-invalid={errors.units ? true : undefined}
                    aria-describedby={errors.units ? "units-error" : undefined}
                  />
                  <span className="affix affix-suffix">{unit}</span>
                </div>
                {errors.units ? (
                  <p className="field-error" id="units-error">
                    <CircleAlert
                      size={12}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {errors.units}
                  </p>
                ) : null}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="connected-load">
                  {loadLabel}
                </label>
                <div className="input-group">
                  <input
                    id="connected-load"
                    className="control control-suffix"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.load}
                    onChange={(event) =>
                      updateField("load", event.target.value)
                    }
                    aria-invalid={errors.load ? true : undefined}
                    aria-describedby={errors.load ? "load-error" : undefined}
                  />
                  <span className="affix affix-suffix">{loadUnit}</span>
                </div>
                {errors.load ? (
                  <p className="field-error" id="load-error">
                    <CircleAlert
                      size={12}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {errors.load}
                  </p>
                ) : null}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="fppca">
                  FPPCA amount
                </label>
                <div className="input-group">
                  <input
                    id="fppca"
                    className="control control-prefix"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.fppca}
                    onChange={(event) =>
                      updateField("fppca", event.target.value)
                    }
                    aria-invalid={errors.fppca ? true : undefined}
                    aria-describedby={errors.fppca ? "fppca-error" : undefined}
                  />
                  <span className="affix affix-prefix">₹</span>
                </div>
                {errors.fppca ? (
                  <p className="field-error" id="fppca-error">
                    <CircleAlert
                      size={12}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {errors.fppca}
                  </p>
                ) : null}
              </div>

              <div className="field">
                <label className="field-label" htmlFor="ed-rate">
                  Electricity duty
                </label>
                <div className="input-group">
                  <input
                    id="ed-rate"
                    className="control control-prefix control-suffix control-suffix-wide"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.edRate}
                    onChange={(event) =>
                      updateField("edRate", event.target.value)
                    }
                    aria-invalid={errors.edRate ? true : undefined}
                    aria-describedby={errors.edRate ? "ed-error" : undefined}
                  />
                  <span className="affix affix-prefix">₹</span>
                  <span className="affix affix-suffix affix-rate">/ unit</span>
                </div>
                {errors.edRate ? (
                  <p className="field-error" id="ed-error">
                    <CircleAlert
                      size={12}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                    {errors.edRate}
                  </p>
                ) : null}
              </div>
            </div>
          </fieldset>
        </div>

        <div className="form-actions">
          <button
            className="btn btn-ghost"
            type="button"
            onClick={handleReset}
          >
            <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
            Reset
          </button>
          <button className="btn btn-primary" type="submit">
            <Calculator size={15} strokeWidth={1.8} aria-hidden="true" />
            Calculate bill
          </button>
        </div>
      </form>

      <aside className="result-column" aria-label="Bill estimate">
        <section className="card estimate-card">
          <div className="estimate-total">
            <div className="estimate-total-top">
              <span className="estimate-kicker">Estimated total</span>
              <span className="approx-badge">Approx.</span>
            </div>

            <div
              className={`estimate-amount${hasEstimate ? "" : " is-empty"}`}
            >
              {hasEstimate ? formatCurrency(estimate.total) : "₹ —"}
            </div>

            <p className="estimate-caption">
              {hasEstimate
                ? `${formatQuantity(estimate.units)} ${estimate.unit} evaluated over ${estimate.days} billing days.`
                : "Complete the billing inputs to generate an itemised estimate."}
            </p>

            <div className="estimate-meta">
              <div>
                <span>Billing days</span>
                <strong>{hasEstimate ? estimate.days : visibleDays ?? "—"}</strong>
              </div>
              <div>
                <span>Charge months</span>
                <strong>
                  {hasEstimate ? formatMonths(estimate.months) : "—"}
                </strong>
              </div>
              <div>
                <span>{metaSlabLabel}</span>
                <strong>{metaSlabValue}</strong>
              </div>
            </div>
          </div>

          <div className="estimate-body">
            <div className="line-items">
              <div className="line-item">
                <div>
                  <span className="line-item-label">Energy charges</span>
                  <span className="line-item-meta">
                    {hasEstimate
                      ? `${formatQuantity(estimate.units)} ${estimate.unit} at slab rates`
                      : "Slab-wise energy rates"}
                  </span>
                </div>
                <span
                  className={`line-item-value${hasEstimate ? "" : " is-empty"}`}
                >
                  {hasEstimate ? formatCurrency(estimate.energy) : "—"}
                </span>
              </div>

              <div className="line-item">
                <div>
                  <span className="line-item-label">Electricity duty</span>
                  <span className="line-item-meta">
                    {hasEstimate
                      ? `${formatCurrency(estimate.edRate)} / ${estimate.unit}`
                      : "Applicable per-unit duty"}
                  </span>
                </div>
                <span
                  className={`line-item-value${hasEstimate ? "" : " is-empty"}`}
                >
                  {hasEstimate ? formatCurrency(estimate.ed) : "—"}
                </span>
              </div>

              <div className="line-item">
                <div>
                  <span className="line-item-label">MC tax</span>
                  <span className="line-item-meta">
                    ₹0.16 / {hasEstimate ? estimate.unit : "unit"}
                  </span>
                </div>
                <span
                  className={`line-item-value${hasEstimate ? "" : " is-empty"}`}
                >
                  {hasEstimate ? formatCurrency(estimate.mc) : "—"}
                </span>
              </div>

              <div className="line-item">
                <div>
                  <span className="line-item-label">Fixed charges</span>
                  <span className="line-item-meta">
                    {hasEstimate
                      ? `${formatCurrency(config.fixed)} / ${
                          config.fixedBasis === "connection"
                            ? "connection"
                            : config.fixedBasis
                        } · ${formatMonths(estimate.months)} months`
                      : "Prorated by billing days"}
                  </span>
                </div>
                <span
                  className={`line-item-value${hasEstimate ? "" : " is-empty"}`}
                >
                  {hasEstimate ? formatCurrency(estimate.fixed) : "—"}
                </span>
              </div>

              <div className="line-item">
                <div>
                  <span className="line-item-label">FPPCA</span>
                  <span className="line-item-meta">
                    As entered for the period
                  </span>
                </div>
                <span
                  className={`line-item-value${hasEstimate ? "" : " is-empty"}`}
                >
                  {hasEstimate ? formatCurrency(estimate.fppca) : "—"}
                </span>
              </div>
            </div>

            <div
              className={`estimate-status ${status.tone}`}
              aria-live="polite"
            >
              {statusIcon}
              <p>{status.message}</p>
            </div>

            {showEligibilityWarning ? (
              <div className="eligibility-note">
                <Info size={14} strokeWidth={1.8} aria-hidden="true" />
                <p>
                  LTDS-I is marked for connected loads below 250 W. Confirm the
                  consumer&apos;s eligibility before use.
                </p>
              </div>
            ) : null}

            <div className="estimate-actions">
              <button
                className="btn btn-primary btn-print"
                type="button"
                onClick={() => window.print()}
                disabled={!hasEstimate}
              >
                <Printer size={16} strokeWidth={1.8} aria-hidden="true" />
                Print / save PDF
              </button>
              <button
                className="btn btn-secondary btn-sm btn-copy"
                type="button"
                onClick={handleCopy}
                disabled={!hasEstimate}
              >
                {copyState === "copied" ? (
                  <Check size={14} strokeWidth={2} aria-hidden="true" />
                ) : (
                  <Copy size={14} strokeWidth={1.8} aria-hidden="true" />
                )}
                {copyLabel}
              </button>
            </div>

            {hasEstimate ? (
              <div className="history-save-note">
                <HistoryIcon size={13} strokeWidth={1.8} aria-hidden="true" />
                <span>
                  {historyStatus === "unavailable"
                    ? "Could not save locally. Download a PDF to keep this estimate."
                    : historyStatus === "duplicate"
                      ? "This estimate is already in history."
                      : "Saved in this browser only."}
                </span>
                <Link href="/history">Open history</Link>
              </div>
            ) : null}
          </div>

          {hasEstimate ? (
            <div className="print-only print-parameters">
              <div>
                <span>Tariff category</span>
                <strong>{estimate.category}</strong>
              </div>
              <div>
                <span>Billing period</span>
                <strong>
                  {formatDate(form.from)} – {formatDate(form.to)}
                </strong>
              </div>
              <div>
                <span>Consumption</span>
                <strong>
                  {formatQuantity(estimate.units)} {estimate.unit}
                </strong>
              </div>
              <div>
                <span>{loadLabel}</span>
                <strong>
                  {formatQuantity(estimate.load)} {loadUnit}
                </strong>
              </div>
            </div>
          ) : null}
        </section>

        <p className="estimate-disclaimer">
          <ShieldCheck size={13} strokeWidth={1.8} aria-hidden="true" />
          <span>
            Estimate only. Confirm the applicable tariff order and SOP before
            official billing.
          </span>
        </p>
      </aside>

      <section className="card breakup-card">
        <div className="card-head">
          <div className="card-heading">
            <span className="card-index">02</span>
            <div>
              <h2>Energy charge breakup</h2>
              <p className="card-sub">
                How consumption is distributed across tariff slabs.
              </p>
            </div>
          </div>
          {hasEstimate ? (
            <span className="card-tag">
              {estimate.category} · {estimate.unit}
            </span>
          ) : null}
        </div>

        {hasEstimate ? (
          <>
            <div className="table-wrap">
              <table className="data-table slab-table">
                <thead>
                  <tr>
                    <th scope="col">Consumption slab</th>
                    <th scope="col" className="num">
                      Units
                    </th>
                    <th scope="col" className="num">
                      Rate (₹ / unit)
                    </th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.rows.map((row, index) => (
                    <tr key={`${row.label}-${index}`}>
                      <td>{row.label}</td>
                      <td className="num">{formatQuantity(row.units)}</td>
                      <td className="num">{formatCurrency(row.rate)}</td>
                      <td className="num amount">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total energy charges</td>
                    <td className="num">{formatCurrency(estimate.energy)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <p className="table-note">
              <Info size={13} strokeWidth={1.8} aria-hidden="true" />
              <span>
                {config.kind === "flat"
                  ? `A single flat rate of ${formatCurrency(config.rates[0])} per ${estimate.unit} is applied to all ${formatQuantity(estimate.units)} ${estimate.unit}.`
                  : `Slab thresholds are prorated over ${estimate.days} days using 30 days per month. The first slab limit is ${estimate.slabLimit} ${estimate.unit} (exact ${estimate.exactLimit.toFixed(4)}).`}
              </span>
            </p>
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Calculator size={18} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="empty-title">No breakup available</p>
            <p className="empty-text">
              Calculate the bill to see how consumption is allocated across the
              applicable energy slabs.
            </p>
          </div>
        )}
      </section>

      <section className="method-callout">
        <div>
          <span className="method-callout-label">Method &amp; assumptions</span>
          <h2>How this estimate is calculated</h2>
          <p>
            Slab proration, fixed charges, electricity duty, MC tax, FPPCA and
            category-specific rules are documented on the guide page.
          </p>
        </div>
        <Link className="btn btn-secondary btn-sm" href="/guide">
          <BookOpen size={15} strokeWidth={1.8} aria-hidden="true" />
          Read the guide
          <ArrowRight size={14} strokeWidth={1.8} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
