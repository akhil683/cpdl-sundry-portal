# CPDL Sundry Billing Portal

A Next.js conversion of the CPDL sundry billing worksheet. The portal has four
working areas:

- **To be charged** — consumer credentials plus an estimate calculator with
  prorated billing days, date-wise tariff periods, tariff-wise energy slabs,
  automatic electricity duty, MC tax, 85% fixed-charge load and FPPCA.
- **Already charged** — a live charge entry sheet with units, row-level totals
  and a consolidated summary, saved in this browser.
- **Net summary** — compares the latest estimate with the already-charged sheet
  charge head by charge head and prints a net statement.
- **History** — automatically saved estimates from this browser, with
  expandable calculations, PDF printing and individual or bulk removal.

Estimates, the charged ledger and consumer credentials are written to
`localStorage`. They are intentionally device-local and are not sent to a server.
The History page warns users to print or save a PDF copy before clearing browser
data.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). If port 3000 is occupied,
run `npm run dev -- -p 3001`.

For a production build:

```bash
npm run build
npm start
```

## Project structure

```text
app/
  to-be-charged/     Consumer credentials and sundry estimate
  already-charged/   Charge entry sheet
  net-summary/       To-be vs already-charged net statement
  history/           Locally stored calculation history
  layout.tsx         Shared shell, metadata and fonts
  globals.css        Design system and responsive/print styles
components/
  consumer-details.tsx
  tariff-calculator.tsx
  charged-ledger.tsx
  net-summary.tsx
  calculation-history.tsx
  site-header.tsx
  site-footer.tsx
  page-header.tsx
lib/
  tariff.ts          Tariff periods, schedule, billing rules and calculations
  ledger.ts          Charged-entry storage, totals and validation
  consumer.ts        Consumer credential storage
  estimate.ts        To be charged inputs and last estimate storage
  net.ts             Net summary calculation
  history.ts         Local storage records and validation
  format.ts          INR and number formatting helpers
```

The tariff schedule and calculation rules are isolated in `lib/tariff.ts`. The
original static HTML has been kept at the repository root for reference.

Figures remain indicative. Confirm the applicable tariff order and standard
operating procedure before using them for official billing.
