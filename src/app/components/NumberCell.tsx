// src/app/components/NumberCell.tsx
"use client";

import React from "react";
import {
  formatMoneyWithParens,
  formatPercent,
  isNegative,
  cx,
} from "../../lib/format";

type NumberCellProps = {
  value: number;
  kind: "money" | "percent";
  className?: string;
  // if you want to force green on positive money cells, pass true
  positiveGreen?: boolean;
  // decimals for percent display (default 1)
  percentDigits?: number;
};

export default function NumberCell({
  value,
  kind,
  className,
  positiveGreen = false,
  percentDigits = 1,
}: NumberCellProps) {
  const negative = isNegative(value);

  const content =
    kind === "money"
      ? formatMoneyWithParens(value)
      : formatPercent(value, percentDigits);

  return (
    <td
      className={cx(
        "py-2 pr-4",
        negative && "text-red-500",
        !negative && kind === "money" && positiveGreen && "text-emerald-300",
        className
      )}
    >
      {content}
    </td>
  );
}
