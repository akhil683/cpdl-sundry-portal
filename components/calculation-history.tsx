"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Calculator,
  ChevronDown,
  CircleAlert,
  History as HistoryIcon,
  Printer,
  Trash2,
} from "lucide-react";
import {
  HISTORY_LIMIT,
  HISTORY_STORAGE_KEY,
  readHistory,
  writeHistory,
  type HistoryEntry,
} from "@/lib/history";
import { TARIFFS, getLoadLabel, getLoadUnit } from "@/lib/tariff";
import {
  formatCurrency,
  formatDate,
  formatMonths,
  formatQuantity,
  formatTimestamp,
} from "@/lib/format";

type PendingRemoval = { kind: "one"; id: string } | { kind: "all" } | null;

interface HistoryCardProps {
  entry: HistoryEntry;
  isPrinting: boolean;
  onPrint: (id: string) => void;
  onRemove: (id: string) => void;
}

function HistoryCard({
  entry,
  isPrinting,
  onPrint,
  onRemove,
}: HistoryCardProps) {
  const config = TARIFFS[entry.category];
  const loadUnit = getLoadUnit(config);
  const timestamp = formatTimestamp(entry.createdAt);

  const charges = [
    { label: "Energy", value: entry.energy },
    { label: "EC / ED", value: entry.ed },
    { label: "MC", value: entry.mc },
    { label: "Fixed", value: entry.fixed },
    { label: "FPPCA", value: entry.fppca },
  ];

  return (
    <article
      className={`card history-entry${isPrinting ? " is-printing" : ""}`}
    >
      <div className="history-entry-screen">
        <div className="history-entry-content">
          <div className="history-summary">
            <div className="history-kicker">
              <span className="tariff-chip">{entry.category}</span>
              <time dateTime={entry.createdAt}>{timestamp}</time>
            </div>
            <p className="history-total">{formatCurrency(entry.total)}</p>
            <p className="history-period">
              {formatDate(entry.from)} – {formatDate(entry.to)}
            </p>
            <p className="history-meta">
              <span>{entry.days} billing days</span>
              <span className="history-meta-separator" aria-hidden="true">
                ·
              </span>
              <span>
                {formatQuantity(entry.units)} {entry.unit}
              </span>
              <span className="history-meta-separator" aria-hidden="true">
                ·
              </span>
              <span>{formatMonths(entry.months)} charge months</span>
            </p>
          </div>

          <dl className="history-breakdown">
            {charges.map((charge) => (
              <div key={charge.label}>
                <dt>{charge.label}</dt>
                <dd>{formatCurrency(charge.value)}</dd>
              </div>
            ))}
          </dl>

          <div className="history-entry-actions">
            <button
              className="btn btn-primary btn-print"
              type="button"
              onClick={() => onPrint(entry.id)}
            >
              <Printer size={16} strokeWidth={1.8} aria-hidden="true" />
              Print / save PDF
            </button>
            <button
              className="btn-icon"
              type="button"
              onClick={() => onRemove(entry.id)}
              aria-label={`Remove calculation from ${timestamp}`}
              title="Remove from history"
            >
              <Trash2 size={15} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </div>
        </div>

        <details className="history-details">
          <summary>
            <span>View calculation details</span>
            <ChevronDown
              className="history-details-chevron"
              size={14}
              strokeWidth={1.8}
              aria-hidden="true"
            />
          </summary>
          <div className="history-details-body">
            <dl className="history-params">
              <div>
                <dt>{getLoadLabel(config)}</dt>
                <dd>
                  {formatQuantity(entry.load)} {loadUnit}
                </dd>
              </div>
              <div>
                <dt>Electricity duty</dt>
                <dd>
                  {formatCurrency(entry.edRate)} / {entry.unit}
                </dd>
              </div>
              <div>
                <dt>Rounded slab limit</dt>
                <dd>
                  {entry.slabLimit} {entry.unit}
                </dd>
              </div>
              <div>
                <dt>Exact slab limit</dt>
                <dd>
                  {entry.exactLimit.toFixed(4)} {entry.unit}
                </dd>
              </div>
              <div>
                <dt>FPPCA</dt>
                <dd>{formatCurrency(entry.fppca)}</dd>
              </div>
            </dl>

            <div className="history-slab-table-wrap">
              <table className="data-table history-slab-table">
                <thead>
                  <tr>
                    <th scope="col">Consumption slab</th>
                    <th scope="col" className="num">
                      Units
                    </th>
                    <th scope="col" className="num">
                      Rate
                    </th>
                    <th scope="col" className="num">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {entry.rows.map((row, index) => (
                    <tr key={`${row.label}-${index}`}>
                      <td>{row.label}</td>
                      <td className="num">{formatQuantity(row.units)}</td>
                      <td className="num">
                        {formatCurrency(row.rate)} / {entry.unit}
                      </td>
                      <td className="num amount">
                        {formatCurrency(row.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3}>Total energy charges</td>
                    <td className="num">{formatCurrency(entry.energy)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </details>
      </div>

      <HistoryPrintDocument entry={entry} />
    </article>
  );
}

function HistoryPrintDocument({ entry }: { entry: HistoryEntry }) {
  const config = TARIFFS[entry.category];
  const loadLabel = getLoadLabel(config);
  const loadUnit = getLoadUnit(config);

  return (
    <div className="history-print-doc print-only">
      <header className="history-print-head">
        <div>
          <p className="history-print-brand">CPDL · Sundry billing portal</p>
          <h1 className="history-print-title">Sundry calculation record</h1>
          <p className="history-print-sub">
            Saved {formatTimestamp(entry.createdAt)}
          </p>
        </div>
        <div className="history-print-total">
          <span>Estimated total</span>
          <strong>{formatCurrency(entry.total)}</strong>
        </div>
      </header>

      <dl className="history-print-meta">
        <div>
          <dt>Tariff category</dt>
          <dd>
            {entry.category} · {config.group}
          </dd>
        </div>
        <div>
          <dt>Billing period</dt>
          <dd>
            {formatDate(entry.from)} – {formatDate(entry.to)}
          </dd>
        </div>
        <div>
          <dt>Billing days</dt>
          <dd>{entry.days}</dd>
        </div>
        <div>
          <dt>Consumption</dt>
          <dd>
            {formatQuantity(entry.units)} {entry.unit}
          </dd>
        </div>
        <div>
          <dt>{loadLabel}</dt>
          <dd>
            {formatQuantity(entry.load)} {loadUnit}
          </dd>
        </div>
        <div>
          <dt>Charge months</dt>
          <dd>{formatMonths(entry.months)}</dd>
        </div>
      </dl>

      <div className="history-print-columns">
        <section>
          <h2>Energy charge breakup</h2>
          <table className="data-table history-print-table">
            <thead>
              <tr>
                <th scope="col">Consumption slab</th>
                <th scope="col" className="num">
                  Units
                </th>
                <th scope="col" className="num">
                  Rate
                </th>
                <th scope="col" className="num">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {entry.rows.map((row, index) => (
                <tr key={`${row.label}-${index}`}>
                  <td>{row.label}</td>
                  <td className="num">{formatQuantity(row.units)}</td>
                  <td className="num">{formatCurrency(row.rate)}</td>
                  <td className="num">{formatCurrency(row.amount)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Total energy charges</td>
                <td className="num">{formatCurrency(entry.energy)}</td>
              </tr>
            </tfoot>
          </table>
        </section>

        <section>
          <h2>Charge summary</h2>
          <dl className="history-print-charges">
            <div>
              <dt>Energy charges</dt>
              <dd>{formatCurrency(entry.energy)}</dd>
            </div>
            <div>
              <dt>Electricity duty</dt>
              <dd>{formatCurrency(entry.ed)}</dd>
            </div>
            <div>
              <dt>MC tax</dt>
              <dd>{formatCurrency(entry.mc)}</dd>
            </div>
            <div>
              <dt>Fixed charges</dt>
              <dd>{formatCurrency(entry.fixed)}</dd>
            </div>
            <div>
              <dt>FPPCA</dt>
              <dd>{formatCurrency(entry.fppca)}</dd>
            </div>
            <div className="is-total">
              <dt>Estimated total</dt>
              <dd>{formatCurrency(entry.total)}</dd>
            </div>
          </dl>
        </section>
      </div>

      <p className="history-print-note">
        Generated from this browser&apos;s local calculation history. This is
        not a permanent CPDL record. Verify the applicable tariff order and SOP
        before official billing.
      </p>
    </div>
  );
}

export function CalculationHistory() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [pendingRemoval, setPendingRemoval] =
    useState<PendingRemoval>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const resetDialog = useRef<HTMLDialogElement | null>(null);
  const printTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = readHistory();
    setEntries(loaded);
    setPrintingId(loaded[0]?.id ?? null);

    function handleStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== HISTORY_STORAGE_KEY) return;

      const next = readHistory();
      setEntries(next);
      setPrintingId((current) => {
        if (current && next.some((entry) => entry.id === current)) {
          return current;
        }
        return next[0]?.id ?? null;
      });
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      if (printTimer.current) clearTimeout(printTimer.current);
    };
  }, []);

  useEffect(() => {
    const dialog = resetDialog.current;
    if (!dialog) return;

    if (pendingRemoval && !dialog.open) {
      dialog.showModal();
    } else if (!pendingRemoval && dialog.open) {
      dialog.close();
    }
  }, [pendingRemoval]);

  function handlePrint(id: string) {
    setPrintingId(id);

    if (printTimer.current) clearTimeout(printTimer.current);
    printTimer.current = setTimeout(() => window.print(), 80);
  }

  function confirmRemoval() {
    if (!pendingRemoval) return;

    const current = readHistory();
    const next =
      pendingRemoval.kind === "all"
        ? []
        : current.filter((entry) => entry.id !== pendingRemoval.id);

    if (!writeHistory(next)) {
      setStorageError(
        "Browser storage could not be updated. Your history may not have changed.",
      );
      setPendingRemoval(null);
      return;
    }

    setEntries(next);
    setStorageError(null);
    setPrintingId((currentId) => {
      if (currentId && next.some((entry) => entry.id === currentId)) {
        return currentId;
      }
      return next[0]?.id ?? null;
    });
    setPendingRemoval(null);
  }

  if (entries === null) {
    return (
      <section className="card history-loading" aria-busy="true">
        <HistoryIcon size={18} strokeWidth={1.8} aria-hidden="true" />
        <p>Reading saved calculations in this browser…</p>
      </section>
    );
  }

  if (entries.length === 0) {
    return (
      <section className="card history-empty">
        <div className="history-empty-icon">
          <HistoryIcon size={20} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <h2>No calculations saved yet</h2>
        <p>
          Every estimate you calculate on the To be charged page is saved here
          automatically, on this device.
        </p>
        <Link className="btn btn-primary" href="/to-be-charged">
          <Calculator size={15} strokeWidth={1.8} aria-hidden="true" />
          Calculate a bill
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="history-section" aria-labelledby="saved-estimates">
        <div className="history-section-head">
          <div>
            <h2 id="saved-estimates">Saved estimates</h2>
            <p>
              Newest first. Up to {HISTORY_LIMIT} records are kept in this
              browser.
            </p>
          </div>
          <div className="history-section-actions">
            <span className="entry-count">
              <HistoryIcon size={13} strokeWidth={1.8} aria-hidden="true" />
              {entries.length} {entries.length === 1 ? "record" : "records"}
            </span>
            <button
              className="btn btn-ghost btn-sm"
              type="button"
              onClick={() => setPendingRemoval({ kind: "all" })}
            >
              <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
              Clear history
            </button>
          </div>
        </div>

        {storageError ? (
          <div className="history-storage-error" role="alert">
            <CircleAlert size={15} strokeWidth={1.8} aria-hidden="true" />
            <p>{storageError}</p>
          </div>
        ) : null}

        <div className="history-list">
          {entries.map((entry) => (
            <HistoryCard
              key={entry.id}
              entry={entry}
              isPrinting={printingId === entry.id}
              onPrint={handlePrint}
              onRemove={(id) => setPendingRemoval({ kind: "one", id })}
            />
          ))}
        </div>
      </section>

      <dialog
        ref={resetDialog}
        className="confirm-dialog"
        aria-labelledby="history-confirm-title"
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            setPendingRemoval(null);
          }
        }}
        onClose={() => setPendingRemoval(null)}
      >
        <div className="dialog-body">
          <div className="dialog-icon">
            <Trash2 size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h2 className="dialog-title" id="history-confirm-title">
            {pendingRemoval?.kind === "all"
              ? "Clear calculation history?"
              : "Remove this calculation?"}
          </h2>
          <p className="dialog-text">
            {pendingRemoval?.kind === "all"
              ? "Every saved estimate will be removed from this browser. This action cannot be undone."
              : "This saved estimate will be removed from this browser. It cannot be recovered."}
          </p>
          <div className="dialog-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => setPendingRemoval(null)}
              autoFocus
            >
              Cancel
            </button>
            <button
              className="btn btn-dark"
              type="button"
              onClick={confirmRemoval}
            >
              {pendingRemoval?.kind === "all" ? "Clear history" : "Remove"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
