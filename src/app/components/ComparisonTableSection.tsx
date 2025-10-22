// src/app/components/ComparisonTableSection.tsx
"use client";

import React, { useMemo } from "react";
import CurrentInputs, { CurrentInputsProps } from "./CurrentInputs";
import NumberCell from "./NumberCell";
import { cx, formatMoneyWithParens } from "../../lib/format";

export type ComparisonRow = {
  platform: string;
  profit: number;
  marginPct: number;
  marketplaceFee: number;
  paymentFee: number;
  listingFee: number;
  totalFees: number;
};

type Props = {
  inputs: CurrentInputsProps;
  comparison: ComparisonRow[];
  className?: string;
};

export default function ComparisonTableSection({
  inputs,
  comparison,
  className,
}: Props) {
  // Find index of highest profit row (first one wins ties)
  const bestIndex = useMemo(() => {
    if (!comparison.length) return -1;
    let idx = 0;
    let max = -Infinity;
    for (let i = 0; i < comparison.length; i++) {
      const v = comparison[i].profit;
      if (v > max) {
        max = v;
        idx = i;
      }
    }
    return idx;
  }, [comparison]);

  return (
    <section
      className={cx(
        "mt-10 rounded-2xl border border-purple-600/40 p-4 sm:p-6",
        className
      )}
    >
      {/* Current Inputs banner */}
      <CurrentInputs {...inputs} className="mb-4" />

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-gray-300">
            <tr>
              <th className="py-2 pr-4">Platform</th>
              <th className="py-2 pr-4">Profit</th>
              <th className="py-2 pr-4">Margin</th>
              <th className="py-2 pr-4">Marketplace fee</th>
              <th className="py-2 pr-4">Payment fee</th>
              <th className="py-2 pr-4">Listing fee</th>
              <th className="py-2 pr-4">Total fees</th>
            </tr>
          </thead>
          <tbody>
            {comparison.map((row, i) => {
              const isBest = i === bestIndex;
              return (
                <tr
                  key={row.platform}
                  className={cx(
                    "border-t border-white/10",
                    isBest && "bg-emerald-500/5"
                  )}
                >
                  <td className="py-2 pr-4">
                    <span className="inline-flex items-center gap-2">
                      <span className="rounded-lg border border-white/10 px-2 py-1">
                        {row.platform.slice(0, 1).toUpperCase() + row.platform.slice(1)}
                      </span>
                      {isBest && (
                        <span className="rounded-full border border-emerald-500/50 px-2 py-0.5 text-xs text-emerald-300">
                          Best
                        </span>
                      )}
                    </span>
                  </td>

                  {/* Profit with red + parentheses when negative, green when positive */}
                  <NumberCell kind="money" value={row.profit} positiveGreen />

                  {/* Margin in red when negative (shows natural minus sign) */}
                  <NumberCell kind="percent" value={row.marginPct} />

                  {/* Fees and totals */}
                  <td className="py-2 pr-4">{formatMoneyWithParens(row.marketplaceFee)}</td>
                  <td className="py-2 pr-4">{formatMoneyWithParens(row.paymentFee)}</td>
                  <td className="py-2 pr-4">{formatMoneyWithParens(row.listingFee)}</td>
                  <td className="py-2 pr-4">{formatMoneyWithParens(row.totalFees)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
