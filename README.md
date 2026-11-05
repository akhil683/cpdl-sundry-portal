# CPDL Sundry Billing Portal

A Next.js conversion of the CPDL sundry billing worksheet. The portal keeps the
two working areas from the original file:

- **To be charged** — an estimate calculator with prorated billing days,
  tariff-wise energy slabs, electricity duty, MC tax, fixed charges and FPPCA.
- **Already charged** — a live charge entry sheet with row-level totals and a
  consolidated summary.
- **History** — automatically saved estimates from this browser, with
  expandable calculations, PDF printing and individual or bulk removal.

Every successful estimate is written to `localStorage`. History is intentionally
device-local and is not sent to a server. The History page warns users to print
or save a PDF copy before clearing browser data.

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
  to-be-charged/     Sundry estimate page
  already-charged/   Charge entry sheet
  history/           Locally stored calculation history
  layout.tsx         Shared shell, metadata and fonts
  globals.css        Design system and responsive/print styles
components/
  tariff-calculator.tsx
  charged-ledger.tsx
  calculation-history.tsx
  site-header.tsx
  site-footer.tsx
  page-header.tsx
lib/
  tariff.ts          Tariff schedule, billing rules and calculations
  history.ts         Local storage records and validation
  format.ts          INR and number formatting helpers
```

The tariff schedule and calculation rules are isolated in `lib/tariff.ts`. The
original static HTML has been kept at the repository root for reference.

Figures remain indicative. Confirm the applicable tariff order and standard
operating procedure before using them for official billing.
