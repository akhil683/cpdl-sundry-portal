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
  HISTORY_UPDATED_EVENT,
  readHistory,
  writeHistory,
  type HistoryEntry,
} from "@/lib/history";
import { TARIFFS, getLoadLabel, getLoadUnit } from "@/lib/tariff";
import {
  EMPTY_CONSUMER,
  readConsumer,
  type ConsumerDetails,
} from "@/lib/consumer";
import { readLedger, type LedgerEntry } from "@/lib/ledger";
import { NetSummaryDocument } from "@/components/net-summary-document";
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
  consumer: ConsumerDetails;
  ledger: LedgerEntry[];
  onPrint: (id: string) => void;
  onRemove: (id: string) => void;
}

function HistoryCard({
  entry,
  isPrinting,
  consumer,
  ledger,
  onPrint,
  onRemove,
}: HistoryCardProps) {
  const config = TARIFFS[entry.category];
  const loadUnit = getLoadUnit(config);
  const timestamp = formatTimestamp(entry.createdAt);

  const charges = [
    { label: "Energy", value: entry.energy },
    { label: "ED", value: entry.ed },
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
                <dt>Calculated load (85%)</dt>
                <dd>
                  {formatQuantity(
                    entry.calculatedLoad ?? entry.load * 0.85,
                  )}{" "}
                  {loadUnit}
                </dd>
              </div>
              <div>
                <dt>Effective ED rate</dt>
                <dd>
                  {formatCurrency(entry.edRate)} / {entry.unit}
                </dd>
              </div>
              <div>
                <dt>Tariff periods</dt>
                <dd>{entry.segments?.length ?? 1}</dd>
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
                <dt>
                  FPPCA
                  {entry.fppcaPercent !== undefined
                    ? ` (${formatQuantity(entry.fppcaPercent)}%)`
                    : ""}
                </dt>
                <dd>{formatCurrency(entry.fppca)}</dd>
              </div>
            </dl>

            {entry.segments && entry.segments.length > 0 ? (
              <div className="history-periods">
                {entry.segments.map((segment) => (
                  <div
                    className="history-period"
                    key={`${segment.period}-${segment.from}`}
                  >
                    <div className="history-period-head">
                      <strong>{segment.label}</strong>
                      <span>
                        {formatDate(segment.from)} – {formatDate(segment.to)} ·{" "}
                        {segment.days} days
                      </span>
                    </div>
                    <dl className="history-period-meta">
                      <div>
                        <dt>Units</dt>
                        <dd>
                          {formatQuantity(segment.units)} {entry.unit}
                        </dd>
                      </div>
                      <div>
                        <dt>Energy</dt>
                        <dd>{formatCurrency(segment.energy)}</dd>
                      </div>
                      <div>
                        <dt>ED rate</dt>
                        <dd>
                          {formatCurrency(segment.edRate)} / {entry.unit}
                        </dd>
                      </div>
                      <div>
                        <dt>Fixed charges</dt>
                        <dd>{formatCurrency(segment.fixed)}</dd>
                      </div>
                      <div>
                        <dt>Fixed basis</dt>
                        <dd>{segment.fixedLoadLabel}</dd>
                      </div>
                    </dl>
                  </div>
                ))}
              </div>
            ) : null}

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

      {isPrinting ? (
        <HistoryPrintDocument
          entry={entry}
          consumer={consumer}
          ledger={ledger}
        />
      ) : null}
    </article>
  );
}

function HistoryPrintDocument({
  entry,
  consumer,
  ledger,
}: {
  entry: HistoryEntry;
  consumer: ConsumerDetails;
  ledger: LedgerEntry[];
}) {
  return (
    <div className="history-print-doc print-only">
      <NetSummaryDocument
        latest={entry}
        ledger={ledger}
        consumer={consumer}
        generatedOn={formatTimestamp(entry.createdAt)}
      />
    </div>
  );
}

export function CalculationHistory() {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [consumer, setConsumer] = useState<ConsumerDetails>(EMPTY_CONSUMER);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [pendingRemoval, setPendingRemoval] =
    useState<PendingRemoval>(null);
  const [storageError, setStorageError] = useState<string | null>(null);
  const resetDialog = useRef<HTMLDialogElement | null>(null);
  const printTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const loaded = readHistory();
    setEntries(loaded);
    setPrintingId(loaded[0]?.id ?? null);
    setConsumer(readConsumer());
    setLedger(readLedger());

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
    setConsumer(readConsumer());
    setLedger(readLedger());
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

    window.dispatchEvent(new Event(HISTORY_UPDATED_EVENT));
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
              consumer={consumer}
              ledger={ledger}
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
