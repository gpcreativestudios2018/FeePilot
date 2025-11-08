'use client';

import * as React from 'react';
import type { FC } from 'react';
import { track } from '@/lib/analytics';

type Inputs = {
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  discountPct: number;
  tax: number;
};

export type ComparisonRow = {
  marketplace: string;
  listingPrice: number;
  fees: number;
  net: number;
  notes?: string;
};

type ComparisonEntry = {
  platform: string;         // e.g., 'etsy'
  displayName?: string;     // optional pretty name
  listingPrice?: number;    // optional per-platform listing price
  fees?: number;            // total fees for this platform
  totalFees?: number;       // alt name often used
  net?: number;             // payout after fees
  payout?: number;          // alt name often used
  notes?: string;
};

export type ComparisonTableSectionProps = {
  className?: string;
  heading?: string;

  /** Props used by HomeClient */
  isLight?: boolean;
  inputs?: Inputs;
  comparison?: ComparisonEntry[];

  /** Back-compat: direct rows (older call sites) */
  rows?: ComparisonRow[];
};

const numberToMoney = (n: number) =>
  Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n ?? 0);

const coalesceRows = (props: ComparisonTableSectionProps): ComparisonRow[] => {
  if (props.rows && props.rows.length) return props.rows;

  const { comparison = [], inputs } = props;
  const baseListing = inputs?.price ?? 0;

  return comparison.map((c) => {
    const marketplace = c.displayName ?? c.platform ?? '—';
    const listingPrice = c.listingPrice ?? baseListing;

    // prefer explicit fields, fall back to alternates / simple math
    const fees = (typeof c.fees === 'number' ? c.fees : undefined)
      ?? (typeof c.totalFees === 'number' ? c.totalFees : undefined)
      ?? 0;

    const net = (typeof c.net === 'number' ? c.net : undefined)
      ?? (typeof c.payout === 'number' ? c.payout : undefined)
      ?? (listingPrice - fees);

    return {
      marketplace,
      listingPrice,
      fees,
      net,
      notes: c.notes,
    };
  });
};

const buildCsv = (rows: ComparisonRow[]) => {
  const header = [
    'Marketplace',
    'Listing Price (USD)',
    'Fees (USD)',
    'Net (USD)',
    'Notes',
  ];

  const lines = rows.map((r) => [
    r.marketplace,
    r.listingPrice.toFixed(2),
    r.fees.toFixed(2),
    r.net.toFixed(2),
    r.notes ?? '',
  ]);

  const all = [header, ...lines]
    .map((cols) =>
      cols
        .map((c) => {
          const s = String(c);
          if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
          return s;
        })
        .join(',')
    )
    .join('\n');

  return all;
};

const downloadTextFile = (filename: string, contents: string) => {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

export const ComparisonTableSection: FC<ComparisonTableSectionProps> = ({
  className,
  heading = 'Comparison',
  ...rest
}) => {
  const derivedRows = React.useMemo(() => coalesceRows(rest), [rest]);
  const hasRows = derivedRows.length > 0;

  const handleDownloadCsv = React.useCallback(() => {
    track('Download CSV', { rows: derivedRows.length });

    const csv = buildCsv(derivedRows);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadTextFile(`fee-pilot-comparison-${timestamp}.csv`, csv);
  }, [derivedRows]);

  return (
    <section className={className} suppressHydrationWarning>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">{heading}</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            disabled={!hasRows}
            className="rounded px-3 py-1.5 text-sm border border-neutral-300 hover:bg-neutral-50 disabled:opacity-50"
            aria-disabled={!hasRows}
            title={hasRows ? 'Download CSV' : 'No data to export'}
          >
            Download CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-neutral-200">
        <table className="min-w-full text-sm">
          <thead className="bg-neutral-50">
            <tr>
              <th className="text-left px-3 py-2">Marketplace</th>
              <th className="text-right px-3 py-2">Listing Price</th>
              <th className="text-right px-3 py-2">Fees</th>
              <th className="text-right px-3 py-2">Net</th>
              <th className="text-left px-3 py-2">Notes</th>
            </tr>
          </thead>
          <tbody>
            {derivedRows.map((r, idx) => (
              <tr key={`${r.marketplace}-${idx}`} className="border-t">
                <td className="px-3 py-2">{r.marketplace}</td>
                <td className="px-3 py-2 text-right">{numberToMoney(r.listingPrice)}</td>
                <td className="px-3 py-2 text-right">{numberToMoney(r.fees)}</td>
                <td className="px-3 py-2 text-right">{numberToMoney(r.net)}</td>
                <td className="px-3 py-2">{r.notes ?? ''}</td>
              </tr>
            ))}
            {!hasRows && (
              <tr>
                <td className="px-3 py-6 text-neutral-500" colSpan={5}>
                  No data yet — adjust inputs to see marketplace comparisons.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};

export default ComparisonTableSection;
