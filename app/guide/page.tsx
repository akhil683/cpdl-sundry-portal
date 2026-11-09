import type { Metadata } from "next";
import Link from "next/link";
import {
  BadgeCheck,
  BookOpen,
  Calculator,
  History as HistoryIcon,
  IndianRupee,
  ListChecks,
  Table2,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import {
  TARIFFS,
  TARIFF_GROUPS,
  getConsumptionUnit,
  type TariffConfig,
  type TariffKey,
} from "@/lib/tariff";
import { formatCurrency } from "@/lib/format";

export const metadata: Metadata = {
  title: "Guide",
  description:
    "How sundry estimates are calculated, how the charged ledger works, and what to check before official billing.",
};

const sections = [
  {
    href: "#overview",
    label: "How the portal works",
    icon: BookOpen,
  },
  {
    href: "#estimate",
    label: "Preparing an estimate",
    icon: Calculator,
  },
  {
    href: "#charges",
    label: "Charge heads explained",
    icon: IndianRupee,
  },
  {
    href: "#ledger",
    label: "Recording charged entries",
    icon: Table2,
  },
  {
    href: "#history",
    label: "History, saving & printing",
    icon: HistoryIcon,
  },
  {
    href: "#tariff",
    label: "Tariff schedule",
    icon: ListChecks,
  },
  {
    href: "#verify",
    label: "Before official billing",
    icon: BadgeCheck,
  },
] as const;

function rateSummary(config: TariffConfig): string {
  if (config.kind === "flat") {
    return `${formatCurrency(config.rates[0])} per unit`;
  }

  return config.labels
    .map(
      (label, index) =>
        `${label}: ${formatCurrency(config.rates[index] ?? 0)}`,
    )
    .join(" · ");
}

function fixedSummary(config: TariffConfig): string {
  if (config.fixed === 0) return "Placeholder — set manually";

  const basis = config.fixedBasis === "connection" ? "connection" : config.fixedBasis;
  return `${formatCurrency(config.fixed)} / ${basis} / month`;
}

export default function GuidePage() {
  return (
    <div className="container page-shell guide-page">
      <PageHeader
        section="Reference · Guide"
        title="How this portal works"
        description="One place for every rule, assumption and reminder used across the portal. Read this before preparing an estimate or recording an entry."
        facts={[
          { label: "Applies to", value: "All categories" },
          { label: "Tariff year", value: "2026–27" },
        ]}
      />

      <nav className="guide-index" aria-label="Guide sections">
        {sections.map((section, index) => {
          const Icon = section.icon;

          return (
            <a className="guide-index-link" href={section.href} key={section.href}>
              <span className="guide-index-num">
                {String(index + 1).padStart(2, "0")}
              </span>
              <Icon size={15} strokeWidth={1.8} aria-hidden="true" />
              <span>{section.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="guide-stack">
        <section className="card guide-section" id="overview">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">01</span>
              <div>
                <h2>How the portal works</h2>
                <p className="card-sub">
                  Three working areas, one shared tariff schedule.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-body">
            <p>
              The portal has three working areas. <strong>To be charged</strong>{" "}
              prepares an itemised estimate for an upcoming billing period.{" "}
              <strong>Already charged</strong> is a spreadsheet-style sheet for
              charges that have already been applied.{" "}
              <strong>History</strong> lists the estimates you have calculated in
              this browser.
            </p>
            <p>
              There is no login and no server-side account. Inputs stay on the
              device you are using. Amounts are always in Indian rupees (INR).
            </p>

            <div className="guide-callout">
              <span className="guide-callout-title">Quick start</span>
              <ol>
                <li>
                  Open <Link href="/to-be-charged">To be charged</Link>, choose
                  the billing dates and tariff category, then enter consumption.
                </li>
                <li>
                  Select <strong>Calculate bill</strong> to build the estimate.
                  It is saved to browser history automatically.
                </li>
                <li>
                  Use <strong>Print / save PDF</strong> for a copy you need to
                  keep. Local history is not permanent.
                </li>
              </ol>
            </div>
          </div>
        </section>

        <section className="card guide-section" id="estimate">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">02</span>
              <div>
                <h2>Preparing an estimate</h2>
                <p className="card-sub">
                  What each input does and how the billing window is counted.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-body">
            <h3>Billing period</h3>
            <p>
              Charges are prorated across the elapsed billing period. Billing
              days are counted as the <strong>to date minus the from date</strong>
              , so the from date itself is excluded. The to date must be after
              the from date.
            </p>

            <h3>Tariff category</h3>
            <p>
              The selected category fixes the consumption unit, the slab
              structure, the fixed-charge basis and whether electricity duty is
              prefilled. A category&apos;s consumption and slab thresholds are
              always expressed in its own unit — kWh for most domestic and
              agricultural categories, and kVAh for commercial, small power,
              EV and high-tension categories.
            </p>

            <h3>Consumption and load</h3>
            <p>
              Enter total metered consumption for the period and the connected
              load or contract demand, whichever the category uses. Blank
              values are treated as zero, so double-check that both fields are
              filled before calculating.
            </p>

            <h3>FPPCA and electricity duty</h3>
            <p>
              FPPCA is entered as a rupee amount for the period. Electricity
              duty is entered as a rate per unit. Domestic and agricultural
              rates are prefilled from the schedule; commercial duty is not
              specified in the visible schedule and starts at zero, so edit it
              if the applicable order requires a different rate.
            </p>

            <h3>Slab proration</h3>
            <p>
              Monthly slab thresholds are prorated using{" "}
              <strong>billing days ÷ 30</strong> and rounded to whole units. For
              example, a 100-unit first slab over a 15-day period becomes a
              50-unit first slab. Consumption is then allocated from the lowest
              slab upward.
            </p>
          </div>
        </section>

        <section className="card guide-section" id="charges">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">03</span>
              <div>
                <h2>Charge heads explained</h2>
                <p className="card-sub">
                  Every estimate is the sum of these five components.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-body">
            <dl className="guide-terms">
              <div>
                <dt>Energy charges</dt>
                <dd>
                  Consumption multiplied by the applicable flat rate or slab
                  rates. The energy charge breakup on the estimate shows each
                  slab, the units allocated to it and the amount.
                </dd>
              </div>
              <div>
                <dt>Electricity duty (ED)</dt>
                <dd>
                  The entered duty rate multiplied by total consumption. It is a
                  per-unit charge, not a percentage of the energy charge.
                </dd>
              </div>
              <div>
                <dt>MC tax</dt>
                <dd>
                  Applied at <strong>₹0.16 per unit</strong> for all categories,
                  as stated in the tariff schedule.
                </dd>
              </div>
              <div>
                <dt>Fixed charges</dt>
                <dd>
                  The category&apos;s fixed rate multiplied by the connected
                  load or contract demand (one connection where the tariff is
                  connection-based), then prorated using{" "}
                  <strong>billing days ÷ 30.4167</strong>.
                </dd>
              </div>
              <div>
                <dt>FPPCA</dt>
                <dd>
                  Added exactly as entered for the period. It is not recalculated
                  or prorated by the portal.
                </dd>
              </div>
            </dl>

            <div className="guide-callout">
              <span className="guide-callout-title">Category-specific rules</span>
              <ul>
                <li>
                  <strong>LTDS-I</strong> is marked for connected loads below
                  250 W. Confirm the consumer&apos;s eligibility before use.
                </li>
                <li>
                  <strong>Temporary supply</strong> is charged at the relevant
                  tariff plus 50%. The category is a manual placeholder; its
                  rate and fixed charge must be adjusted before use.
                </li>
                <li>
                  <strong>Connection-based fixed charges</strong> use one
                  connection by default, regardless of the load entered.
                </li>
              </ul>
            </div>
          </div>
        </section>

        <section className="card guide-section" id="ledger">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">04</span>
              <div>
                <h2>Recording charged entries</h2>
                <p className="card-sub">
                  How the already-charged sheet reconciles its totals.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-body">
            <p>
              The <Link href="/already-charged">Already charged</Link> sheet
              records amounts that have already been billed. Add one row per
              billed period and fill the charge heads that apply: energy, EC/ED,
              MC, FPPCA, fixed and solar user charges.
            </p>
            <ul className="guide-list">
              <li>Blank amount fields count as zero.</li>
              <li>
                Billing days are calculated as the to date minus the from date;
                the from date is excluded.
              </li>
              <li>
                Each row total is the sum of its charge heads, and the grand
                total sums every row across the sheet.
              </li>
              <li>
                Totals update automatically, so no separate calculate step is
                needed.
              </li>
              <li>
                Use <strong>Print / save PDF</strong> to keep a copy of the
                sheet; the sheet itself is not stored between visits.
              </li>
            </ul>
          </div>
        </section>

        <section className="card guide-section" id="history">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">05</span>
              <div>
                <h2>History, saving &amp; printing</h2>
                <p className="card-sub">
                  Where saved estimates live and how to keep them.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-body">
            <p>
              Every estimate you calculate is saved in this browser&apos;s local
              storage and appears on the <Link href="/history">History</Link>{" "}
              page, newest first. Identical calculations are not duplicated.
            </p>
            <div className="guide-callout guide-callout--warn">
              <span className="guide-callout-title">
                Local storage is not permanent
              </span>
              <p>
                Clearing site data, resetting the browser or switching devices
                removes saved calculations. Use <strong>Print / save PDF</strong>{" "}
                on any calculation or ledger you need to keep.
              </p>
            </div>
            <p>
              The print layout is designed for A4 and hides navigation and form
              controls, leaving only the estimate or ledger data for your
              records.
            </p>
          </div>
        </section>

        <section className="card guide-section" id="tariff">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">06</span>
              <div>
                <h2>Tariff schedule</h2>
                <p className="card-sub">
                  Categories, units, energy rates and fixed charges used by the
                  portal.
                </p>
              </div>
            </div>
            <span className="card-tag">2026–27</span>
          </div>

          <div className="guide-body">
            <p>
              The table below mirrors the schedule carried into the portal.
              Fixed charges are monthly and prorated by billing days; energy
              rates are per consumption unit.
            </p>

            {TARIFF_GROUPS.map((group) => (
              <div className="guide-tariff-group" key={group.label}>
                <h3>{group.label}</h3>
                <div className="table-wrap">
                  <table className="data-table guide-tariff-table">
                    <thead>
                      <tr>
                        <th scope="col">Category</th>
                        <th scope="col">Unit</th>
                        <th scope="col">Energy rate</th>
                        <th scope="col">Fixed charge</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.keys.map((key: TariffKey) => {
                        const config = TARIFFS[key];

                        return (
                          <tr key={key}>
                            <td className="guide-tariff-key">{key}</td>
                            <td>{getConsumptionUnit(config)}</td>
                            <td className="guide-tariff-rate">
                              {rateSummary(config)}
                            </td>
                            <td>{fixedSummary(config)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card guide-section" id="verify">
          <div className="card-head">
            <div className="card-heading">
              <span className="card-index">07</span>
              <div>
                <h2>Before official billing</h2>
                <p className="card-sub">
                  The estimate is a working aid, not an official bill.
                </p>
              </div>
            </div>
          </div>

          <div className="guide-body">
            <ul className="guide-checklist">
              <li>Confirm the tariff category and consumption unit.</li>
              <li>
                Confirm the billing period, including whether the from date
                should be excluded.
              </li>
              <li>
                Verify the slab rates, fixed-charge basis and electricity duty
                against the applicable tariff order.
              </li>
              <li>
                Check any category-specific condition, such as LTDS-I load
                eligibility or temporary-supply surcharge.
              </li>
              <li>
                Reconcile the estimate with the standard operating procedure
                before entering an official charge.
              </li>
            </ul>
            <p className="guide-disclaimer">
              Figures produced by this portal are indicative. Always verify the
              applicable tariff order and SOP before official billing.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
