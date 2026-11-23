"use client";

import { useEffect, useState } from "react";
import { IdCard, Info } from "lucide-react";
import {
  DIVISIONS,
  EMPTY_CONSUMER,
  PREMISES_TYPES,
  SUB_DIVISIONS,
  readConsumer,
  writeConsumer,
  type ConsumerDetails,
} from "@/lib/consumer";
import { readHistory, HISTORY_UPDATED_EVENT } from "@/lib/history";
import { readLedger, LEDGER_UPDATED_EVENT } from "@/lib/ledger";
import { buildNetSummary } from "@/lib/net";
import { formatCurrency, formatQuantity } from "@/lib/format";

export function ConsumerDetailsCard() {
  const [details, setDetails] = useState<ConsumerDetails>(EMPTY_CONSUMER);
  const [ready, setReady] = useState(false);
  const [credit, setCredit] = useState<{ units: number; amount: number }>({
    units: 0,
    amount: 0,
  });

  useEffect(() => {
    setDetails(readConsumer());
    setReady(true);

    function refreshCredit() {
      const latest = readHistory()[0] ?? null;
      const net = buildNetSummary(latest, readLedger());
      setCredit({ units: net.net.units, amount: net.netTotal });
    }

    refreshCredit();
    window.addEventListener("storage", refreshCredit);
    window.addEventListener(HISTORY_UPDATED_EVENT, refreshCredit);
    window.addEventListener(LEDGER_UPDATED_EVENT, refreshCredit);

    return () => {
      window.removeEventListener("storage", refreshCredit);
      window.removeEventListener(HISTORY_UPDATED_EVENT, refreshCredit);
      window.removeEventListener(LEDGER_UPDATED_EVENT, refreshCredit);
    };
  }, []);

  function update(field: keyof ConsumerDetails, value: string) {
    const next = { ...details, [field]: value };
    if (field === "division") next.subDivision = "";
    setDetails(next);
    writeConsumer(next);
  }

  return (
    <section className="card consumer-card" aria-labelledby="consumer-heading">
      <div className="card-head">
        <div className="card-heading">
          <span className="card-index">00</span>
          <div>
            <h2 id="consumer-heading">Consumer credentials &amp; FPL9</h2>
          </div>
        </div>
        <span className="entry-count">
          <IdCard size={13} strokeWidth={1.8} aria-hidden="true" />
          Optional
        </span>
      </div>

      <div className="consumer-grid">
        <div className="field">
          <label className="field-label" htmlFor="consumer-name">
            Consumer name
          </label>
          <input
            id="consumer-name"
            className="control"
            type="text"
            autoComplete="name"
            value={details.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="Enter consumer name"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-ca">
            CA number
          </label>
          <input
            id="consumer-ca"
            className="control"
            type="text"
            value={details.caNumber}
            onChange={(event) => update("caNumber", event.target.value)}
            placeholder="Enter CA number"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-meter">
            Meter number
          </label>
          <input
            id="consumer-meter"
            className="control"
            type="text"
            value={details.meterNumber}
            onChange={(event) => update("meterNumber", event.target.value)}
            placeholder="Enter meter number"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-premises">
            Premises type
          </label>
          <select
            id="consumer-premises"
            className="control"
            value={details.premisesType}
            onChange={(event) => update("premisesType", event.target.value)}
          >
            <option value="">Select premises type</option>
            {PREMISES_TYPES.map((premisesType) => (
              <option key={premisesType} value={premisesType}>
                {premisesType}
              </option>
            ))}
          </select>
        </div>

        <div className="field consumer-address">
          <label className="field-label" htmlFor="consumer-address">
            Address
          </label>
          <textarea
            id="consumer-address"
            className="control consumer-textarea"
            value={details.address}
            onChange={(event) => update("address", event.target.value)}
            placeholder="Enter complete consumer address"
            rows={2}
          />
        </div>

        <div className="field consumer-wide">
          <label className="field-label" htmlFor="consumer-description">
            Brief description
          </label>
          <textarea
            id="consumer-description"
            className="control consumer-textarea"
            value={details.description}
            onChange={(event) => update("description", event.target.value)}
            placeholder="Enter a brief description"
            rows={2}
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-rate-category">
            Rate category
          </label>
          <input
            id="consumer-rate-category"
            className="control"
            type="text"
            value={details.rateCategory}
            onChange={(event) => update("rateCategory", event.target.value)}
            placeholder="Enter rate category"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-load">
            Contract Demand
          </label>
          <input
            id="consumer-load"
            className="control"
            type="number"
            min="0"
            step="0.01"
            inputMode="decimal"
            value={details.load}
            onChange={(event) => update("load", event.target.value)}
            placeholder="Enter load"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-division">
            Division
          </label>
          <select
            id="consumer-division"
            className="control"
            value={details.division}
            onChange={(event) => update("division", event.target.value)}
          >
            <option value="">Select division</option>
            {DIVISIONS.map((division) => (
              <option key={division} value={division}>
                {division}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-subdivision">
            Sub division
          </label>
          <select
            id="consumer-subdivision"
            className="control"
            value={details.subDivision}
            disabled={!details.division}
            onChange={(event) => update("subDivision", event.target.value)}
          >
            <option value="">
              {details.division ? "Select sub division" : "Select division first"}
            </option>
            {SUB_DIVISIONS.map((subDivision) => (
              <option key={subDivision} value={subDivision}>
                {subDivision}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-balance">
            Current balance as per FPL9
          </label>
          <input
            id="consumer-balance"
            className="control"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={details.currentBalance}
            onChange={(event) => update("currentBalance", event.target.value)}
            placeholder="Enter current balance"
          />
        </div>

        <div className="field">
          <label className="field-label" htmlFor="consumer-net-payable">
            Net payable after adjustment
          </label>
          <input
            id="consumer-net-payable"
            className="control"
            type="number"
            step="0.01"
            inputMode="decimal"
            value={details.netPayable}
            onChange={(event) => update("netPayable", event.target.value)}
            placeholder="Enter net payable"
          />
        </div>

        <div className="field">
          <span className="field-label">Net credit units</span>
          <div className={`readout${ready ? "" : " is-empty"}`}>
            <strong>{formatQuantity(credit.units)}</strong>
            <span className="readout-unit">units</span>
          </div>
        </div>

        <div className="field">
          <span className="field-label">Net credit amount</span>
          <div className={`readout${ready ? "" : " is-empty"}`}>
            <strong>{formatCurrency(credit.amount)}</strong>
            <span className="readout-unit">INR</span>
          </div>
        </div>
      </div>
    </section>
  );
}
