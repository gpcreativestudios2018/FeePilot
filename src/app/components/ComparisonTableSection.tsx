'use client';

import * as React from 'react';
import type { FC } from 'react';

// Reuse the same analytics helper already wired for "Share" and "Copy Link"
import { track } from '@/lib/analytics';

// If your table row type lives elsewhere, align this with your actual shape.
// These fields are typical for a fee comparison table.
export type ComparisonRow = {
  marketplace: string;
  listingPrice: number;    // user-entered price
  fees: number;            // total fees for this marketplace
  net: number;             // payout after fees
  notes?: string;          // optional
};

export type ComparisonTableSectionProps = {
  rows: ComparisonRow[];
  heading?: string;
  className?: string;
};

const numberToMoney = (n: number) =>
  Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);

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
          // Minimal CSV escaping (wrap if contains comma, quote, newline)
          if (/[",\n]/.test(s)) {
            return `"${s.replace(/"/g, '""')}"`;
          }
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
  rows,
  heading = 'Comparison',
  className,
}) => {
  const hasRows = rows && rows.length > 0;

  const handleDownloadCsv = React.useCallback(() => {
    // 🔔 Analytics: Track CSV download (prod only if Plausible domain is set)
    // Keep the event name EXACT to make dashboards consistent.
    track('Download CSV', {
      rows: rows.length,
    });

    const csv = buildCsv(rows);
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadTextFile(`fee-pilot-comparison-${timestamp}.csv`, csv);
  }, [rows]);

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
            {rows.map((r, idx) => (
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
