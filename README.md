# RR - Global Rights Management (React + TDD)

A small React app that determines which music contracts are available for a given distribution partner on a given effective date.

It follows the spec in the attached PDF (2 text file inputs + UI inputs + output grid).  

## Tech
- React 18 + TypeScript
- Vite
- Vitest + Testing Library (TDD-friendly)

## Setup
```bash
npm install
```

## Run locally
```bash
npm run dev
```

Open the printed URL.

## Run tests
```bash
npm test
```

## Build
```bash
npm run build
npm run preview
```

## How to use the app
1. Either click **Load sample data** (recommended for a quick run), or upload:
   - **Music Contracts** text file (pipe `|` separated, header row expected)
   - **Distribution Partner Contracts** text file (pipe `|` separated, header row expected)
2. Choose a partner and date.
3. Click **Search**.
4. The grid shows the *active* contracts for that partner on that date.

### Parsing rules (as implemented)
- `|` separated fields; first row is the header.
- Usages in Music Contracts are comma-separated and trimmed.
- Empty `EndDate` = open-ended contract.
- Date filtering: `StartDate <= effectiveDate <= EndDate` (if EndDate exists), inclusive.

### Output rules (as implemented)
- Partner supports one or more usages (from partner file).
- For each active music contract, only the usage(s) supported by the partner are emitted.
  - Example: if a contract has `digital download, streaming` and partner supports only `digital download`, the output row will show only `digital download`.
- Results are sorted by `Artist`, then `Title`, then `Usages`.

## Project structure
- `src/domain/` -> pure functions (parsing + filtering) with scenario tests
- `src/App.tsx` -> UI for file inputs + search + results table
- `src/__tests__/` -> unit + UI tests

## Notes
This is intentionally small and easy to reason about, to keep the business rules in pure functions (so tests are fast and stable).
