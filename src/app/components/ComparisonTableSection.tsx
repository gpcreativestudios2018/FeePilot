'use client';

import React from 'react';
import CurrentInputs from './CurrentInputs';
import { cx, formatMoneyWithParens } from '../../lib/format';
import { downloadCsv } from '@/lib/csv';
import type { PlatformKey } from '@/data/fees';

type InputsLite = {
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  discountPct: number;
  tax: number;
};

type Row = {
  platform: PlatformKey;
  profit: number;
  marginPct: number;
  marketplaceFee: number;
  paymentFee: number;
  listingFee: number;
  totalFees: number;
};

export default function ComparisonTableSection({
  className,
  isLight,
  inputs,
  comparison,
}: {
  className?: string;
  isLight: boolean;
  inputs: InputsLite;
  comparison: Row[];
}) {
  const border = isLight ? 'border-purple-800/70' : 'border-white/10';
  const headText = isLight ? 'text-gray-800' : 'text-gray-200';
  const bodyText = isLight ? 'text-gray-800' : 'text-gray-200';
  const subtle = isLight ? 'text-gray-600' : 'text-gray-400';

  // Gate dynamic classes to avoid SSR/client className mismatches
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  const onExportCsv = React.useCallback(() => {
    const rows: (string | number)[][] = [
      [
        'Platform',
        'Marketplace fee',
        'Payment fee',
        'Listing fee',
        'Total fees',
        'Profit',
        'Margin %',
      ],
      ...comparison.map((r) => [
        r.platform[0].toUpperCase() + r.platform.slice(1),
        r.marketplaceFee.toFixed(2),
        r.paymentFee.toFixed(2),
        r.listingFee.toFixed(2),
        r.totalFees.toFixed(2),
        r.profit.toFixed(2),
        r.marginPct.toFixed(1),
      ]),
    ];

    const nameBits = [
      `price-${inputs.price}`,
      `shipCharge-${inputs.shipCharge}`,
      `shipCost-${inputs.shipCost}`,
      `cogs-${inputs.cogs}`,
      `disc-${inputs.discountPct}`,
      `tax-${inputs.tax}`,
    ].join('_');

    downloadCsv(`feepilot_comparison_${nameBits}.csv`, rows);
  }, [comparison, inputs]);

  return (
    <section className={cx('rounded-2xl p-4 sm:p-6', className)}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <CurrentInputs
          isLight={isLight}
          className="mb-0"
          price={inputs.price}
          shipCharge={inputs.shipCharge}
          shipCost={inputs.shipCost}
          cogs={inputs.cogs}
          discountPct={inputs.discountPct}
          tax={inputs.tax}
        />

        {/* Export CSV */}
        <button
          type="button"
          onClick={onExportCsv}
          className={cx(
            'shrink-0 rounded-full px-4 py-2 text-base select-none border',
            isLight
              ? 'border-purple-800/70 text-black hover:bg-purple-50'
              : 'border-purple-600/50 text-white hover:bg-white/5'
          )}
          aria-label="Export comparison as CSV"
          title="Export comparison as CSV"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl">
        <table className={cx('w-full text-sm', bodyText)}>
          <thead className={cx(subtle, headText)}>
            <tr className="text-left">
              <th className="py-2 pr-4">Platform</th>
              <th className="py-2 pr-4">Marketplace fee</th>
              <th className="py-2 pr-4">Payment fee</th>
              <th className="py-2 pr-4">Listing fee</th>
              <th className="py-2 pr-4">Total fees</th>
              <th className="py-2 pr-4">Profit</th>
              <th className="py-2 pr-0">Margin</th>
            </tr>
          </thead>

          <tbody className={cx('border-t', border)}>
            {comparison.map((row) => (
              <tr key={row.platform} className="border-t first:border-0">
                <td className="py-2 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span className={cx('rounded-lg border px-2 py-1', border)}>
                      {row.platform.slice(0, 1).toUpperCase() + row.platform.slice(1)}
                    </span>
                  </span>
                </td>

                <td className="py-2 pr-4">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.marketplaceFee)}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.paymentFee)}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.listingFee)}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.totalFees)}
                  </span>
                </td>

                <td
                  className={cx(
                    'py-2 pr-4',
                    mounted && (row.profit < 0 ? 'text-red-500' : isLight ? 'text-emerald-700' : 'text-emerald-300')
                  )}
                >
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.profit)}
                  </span>
                </td>

                <td className="py-2 pr-0">
                  <span
                    className={cx(mounted && row.marginPct < 0 && 'text-red-500')}
                    suppressHydrationWarning
                  >
                    {row.marginPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className={cx('mt-2 text-xs', subtle)}>
          Values are estimates based on current inputs.
        </div>
      </div>
    </section>
  );
}
