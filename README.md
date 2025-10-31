# Fee Pilot

**Live:** https://fee-pilot.vercel.app  
**Repo:** https://github.com/gpcreativestudios2018/FeePilot  
**Vercel Project:** team `gp-creative-studios-projects`, project `fee-pilot`

---

## What it does

- **Main calculator**  
  8 summary cards, negative numbers in parentheses, decimal inputs, dark/light theme, persistence (`localStorage`), reset.

- **Sharing**  
  Copy a permalink of current inputs (toast: “Permalink copied!”).

- **Comparison table**  
  Cross-platform breakdown + **Export CSV** (client-side via `src/lib/csv.ts`).

- **Pro**  
  - **Reverse calculator** (`/pro/target`)  
    Solve for **Target Profit ($)** _or_ **Target Margin (%)** (profit wins if both set).  
    Considers **Discount (%)** and **Shipping charged to buyer ($)** in the fee base.  
    Shows suggested price + breakdown (fees, total, profit, margin).
  - **UX**  
    “Solving for” pill + explicit text (“Solving for: Profit/Margin”).  
    **Shareable reverse links** (query params).  
    **Local presets** (save/load) + dev-only “Clear presets”.

---

## Tech

- Next.js **15** (App Router, Turbopack), React **19**, TypeScript
- Styling with Tailwind utilities
- Deployed on **Vercel**

---

## Local dev

```bash
# install
npm install

# dev server
npm run dev
# open http://localhost:3000
