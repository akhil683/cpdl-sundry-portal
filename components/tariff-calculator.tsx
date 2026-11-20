"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import {
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
  ED_RATE_BEFORE_APR_2026,
  ED_RATE_FROM_APR_2026,
  FIXED_LOAD_FACTOR,
  TARIFFS,
  TARIFF_GROUPS,
  billingDays,
  calculateBill,
  getDefaultSubtype,
  getSubtypeLabel,
  getSubtypeOptions,
  getConsumptionUnit,
  getLoadLabel,
  getLoadUnit,
  type BillResult,
  type BillSegment,
  type TariffKey,
  type TariffSubtype,
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
import {
  CONSUMER_UPDATED_EVENT,
  readConsumer,
} from "@/lib/consumer";
import {
  readStoredEstimate,
  writeStoredEstimate,
} from "@/lib/estimate";

interface FormState {
  category: TariffKey;
  subtype: TariffSubtype;
  from: string;
  to: string;
  units: string;
  load: string;
  fppca: string;
}

interface FormErrors {
  dates?: string;
  units?: string;
  load?: string;
  fppca?: string;
}

interface Estimate extends BillResult {
  units: number;
  load: number;
}

type StatusTone = "idle" | "success" | "error";
type CopyState = "idle" | "copied" | "error";

interface StatusState {
  tone: StatusTone;
  message: string;
}

const INITIAL_FORM: FormState = {
  category: "LTDS-II",
  subtype: getDefaultSubtype("LTDS-II"),
  from: "",
  to: "",
  units: "800",
  load: "5",
  fppca: "0",
};

const INITIAL_STATUS: StatusState = {
  tone: "idle",
  message: "Enter a billing period and consumption, then calculate the estimate.",
};

function parseAmount(value: string): number {
  return value.trim() === "" ? 0 : Number(value);
}

function rateList(segment: BillSegment, unit: string): string {
  return `${formatCurrency(segment.edRate)} / ${unit}`;
}

function buildReport(
  estimate: Estimate,
  dates: { from: string; to: string },
): string {
  const config = TARIFFS[estimate.category];
  const fixedUnit =
    config.fixedBasis === "connection" ? "connection" : config.fixedBasis;
  const lines = [
    "CPDL — SUNDRY BILL ESTIMATE",
    `Category: ${estimate.category}`,
    `Tariff subtype: ${getSubtypeLabel(estimate.category, estimate.subtype)}`,
    `Billing period: ${dates.from} to ${dates.to}`,
    `Billing days (elapsed): ${estimate.days}`,
    `Consumption: ${formatQuantity(estimate.units)} ${estimate.unit}`,
    `${getLoadLabel(config)}: ${formatQuantity(estimate.load)} ${getLoadUnit(config)}`,
    `Calculated load (${FIXED_LOAD_FACTOR * 100}%): ${formatQuantity(estimate.calculatedLoad)} ${getLoadUnit(config)}`,
    `Fixed-charge months (days ÷ 30.4167): ${formatMonths(estimate.months)}`,
    "",
    `TARIFF PERIODS APPLIED: ${estimate.segments.length}`,
  ];

  estimate.segments.forEach((segment) => {
    lines.push(
      "",
      `${segment.label} · ${segment.from} to ${segment.to} · ${segment.days} days · ${formatQuantity(segment.units)} ${estimate.unit}`,
      ...segment.rows.map(
        (row) =>
          `  ${row.label}: ${formatQuantity(row.units)} × ${formatCurrency(row.rate)} = ${formatCurrency(row.amount)}`,
      ),
      `  Energy: ${formatCurrency(segment.energy)}`,
      `  ED (${rateList(segment, estimate.unit)}): ${formatCurrency(segment.ed)}`,
      `  Fixed charges (${segment.fixedLoadLabel}): ${formatCurrency(segment.fixed)}`,
    );
  });

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
    `Electricity duty (date-wise 0.12 → 0.16): ${formatCurrency(estimate.ed)}`,
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

function segmentNote(segment: BillSegment): string {
  if (segment.fixedBasis === "connection") {
    return segment.fixedLoadLabel;
  }

  return `${segment.fixedLoadLabel} · ${formatQuantity(segment.fixedLoad)} ${segment.fixedBasis
    }`;
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
  const formRef = useRef<FormState>(INITIAL_FORM);

  useEffect(() => {
    formRef.current = form;
  }, [form]);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  useEffect(() => {
    const stored = readStoredEstimate();

    if (stored) {
      formRef.current = stored.form;
      setForm(stored.form);
      setEstimate(stored.result);

      if (stored.result) {
        setStatus({
          tone: "success",
          message: `Estimate restored from this browser for ${stored.result.category} across ${stored.result.days} billing days and ${stored.result.segments.length} tariff period(s). Update an input and calculate again to refresh it.`,
        });
        reportRef.current = buildReport(stored.result, {
          from: stored.form.from,
          to: stored.form.to,
        });
      }
    } else {
      const { load } = readConsumer();

      if (load.trim() !== "") {
        const nextForm = { ...formRef.current, load };
        formRef.current = nextForm;
        setForm(nextForm);
      }
    }

    function syncConsumerLoad() {
      const { load } = readConsumer();
      if (load.trim() === "" || formRef.current.load === load) return;

      const nextForm = { ...formRef.current, load };
      formRef.current = nextForm;
      setForm(nextForm);
      clearCalculatedState();
      writeStoredEstimate({ form: nextForm, result: null });
    }

    window.addEventListener(CONSUMER_UPDATED_EVENT, syncConsumerLoad);

    return () => {
      window.removeEventListener(CONSUMER_UPDATED_EVENT, syncConsumerLoad);
    };
  }, []);

  const config = TARIFFS[form.category];
  const unit = getConsumptionUnit(config);
  const loadUnit = getLoadUnit(config);
  const loadLabel = getLoadLabel(config);
  const subtypeOptions = getSubtypeOptions(form.category);
  const liveDays = billingDays(form.from, form.to);
  const visibleDays = liveDays !== null && liveDays > 0 ? liveDays : null;
  const liveLoad = form.load.trim() === "" ? null : parseAmount(form.load);
  const visibleCalculatedLoad =
    liveLoad !== null && Number.isFinite(liveLoad) && liveLoad >= 0
      ? liveLoad * FIXED_LOAD_FACTOR
      : null;

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
    const nextForm = { ...form, [field]: value };
    setForm(nextForm);
    clearCalculatedState();
    writeStoredEstimate({ form: nextForm, result: null });
  }

  function handleCategoryChange(category: TariffKey) {
    const nextForm = {
      ...form,
      category,
      subtype: getDefaultSubtype(category),
    };
    setForm(nextForm);
    clearCalculatedState();
    writeStoredEstimate({ form: nextForm, result: null });
  }

  function handleSubtypeChange(subtype: TariffSubtype) {
    const nextForm = { ...form, subtype };
    setForm(nextForm);
    clearCalculatedState();
    writeStoredEstimate({ form: nextForm, result: null });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    const days = billingDays(form.from, form.to);
    const units = parseAmount(form.units);
    const load = parseAmount(form.load);
    const fppca = parseAmount(form.fppca);

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
      nextErrors.load = "Enter the sanctioned load as zero or more.";
    }

    if (!Number.isFinite(fppca) || fppca < 0) {
      nextErrors.fppca = "Enter a valid FPPCA amount.";
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

    const calculated = calculateBill(form.category, {
      from: form.from,
      to: form.to,
      units,
      load,
      fppca,
      subtype: form.subtype,
    });

    const nextEstimate: Estimate = {
      ...calculated,
      units,
      load,
    };

    const effectiveEdRate = units > 0 ? calculated.ed / units : 0;

    const saveStatus = saveCalculation({
      category: nextEstimate.category,
      subtype: nextEstimate.subtype,
      from: form.from,
      to: form.to,
      days: nextEstimate.days,
      units: nextEstimate.units,
      load: nextEstimate.load,
      fppca: nextEstimate.fppca,
      edRate: effectiveEdRate,
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
      calculatedLoad: nextEstimate.calculatedLoad,
      segments: nextEstimate.segments,
    });

    setEstimate(nextEstimate);
    setErrors({});
    setCopyState("idle");
    setHistoryStatus(saveStatus);
    setStatus({
      tone: "success",
      message:
        saveStatus === "unavailable"
          ? `Estimate prepared for ${form.category} across ${days} billing days and ${nextEstimate.segments.length} tariff period(s). It could not be saved to browser history.`
          : saveStatus === "duplicate"
            ? `Estimate prepared for ${form.category} across ${days} billing days and ${nextEstimate.segments.length} tariff period(s). This calculation is already in history.`
            : `Estimate prepared for ${form.category} across ${days} billing days and ${nextEstimate.segments.length} tariff period(s), and saved to history.`,
    });
    reportRef.current = buildReport(nextEstimate, {
      from: form.from,
      to: form.to,
    });
    writeStoredEstimate({ form, result: nextEstimate });
  }

  function handleReset() {
    setForm(INITIAL_FORM);
    clearCalculatedState();
    writeStoredEstimate({ form: INITIAL_FORM, result: null });
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

  const edMeta = hasEstimate
    ? `${Array.from(new Set(estimate.segments.map((segment) => segment.edRate)))
      .map((rate) => `${formatCurrency(rate)} / ${estimate.unit}`)
      .join(" · ")} by date`
    : `₹${ED_RATE_BEFORE_APR_2026.toFixed(2)} → ₹${ED_RATE_FROM_APR_2026.toFixed(2)} by date`;

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
            </div>
          </div>
        </div>

        <div className="card-body">
          <fieldset className="form-section">
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
            {/* <p className="form-section-note">
              Choose the applicable category and enter the metered values for
              this period.
            </p> */}

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
                    handleCategoryChange(event.target.value as TariffKey)
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

            {subtypeOptions.length > 0 ? (
              <div className="field subtype-field">
                <label className="field-label" htmlFor="tariff-subtype">
                  Tariff subtype
                </label>
                <div className="select-wrap">
                  <select
                    id="tariff-subtype"
                    className="control"
                    value={form.subtype}
                    onChange={(event) =>
                      handleSubtypeChange(event.target.value as TariffSubtype)
                    }
                  >
                    {subtypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={16} strokeWidth={1.8} aria-hidden="true" />
                </div>
              </div>
            ) : null}

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
                <span className="field-label">
                  Calculated load ({FIXED_LOAD_FACTOR * 100}%)
                </span>
                <div
                  className={`readout${visibleCalculatedLoad === null ? " is-empty" : ""
                    }`}
                >
                  <strong>
                    {visibleCalculatedLoad !== null
                      ? formatQuantity(visibleCalculatedLoad)
                      : "—"}
                  </strong>
                  <span className="readout-unit">{loadUnit}</span>
                </div>
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
                ? `${formatQuantity(estimate.units)} ${estimate.unit} evaluated over ${estimate.days} billing days and ${estimate.segments.length} tariff period(s).`
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
                <span>Tariff periods</span>
                <strong>{hasEstimate ? estimate.segments.length : "—"}</strong>
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
                      ? `${formatQuantity(estimate.units)} ${estimate.unit} at period-wise slab rates`
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
                  <span className="line-item-meta">{edMeta}</span>
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

            <div className="estimate-actions">
              <button
                className="btn btn-secondary btn-print"
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
          </div>

          {hasEstimate ? (
            <div className="print-only print-parameters">
              <div>
                <span>Tariff category</span>
                <strong>
                  {estimate.category} ·{" "}
                  {getSubtypeLabel(estimate.category, estimate.subtype)}
                </strong>
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
      </aside>

      <section className="card breakup-card">
        <div className="card-head">
          <div className="card-heading">
            <span className="card-index">02</span>
            <div>
              <h2>Energy charge breakup</h2>
            </div>
          </div>
          {hasEstimate ? (
            <span className="card-tag">
              {estimate.category} · {estimate.unit} ·{" "}
              {estimate.segments.length}{" "}
              {estimate.segments.length === 1 ? "period" : "periods"}
            </span>
          ) : null}
        </div>

        {hasEstimate ? (
          <>
            <div className="period-cards">
              {estimate.segments.map((segment) => (
                <article className="period-card" key={`${segment.period}-${segment.from}`}>
                  <div className="period-card-head">
                    <h3>{segment.label}</h3>
                    <span>
                      {formatDate(segment.from)} – {formatDate(segment.to)}
                    </span>
                  </div>
                  <p className="period-card-meta">
                    {segment.days} billing days ·{" "}
                    {formatQuantity(segment.units)} {estimate.unit} allocated
                  </p>
                  <div className="table-wrap">
                    <table className="data-table period-table">
                      <thead>
                        <tr>
                          <th scope="col">Slab</th>
                          <th scope="col" className="num">
                            Units
                          </th>
                          <th scope="col" className="num">
                            Rate
                          </th>
                          <th scope="col" className="num">
                            Energy
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {segment.rows.map((row, index) => (
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
                          <td colSpan={3}>Energy subtotal</td>
                          <td className="num">
                            {formatCurrency(segment.energy)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <p className="period-card-basis">
                    <strong>Fixed-charge basis:</strong> {segmentNote(segment)} ·{" "}
                    {formatCurrency(segment.fixedRate)} /{" "}
                    {segment.fixedBasis === "connection"
                      ? "connection"
                      : segment.fixedBasis}{" "}
                    / month
                  </p>
                  <div className="period-card-totals">
                    <span>
                      Fixed charges <b>{formatCurrency(segment.fixed)}</b>
                    </span>
                    <span>
                      ED ({formatCurrency(segment.edRate)} / {estimate.unit}){" "}
                      <b>{formatCurrency(segment.ed)}</b>
                    </span>
                    <span>
                      Energy + fixed <b>{formatCurrency(segment.energy + segment.fixed)}</b>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-wrap">
              <table className="data-table slab-table">
                <thead>
                  <tr>
                    <th scope="col">Tariff period · consumption slab</th>
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
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-icon">
              <Calculator size={18} strokeWidth={1.8} aria-hidden="true" />
            </div>
            <p className="empty-title">No breakup available</p>
          </div>
        )}
      </section>
    </div>
  );
}
