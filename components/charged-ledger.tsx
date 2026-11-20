"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleAlert,
  Info,
  MoveHorizontal,
  Plus,
  Printer,
  RotateCcw,
  Table2,
  Trash2,
} from "lucide-react";
import { billingDays } from "@/lib/tariff";
import { formatCurrency, formatQuantity } from "@/lib/format";
import {
  LEDGER_AMOUNT_FIELDS,
  numericValue,
  readLedger,
  writeLedger,
  type LedgerEntry,
} from "@/lib/ledger";

type EntryField = Exclude<keyof Entry, "id">;

interface Entry {
  id: number;
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
  allowance: string;
}

function createEntry(id: number): Entry {
  return {
    id,
    from: "",
    to: "",
    units: "",
    energy: "",
    fixed: "",
    mc: "",
    ed: "",
    solar: "",
    fppca: "",
    others: "",
    allowance: "",
  };
}

function entryTotal(entry: Entry): number {
  return LEDGER_AMOUNT_FIELDS.reduce(
    (sum, field) => sum + numericValue(entry[field]),
    0,
  );
}

function entryDays(entry: Entry): number | null {
  const days = billingDays(entry.from, entry.to);
  return days !== null && days > 0 ? days : null;
}

function toLedgerEntry(entry: Entry): LedgerEntry {
  return {
    id: String(entry.id),
    from: entry.from,
    to: entry.to,
    units: entry.units,
    energy: entry.energy,
    fixed: entry.fixed,
    mc: entry.mc,
    ed: entry.ed,
    solar: entry.solar,
    fppca: entry.fppca,
    others: entry.others,
    allowance: entry.allowance,
  };
}

export function ChargedLedger() {
  const [entries, setEntries] = useState<Entry[]>(() => [createEntry(1)]);
  const [loaded, setLoaded] = useState(false);
  const [storageError, setStorageError] = useState<string | null>(null);
  const nextId = useRef(2);
  const pendingFocusId = useRef<number | null>(null);
  const resetDialog = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const stored = readLedger();

    if (stored.length > 0) {
      const restored = stored.map((entry, index) => ({
        ...createEntry(index + 1),
        from: entry.from,
        to: entry.to,
        units: entry.units,
        energy: entry.energy,
        fixed: entry.fixed,
        mc: entry.mc,
        ed: entry.ed,
        solar: entry.solar,
        fppca: entry.fppca,
        others: entry.others,
        allowance: entry.allowance,
      }));

      setEntries(restored);
      nextId.current = restored.length + 1;
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    const saved = writeLedger(entries.map(toLedgerEntry));
    setStorageError(
      saved
        ? null
        : "Browser storage could not be updated. This sheet may not be available on the net summary.",
    );
  }, [entries, loaded]);

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

        accumulator.units += numericValue(entry.units);
        accumulator.energy += numericValue(entry.energy);
        accumulator.ed += numericValue(entry.ed);
        accumulator.mc += numericValue(entry.mc);
        accumulator.fppca += numericValue(entry.fppca);
        accumulator.fixed += numericValue(entry.fixed);
        accumulator.solar += numericValue(entry.solar);
        accumulator.others += numericValue(entry.others);
        accumulator.allowance += numericValue(entry.allowance);
        accumulator.grand += entryTotal(entry);
        if (days !== null) accumulator.days += days;

        return accumulator;
      },
      {
        units: 0,
        energy: 0,
        ed: 0,
        mc: 0,
        fppca: 0,
        fixed: 0,
        solar: 0,
        others: 0,
        allowance: 0,
        days: 0,
        grand: 0,
      },
    );
  }, [entries]);

  const hasData = entries.some(
    (entry) =>
      entry.from !== "" ||
      entry.to !== "" ||
      entry.units.trim() !== "" ||
      LEDGER_AMOUNT_FIELDS.some((field) => entry[field].trim() !== ""),
  );

  function updateEntry(id: number, field: EntryField, value: string) {
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
      label: "Total units",
      value: formatQuantity(totals.units),
    },
    {
      label: "Total energy",
      value: formatCurrency(totals.energy),
    },
    {
      label: "Total ED",
      value: formatCurrency(totals.ed),
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
    {
      label: "Total others",
      value: formatCurrency(totals.others),
    },
    {
      label: "Total allowance",
      value: formatCurrency(totals.allowance),
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
              <col className="col-units" />
              <col className="col-amount" />
              <col className="col-fixed" />
              <col className="col-amount" />
              <col className="col-amount" />
              <col className="col-solar" />
              <col className="col-amount" />
              <col className="col-others" />
              <col className="col-allowance" />
              <col className="col-total" />
              <col className="col-action" />
            </colgroup>
            <thead>
              <tr>
                <th scope="col" className="cell-index">
                  <span className="sr-only">Entry number</span>#
                </th>
                <th scope="col">From date</th>
                <th scope="col">To date</th>
                <th scope="col" className="num">
                  Days
                </th>
                <th scope="col" className="num">
                  Units
                </th>
                <th scope="col" className="num">
                  Energy charge
                </th>
                <th scope="col" className="num">
                  Fixed charges
                </th>
                <th scope="col" className="num">
                  MC
                </th>
                <th scope="col" className="num">
                  ED
                </th>
                <th scope="col" className="num">
                  Solar
                </th>
                <th scope="col" className="num">
                  FPPCA
                </th>
                <th scope="col" className="num">
                  Others
                </th>
                <th
                  scope="col"
                  className="num"
                  title="Positive values add to the row total; negative values deduct."
                >
                  Allowance
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
                        min={entry.from || undefined}
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
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.units}
                        onChange={(event) =>
                          updateEntry(entry.id, "units", event.target.value)
                        }
                        aria-label={`Units, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
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
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.ed}
                        onChange={(event) =>
                          updateEntry(entry.id, "ed", event.target.value)
                        }
                        aria-label={`Electricity duty, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
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
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
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
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.others}
                        onChange={(event) =>
                          updateEntry(entry.id, "others", event.target.value)
                        }
                        aria-label={`Other charges, ${rowLabel}`}
                      />
                    </td>
                    <td>
                      <input
                        className="ledger-input ledger-amount"
                        type="number"
                        step="0.01"
                        inputMode="decimal"
                        placeholder="0.00"
                        value={entry.allowance}
                        onChange={(event) =>
                          updateEntry(entry.id, "allowance", event.target.value)
                        }
                        aria-label={`Allowance, ${rowLabel}`}
                      />
                    </td>
                    <td className="row-total">
                      {formatCurrency(entryTotal(entry))}
                    </td>
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
                        <Trash2
                          size={14}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
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

        {storageError ? (
          <div className="ledger-storage-error" role="alert">
            <CircleAlert size={14} strokeWidth={1.8} aria-hidden="true" />
            <p>{storageError}</p>
          </div>
        ) : null}

        <div className="sheet-footer">
          <p className="sheet-footer-meta">
            Totals update automatically.
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
            </div>
          </div>
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
