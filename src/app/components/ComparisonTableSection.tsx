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
  const headerBg = isLight ? 'bg-purple-50/70' : 'bg-purple-900/30';
  const zebraRow = isLight ? 'bg-gray-50' : 'bg-white/5';

  // Gate dynamic classes to avoid SSR/client className mismatches
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  // Find the best platform(s) - highest profit, handles ties
  const maxProfit = Math.max(...comparison.map((r) => r.profit));
  const bestPlatforms = new Set(
    comparison.filter((r) => r.profit === maxProfit && r.profit > 0).map((r) => r.platform)
  );
  const hasBest = bestPlatforms.size > 0;

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
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            'shrink-0 rounded-full px-5 py-2.5 text-base select-none border min-h-[44px] inline-flex items-center justify-center',
            isLight
              ? 'border-purple-800/70 text-black hover:bg-purple-50'
              : 'border-purple-600/50 text-white hover:bg-white/5',
          )}
          aria-label="Export comparison as CSV"
          title="Export comparison as CSV"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl">
        <table className={cx('w-full text-xs sm:text-sm', bodyText)}>
          <thead className={cx('border-b', border, headerBg, headText)}>
            <tr className="text-left align-middle uppercase tracking-wide">
              <th className="py-2.5 pr-4 text-[0.7rem] sm:text-[0.75rem]">Platform</th>
              <th className="py-2.5 pr-4 text-right text-[0.7rem] sm:text-[0.75rem]">
                Marketplace fee
              </th>
              <th className="py-2.5 pr-4 text-right text-[0.7rem] sm:text-[0.75rem]">
                Payment fee
              </th>
              <th className="py-2.5 pr-4 text-right text-[0.7rem] sm:text-[0.75rem]">
                Listing fee
              </th>
              <th className="py-2.5 pr-4 text-right text-[0.7rem] sm:text-[0.75rem]">
                Total fees
              </th>
              <th className="py-2.5 pr-4 text-right text-[0.7rem] sm:text-[0.75rem]">
                Profit
              </th>
              <th className="py-2.5 pr-0 text-right text-[0.7rem] sm:text-[0.75rem]">
                Margin
              </th>
            </tr>
          </thead>

          <tbody className={cx('border-t', border)}>
            {comparison.map((row, idx) => {
              const isBest = mounted && hasBest && bestPlatforms.has(row.platform);
              return (
              <tr
                key={row.platform}
                className={cx(
                  'border-t first:border-0',
                  idx % 2 === 1 && zebraRow,
                  isBest && (isLight ? 'bg-emerald-50' : 'bg-emerald-900/20'),
                )}
              >
                <td className="py-2.5 pr-4">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className={cx(
                        'rounded-lg border px-2 py-1 text-xs',
                        isBest
                          ? isLight
                            ? 'border-emerald-600 bg-emerald-100 text-emerald-800'
                            : 'border-emerald-500 bg-emerald-900/40 text-emerald-300'
                          : border
                      )}
                    >
                      {row.platform.slice(0, 1).toUpperCase() + row.platform.slice(1)}
                    </span>
                    {isBest && (
                      <span
                        className={cx(
                          'rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase',
                          isLight
                            ? 'bg-emerald-600 text-white'
                            : 'bg-emerald-500 text-black'
                        )}
                      >
                        Best
                      </span>
                    )}
                  </span>
                </td>

                <td className="py-2.5 pr-4 text-right">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.marketplaceFee)}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.paymentFee)}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.listingFee)}
                  </span>
                </td>
                <td className="py-2.5 pr-4 text-right">
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.totalFees)}
                  </span>
                </td>

                <td
                  className={cx(
                    'py-2.5 pr-4 text-right',
                    mounted &&
                      (row.profit < 0
                        ? 'text-red-500'
                        : isLight
                        ? 'text-emerald-700'
                        : 'text-emerald-300'),
                  )}
                >
                  <span suppressHydrationWarning>
                    {formatMoneyWithParens(row.profit)}
                  </span>
                </td>

                <td className="py-2.5 pr-0 text-right">
                  <span
                    className={cx(mounted && row.marginPct < 0 && 'text-red-500')}
                    suppressHydrationWarning
                  >
                    {row.marginPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>

        <div className={cx('mt-3 text-xs', subtle)}>
          Values are estimates based on current inputs.
        </div>
      </div>

      {/* Visual profit comparison chart */}
      {mounted && inputs.price > 0 && (
        <div className="mt-6">
          <h3 className={cx('mb-3 text-sm font-medium', headText)}>
            Profit Comparison
          </h3>
          <div className="space-y-2">
            {(() => {
              // Sort by profit descending for the chart
              const sorted = [...comparison].sort((a, b) => b.profit - a.profit);
              const maxProfitValue = Math.max(...sorted.map((r) => Math.abs(r.profit)));
              const hasNegative = sorted.some((r) => r.profit < 0);

              return sorted.map((row) => {
                const isBest = hasBest && bestPlatforms.has(row.platform);
                const barWidth = maxProfitValue > 0
                  ? Math.abs(row.profit) / maxProfitValue * 100
                  : 0;
                const isNegative = row.profit < 0;

                return (
                  <div key={row.platform} className="flex items-center gap-3">
                    <div className={cx('w-20 shrink-0 text-xs', bodyText)}>
                      {row.platform.charAt(0).toUpperCase() + row.platform.slice(1)}
                    </div>
                    <div className="flex-1 relative">
                      <div
                        className={cx(
                          'h-6 rounded transition-all duration-300',
                          isNegative
                            ? 'bg-red-500/80'
                            : isBest
                            ? isLight
                              ? 'bg-emerald-500'
                              : 'bg-emerald-400'
                            : isLight
                            ? 'bg-purple-400'
                            : 'bg-purple-500/70'
                        )}
                        style={{ width: `${Math.max(barWidth, 2)}%` }}
                      />
                      {/* Show "Best" badge on winning bar */}
                      {isBest && barWidth > 20 && (
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-white">
                          Best
                        </span>
                      )}
                    </div>
                    <div
                      className={cx(
                        'w-16 shrink-0 text-right text-xs font-medium',
                        isNegative
                          ? 'text-red-500'
                          : isBest
                          ? isLight
                            ? 'text-emerald-700'
                            : 'text-emerald-300'
                          : bodyText
                      )}
                      suppressHydrationWarning
                    >
                      {formatMoneyWithParens(row.profit)}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
          {comparison.some((r) => r.profit < 0) && (
            <p className={cx('mt-2 text-xs', subtle)}>
              Red bars indicate a loss at current price.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
