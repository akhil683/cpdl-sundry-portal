"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calculator, Info, Printer, RefreshCw, Table2 } from "lucide-react";
import {
  CONSUMER_UPDATED_EVENT,
  EMPTY_CONSUMER,
  readConsumer,
  type ConsumerDetails,
} from "@/lib/consumer";
import {
  readHistory,
  HISTORY_UPDATED_EVENT,
  type HistoryEntry,
} from "@/lib/history";
import {
  readLedger,
  LEDGER_UPDATED_EVENT,
  type LedgerEntry,
} from "@/lib/ledger";
import { NetSummaryDocument } from "@/components/net-summary-document";

export function NetSummary() {
  const [latest, setLatest] = useState<HistoryEntry | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [consumer, setConsumer] = useState<ConsumerDetails>(EMPTY_CONSUMER);
  const [generatedOn, setGeneratedOn] = useState("—");

  useEffect(() => {
    function refresh() {
      setLatest(readHistory()[0] ?? null);
      setLedger(readLedger());
      setConsumer(readConsumer());
      setGeneratedOn(new Date().toLocaleString("en-IN"));
    }

    refresh();

    window.addEventListener("storage", refresh);
    window.addEventListener(CONSUMER_UPDATED_EVENT, refresh);
    window.addEventListener(HISTORY_UPDATED_EVENT, refresh);
    window.addEventListener(LEDGER_UPDATED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(CONSUMER_UPDATED_EVENT, refresh);
      window.removeEventListener(HISTORY_UPDATED_EVENT, refresh);
      window.removeEventListener(LEDGER_UPDATED_EVENT, refresh);
    };
  }, []);

  function handleRefresh() {
    setLatest(readHistory()[0] ?? null);
    setLedger(readLedger());
    setConsumer(readConsumer());
    setGeneratedOn(new Date().toLocaleString("en-IN"));
  }

  return (
    <>
      <div className="net-actions">
        <button className="btn btn-secondary" type="button" onClick={handleRefresh}>
          <RefreshCw size={15} strokeWidth={1.8} aria-hidden="true" />
          Update summary
        </button>
        <button className="btn btn-primary" type="button" onClick={() => window.print()}>
          <Printer size={15} strokeWidth={1.8} aria-hidden="true" />
          Print / save net PDF
        </button>
      </div>

      <NetSummaryDocument
        id="net-summary"
        latest={latest}
        ledger={ledger}
        consumer={consumer}
        generatedOn={generatedOn}
      />

      <p className="net-hint">
        <Info size={13} strokeWidth={1.8} aria-hidden="true" />
        <span>
          The summary reads the latest saved estimate and the already-charged
          sheet from this browser. Use Print / save net PDF and choose “Save as
          PDF” in the print destination.
        </span>
      </p>

      <div className="net-quick-links">
        <Link className="btn btn-ghost btn-sm" href="/to-be-charged">
          <Calculator size={14} strokeWidth={1.8} aria-hidden="true" />
          Open to be charged
        </Link>
        <Link className="btn btn-ghost btn-sm" href="/already-charged">
          <Table2 size={14} strokeWidth={1.8} aria-hidden="true" />
          Open already charged
        </Link>
      </div>
    </>
  );
}
