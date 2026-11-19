import Link from "next/link";
import type { ConsumerDetails } from "@/lib/consumer";
import type { HistoryEntry } from "@/lib/history";
import {
  isBlankLedgerEntry,
  numericValue,
  type LedgerEntry,
} from "@/lib/ledger";
import { buildNetSummary, NET_ROWS } from "@/lib/net";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/format";
import { getSubtypeLabel } from "@/lib/tariff";

function valueOrDash(value: string): string {
  const trimmed = value.trim();
  return trimmed === "" ? "—" : trimmed;
}

export function displayConsumer(
  consumer: ConsumerDetails,
  latest: HistoryEntry | null,
) {
  const load =
    consumer.load.trim() !== ""
      ? consumer.load.trim()
      : latest
        ? formatQuantity(latest.load)
        : "—";

  return {
    name: valueOrDash(consumer.name),
    caNumber: valueOrDash(consumer.caNumber),
    address: valueOrDash(consumer.address),
    load,
    division: valueOrDash(consumer.division),
    subDivision: valueOrDash(consumer.subDivision),
    currentBalance: valueOrDash(consumer.currentBalance),
    netPayable: valueOrDash(consumer.netPayable),
    premisesType: valueOrDash(consumer.premisesType),
    rateCategory: valueOrDash(consumer.rateCategory),
    meterNumber: valueOrDash(consumer.meterNumber),
    description: valueOrDash(consumer.description),
  };
}

interface NetSummaryDocumentProps {
  latest: HistoryEntry | null;
  ledger: LedgerEntry[];
  consumer: ConsumerDetails;
  generatedOn: string;
  id?: string;
}

export function NetSummaryDocument({
  latest,
  ledger,
  consumer,
  generatedOn,
  id,
}: NetSummaryDocumentProps) {
  const visibleLedger = ledger.filter((entry) => !isBlankLedgerEntry(entry));
  const net = buildNetSummary(latest, visibleLedger);
  const details = displayConsumer(consumer, latest);

  return (
    <section className="card net-card" id={id}>
      <div className="net-hero">
        <div>
          <p className="net-brand">CPDL · Consumer bill summary</p>
          <h2>Chandigarh Power Distribution Limited</h2>
          <p className="net-sub">Net amount = To be charged − Already charged</p>
        </div>
        <div className="net-generated">
          <span>Generated</span>
          <strong>{generatedOn}</strong>
        </div>
      </div>

      <div className="net-body">
        <section className="net-section">
          <h3>Consumer credentials</h3>
          <table className="data-table net-credentials">
            <tbody>
              <tr>
                <th scope="row">Consumer name</th>
                <td>{details.name}</td>
                <th scope="row">CA number</th>
                <td>{details.caNumber}</td>
              </tr>
              <tr>
                <th scope="row">Meter number</th>
                <td>{details.meterNumber}</td>
                <th scope="row">Rate category</th>
                <td>{details.rateCategory}</td>
              </tr>
              <tr>
                <th scope="row">Premises type</th>
                <td>{details.premisesType}</td>
                <th scope="row">Sanctioned load / demand</th>
                <td>{details.load}</td>
              </tr>
              <tr>
                <th scope="row">Address</th>
                <td colSpan={3}>{details.address}</td>
              </tr>
              <tr>
                <th scope="row">Brief description</th>
                <td colSpan={3}>{details.description}</td>
              </tr>
              <tr>
                <th scope="row">Division</th>
                <td>{details.division}</td>
                <th scope="row">Sub division</th>
                <td>{details.subDivision}</td>
              </tr>
              <tr>
                <th scope="row">Current balance as per FPL9</th>
                <td>{details.currentBalance}</td>
                <th scope="row">Net payable after adjustment</th>
                <td>{details.netPayable}</td>
              </tr>
              <tr>
                <th scope="row">Net credit units</th>
                <td>{formatQuantity(net.net.units)}</td>
                <th scope="row">Net credit amount</th>
                <td>
                  <strong className="net-credit">
                    {formatCurrency(net.netTotal)}
                  </strong>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <section className="net-section">
          <div className="net-section-head">
            <h3>Charge-wise net summary</h3>
            <span>Positive = recover · Negative = excess already charged</span>
          </div>
          <div className="table-wrap">
            <table className="data-table net-compare">
              <thead>
                <tr>
                  <th scope="col">Particulars</th>
                  <th scope="col" className="num">
                    To be charged
                  </th>
                  <th scope="col" className="num">
                    Already charged
                  </th>
                  <th scope="col" className="num">
                    Net amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {NET_ROWS.map((row) => (
                  <tr key={row.key}>
                    <td>{row.label}</td>
                    <td className="num">
                      {row.isUnits
                        ? formatQuantity(net.toBe[row.key])
                        : formatCurrency(net.toBe[row.key])}
                    </td>
                    <td className="num">
                      {row.isUnits
                        ? formatQuantity(net.already[row.key])
                        : formatCurrency(net.already[row.key])}
                    </td>
                    <td className="num">
                      {row.isUnits
                        ? formatQuantity(net.net[row.key])
                        : formatCurrency(net.net[row.key])}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td>Subtotal</td>
                  <td className="num">{formatCurrency(net.toBeTotal)}</td>
                  <td className="num">{formatCurrency(net.alreadyTotal)}</td>
                  <td className="num">{formatCurrency(net.netTotal)}</td>
                </tr>
                <tr className="grand">
                  <td colSpan={3}>Grand total net amount</td>
                  <td className="num">{formatCurrency(net.netTotal)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        <section className="net-section">
          <h3>1. To be charged — tariff calculation</h3>
          {latest ? (
            <>
              <dl className="net-params">
                <div>
                  <dt>Tariff category</dt>
                  <dd>
                    {latest.category}
                    {latest.subtype && latest.subtype !== "default"
                      ? ` · ${getSubtypeLabel(latest.category, latest.subtype)}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt>Billing period</dt>
                  <dd>
                    {formatDate(latest.from)} – {formatDate(latest.to)}
                  </dd>
                </div>
                <div>
                  <dt>Billing days</dt>
                  <dd>{latest.days}</dd>
                </div>
                <div>
                  <dt>Units</dt>
                  <dd>
                    {formatQuantity(latest.units)} {latest.unit}
                  </dd>
                </div>
                <div>
                  <dt>Sanctioned load</dt>
                  <dd>{formatQuantity(latest.load)}</dd>
                </div>
                <div>
                  <dt>Calculated load (85%)</dt>
                  <dd>
                    {formatQuantity(latest.calculatedLoad ?? latest.load * 0.85)}
                  </dd>
                </div>
                <div>
                  <dt>Tariff periods</dt>
                  <dd>{latest.segments?.length ?? 1}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatCurrency(latest.total)}</dd>
                </div>
              </dl>

            </>
          ) : (
            <p className="net-empty">
              Calculate a bill on{" "}
              <Link href="/to-be-charged">To be charged</Link> to populate this
              section.
            </p>
          )}
        </section>

        <section className="net-section">
          <h3>2. Already charged — entry-wise details</h3>
          {visibleLedger.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table net-ledger">
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">From</th>
                    <th scope="col">To</th>
                    <th scope="col" className="num">
                      Units
                    </th>
                    <th scope="col" className="num">
                      Energy
                    </th>
                    <th scope="col" className="num">
                      Fixed
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
                  </tr>
                </thead>
                <tbody>
                  {visibleLedger.map((entry, index) => (
                    <tr key={entry.id}>
                      <td>{index + 1}</td>
                      <td>{entry.from ? formatDate(entry.from) : "—"}</td>
                      <td>{entry.to ? formatDate(entry.to) : "—"}</td>
                      <td className="num">
                        {formatQuantity(numericValue(entry.units))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.energy))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.fixed))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.mc))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.ed))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.solar))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.fppca))}
                      </td>
                      <td className="num">
                        {formatCurrency(numericValue(entry.others))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="net-empty">
              Add entries on <Link href="/already-charged">Already charged</Link>{" "}
              to populate this section.
            </p>
          )}
        </section>

        <section className="net-section">
          <h3>3. Net calculation</h3>
          <p className="net-formula">
            {formatCurrency(net.toBeTotal)} −{" "}
            {formatCurrency(net.alreadyTotal)} ={" "}
            <strong>{formatCurrency(net.netTotal)}</strong>
          </p>
        </section>
      </div>
    </section>
  );
}
