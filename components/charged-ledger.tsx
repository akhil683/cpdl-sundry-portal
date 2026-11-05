"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Info,
  MoveHorizontal,
  Plus,
  Printer,
  RotateCcw,
  Table2,
  Trash2,
} from "lucide-react";
import { billingDays } from "@/lib/tariff";
import { formatCurrency } from "@/lib/format";

const AMOUNT_FIELDS = [
  "energy",
  "duty",
  "mc",
  "fppca",
  "fixed",
  "solar",
] as const;

type AmountField = (typeof AMOUNT_FIELDS)[number];
type EntryField = Exclude<keyof Entry, "id">;

interface Entry {
  id: number;
  from: string;
  to: string;
  energy: string;
  duty: string;
  mc: string;
  fppca: string;
  fixed: string;
  solar: string;
}

function createEntry(id: number): Entry {
  return {
    id,
    from: "",
    to: "",
    energy: "",
    duty: "",
    mc: "",
    fppca: "",
    fixed: "",
    solar: "",
  };
}

function numericValue(value: string): number {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function entryTotal(entry: Entry): number {
  return AMOUNT_FIELDS.reduce(
    (sum, field) => sum + numericValue(entry[field]),
    0,
  );
}

function entryDays(entry: Entry): number | null {
  const days = billingDays(entry.from, entry.to);
  return days !== null && days > 0 ? days : null;
}

export function ChargedLedger() {
  const [entries, setEntries] = useState<Entry[]>(() => [createEntry(1)]);
  const nextId = useRef(2);
  const pendingFocusId = useRef<number | null>(null);
  const resetDialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const id = pendingFocusId.current;
    if (id === null) return;

    const nextInput = document.getElementById(`entry-from-${id}`);
    if (nextInput instanceof HTMLInputElement) nextInput.focus();
    pendingFocusId.current = null;
  }, [entries]);

  const totals = useMemo(() => {
    return entries.reduce(
      (accumulator, entry) => {
        const days = entryDays(entry);

        accumulator.energy += numericValue(entry.energy);
        accumulator.duty += numericValue(entry.duty);
        accumulator.mc += numericValue(entry.mc);
        accumulator.fppca += numericValue(entry.fppca);
        accumulator.fixed += numericValue(entry.fixed);
        accumulator.solar += numericValue(entry.solar);
        accumulator.grand += entryTotal(entry);
        if (days !== null) accumulator.days += days;

        return accumulator;
      },
      {
        energy: 0,
        duty: 0,
        mc: 0,
        fppca: 0,
        fixed: 0,
        solar: 0,
        days: 0,
        grand: 0,
      },
    );
  }, [entries]);

  const hasData = entries.some(
    (entry) =>
      entry.from !== "" ||
      entry.to !== "" ||
      AMOUNT_FIELDS.some((field) => entry[field].trim() !== ""),
  );

  function updateEntry(id: number, field: EntryField, value: string) {
    if (
      AMOUNT_FIELDS.includes(field as AmountField) &&
      value !== "" &&
      Number(value) < 0
    ) {
      return;
    }

    setEntries((current) =>
      current.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry,
      ),
    );
  }

  function addEntry() {
    const id = nextId.current;
    nextId.current += 1;
    pendingFocusId.current = id;
    setEntries((current) => [...current, createEntry(id)]);
  }

  function removeEntry(id: number) {
    setEntries((current) => {
      if (current.length <= 1) return current;
      return current.filter((entry) => entry.id !== id);
    });
  }

  function openResetDialog() {
    resetDialog.current?.showModal();
  }

  function closeResetDialog() {
    resetDialog.current?.close();
  }

  function confirmReset() {
    nextId.current = 2;
    setEntries([createEntry(1)]);
    resetDialog.current?.close();
  }

  const summary = [
    {
      label: "Entries",
      value: entries.length.toLocaleString("en-IN"),
    },
    {
      label: "Billing days",
      value: totals.days.toLocaleString("en-IN"),
    },
    {
      label: "Total energy",
      value: formatCurrency(totals.energy),
    },
    {
      label: "Total EC / ED",
      value: formatCurrency(totals.duty),
    },
    {
      label: "Total MC",
      value: formatCurrency(totals.mc),
    },
    {
      label: "Total FPPCA",
      value: formatCurrency(totals.fppca),
    },
    {
      label: "Total fixed charges",
      value: formatCurrency(totals.fixed),
    },
    {
      label: "Total solar charges",
      value: formatCurrency(totals.solar),
    },
  ];

  return (
    <div className="ledger-stack">
      <section className="card ledger-card">
        <div className="card-head">
          <div className="card-heading">
            <span className="card-index">01</span>
            <div>
              <h2>Charge entry sheet</h2>
              <p className="card-sub">
                Record billed periods and each applied charge head.
              </p>
            </div>
          </div>

          <span className="entry-count">
            <Table2 size={13} strokeWidth={1.8} aria-hidden="true" />
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        <div
          className="table-wrap ledger-wrap"
          tabIndex={0}
          role="region"
          aria-label="Charge entries. Scroll horizontally to view all columns."
        >
          <table className="ledger-table">
            <colgroup>
              <col className="col-index" />
              <col className="col-date" />
              <col className="col-date" />
              <col className="col-days" />
              <col className="col-amount" />
              <col className="col-amount" />
              <col className="col-amount" />
              <col className="col-amount" />
              <col className="col-fixed" />
              <col className="col-solar" />
              <col className="col-total" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="cell-index">
                  <span className="sr-only">Entry number</span>
                  #
                </th>
                <th scope="col">From date</th>
                <th scope="col">To date</th>
                <th scope="col" className="num">
                  Days
                </th>
                <th scope="col" className="num">
                  Energy
                </th>
                <th scope="col" className="num">
                  EC / ED
                </th>
                <th scope="col" className="num">
                  MC
                </th>
                <th scope="col" className="num">
                  FPPCA
                </th>
                <th scope="col" className="num">
                  Fixed charge
                </th>
                <th scope="col" className="num">
                  Solar user charges
                </th>
                <th scope="col" className="num">
                  Row total
                </th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const days = entryDays(entry);
                const rowNumber = String(index + 1).padStart(2, "0");
                const rowLabel = `entry ${index + 1}`;

                return (
                  <tr key={entry.id}>
                    <th scope="row" className="row-index">
                      {rowNumber}
                    </th>
                    <td>
                      <input
                        id={`entry-from-${entry.id}`}
                        className="ledger-input ledger-date"
                        type="date"
                        value={entry.from}
                        onChange={(event) =>
                          updateEntry(entry.id, "from", event.target.value)
                        }
                        aria-label={`From date, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-date"
                        type="date"
                        value={entry.to}
                        onChange={(event) =>
                          updateEntry(entry.id, "to", event.target.value)
                        }
                        aria-label={`To date, ${rowLabel}`}
                      />
                    </td>
                    <td
                      className={`ledger-days${days === null ? " is-empty" : ""}`}
                      title={
                        days === null
                          ? "Enter a to date later than the from date"
                          : undefined
                      }
                    >
                      {days ?? "—"}
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.energy}
                        onChange={(event) =>
                          updateEntry(entry.id, "energy", event.target.value)
                        }
                        aria-label={`Energy charges, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.duty}
                        onChange={(event) =>
                          updateEntry(entry.id, "duty", event.target.value)
                        }
                        aria-label={`EC or ED charges, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.mc}
                        onChange={(event) =>
                          updateEntry(entry.id, "mc", event.target.value)
                        }
                        aria-label={`MC charges, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.fppca}
                        onChange={(event) =>
                          updateEntry(entry.id, "fppca", event.target.value)
                        }
                        aria-label={`FPPCA charges, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.fixed}
                        onChange={(event) =>
                          updateEntry(entry.id, "fixed", event.target.value)
                        }
                        aria-label={`Fixed charges, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.solar}
                        onChange={(event) =>
                          updateEntry(entry.id, "solar", event.target.value)
                        }
                        aria-label={`Solar user charges, ${rowLabel}`}
                      />
                    </td>
                    <td className="row-total">{formatCurrency(entryTotal(entry))}</td>
                    <td className="cell-action">
                      <button
                        className="row-remove"
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        disabled={entries.length === 1}
                        aria-label={`Remove ${rowLabel}`}
                        title={
                          entries.length === 1
                            ? "At least one entry is required"
                            : `Remove ${rowLabel}`
                        }
                      >
                        <Trash2 size={14} strokeWidth={1.8} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="scroll-hint">
          <MoveHorizontal size={13} strokeWidth={1.8} aria-hidden="true" />
          Scroll horizontally to view all charge heads.
        </div>

        <div className="sheet-note">
          <Info size={13} strokeWidth={1.8} aria-hidden="true" />
          <p>
            Blank amount fields count as zero. Billing days are calculated as
            the to date minus the from date; the from date is excluded.
          </p>
        </div>

        <div className="sheet-footer">
          <p className="sheet-footer-meta">
            Totals update automatically. All amounts are in INR.
          </p>
          <div className="sheet-actions">
            <button
              className="btn btn-ghost"
              type="button"
              onClick={openResetDialog}
              disabled={!hasData}
            >
              <RotateCcw size={15} strokeWidth={1.8} aria-hidden="true" />
              Reset sheet
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={() => window.print()}
              disabled={!hasData}
            >
              <Printer size={15} strokeWidth={1.8} aria-hidden="true" />
              Print / save PDF
            </button>
            <button
              className="btn btn-primary"
              type="button"
              onClick={addEntry}
            >
              <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
              Add entry
            </button>
          </div>
        </div>
      </section>

      <section className="card summary-card">
        <div className="card-head">
          <div className="card-heading">
            <span className="card-index">02</span>
            <div>
              <h2>Charge summary</h2>
              <p className="card-sub">
                Consolidated totals across every entry in the sheet.
              </p>
            </div>
          </div>
          <span className="card-tag">Auto-calculated</span>
        </div>

        <div className="summary-layout">
          <div className="summary-grid">
            {summary.map((item) => (
              <div className="summary-metric" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>

          <div className="grand-total">
            <div>
              <span className="grand-kicker">Grand total · already charged</span>
              <div className="grand-amount">
                {formatCurrency(totals.grand)}
              </div>
            </div>

            <div>
              <div className="grand-divider" />
              <p className="grand-note">
                Includes energy, EC/ED, MC, FPPCA, fixed and solar user charges
                across {entries.length}{" "}
                {entries.length === 1 ? "entry" : "entries"}.
              </p>
            </div>
          </div>
        </div>
      </section>

      <dialog
        ref={resetDialog}
        className="confirm-dialog"
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        <div className="dialog-body">
          <div className="dialog-icon">
            <RotateCcw size={18} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <h2 className="dialog-title">Reset charge sheet?</h2>
          <p className="dialog-text">
            This will remove every entry and clear the current totals. The
            action cannot be undone.
          </p>
          <div className="dialog-actions">
            <button
              className="btn btn-secondary"
              type="button"
              onClick={closeResetDialog}
              autoFocus
            >
              Cancel
            </button>
            <button
              className="btn btn-dark"
              type="button"
              onClick={confirmReset}
            >
              Clear sheet
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
