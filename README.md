# Runway — retirement calculator

Interactive retirement runway calculator inspired by [Adriaan’s demo](https://x.com/adriaandotcom/status/2108502793665597779). Answer “How long will your money last?” with starting capital, monthly gross withdrawal, expected return, and inflation — then watch the remaining balance chart update live.

## Features

- Starting capital (€ million), monthly gross withdrawal, effective annual return, and annual inflation
- Starting net/month estimate, runway age, and balance at age 100
- Remaining-balance chart (ages 37–100 by default) with hover readouts
- Settings menu to change current age

## Stack

Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, Recharts.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:4327](http://127.0.0.1:4327).

## Scripts

| Command         | Description                |
| --------------- | -------------------------- |
| `npm run dev`   | Dev server on port **4327** |
| `npm run build` | Production build           |
| `npm run start` | Start production server    |
| `npm run lint`  | ESLint                     |

## Notes

Projections are in **nominal euros**: the portfolio compounds monthly from the effective annual return; withdrawals step up with inflation once per year. Net income is an approximate take-home mapping from gross (not formal tax advice).
