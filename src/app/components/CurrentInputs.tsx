// src/app/components/CurrentInputs.tsx
import React from "react";
import {
  formatMoneyWithParens,
  formatPercent,
  cx,
} from "../../lib/format";

export type CurrentInputsProps = {
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  discountPct: number;
  tax: number;
  className?: string;
  // NEW: makes the small summary line darker in light mode
  isLight?: boolean;
};

export default function CurrentInputs({
  price,
  shipCharge,
  shipCost,
  cogs,
  discountPct,
  tax,
  className,
  isLight = false,
}: CurrentInputsProps) {
  const detailClass = isLight ? "text-gray-700" : "text-gray-300";

  return (
    <div className={cx("mb-4", className)}>
      <div className="text-base font-semibold">Current Inputs</div>
      <div className={cx("text-sm", detailClass)}>
        (
        {formatMoneyWithParens(price)} price,{" "}
        {formatMoneyWithParens(shipCharge)} ship charge,{" "}
        {formatMoneyWithParens(shipCost)} ship cost,{" "}
        {formatMoneyWithParens(cogs)} COGS,{" "}
        {formatPercent(discountPct, 1)} discount,{" "}
        {formatMoneyWithParens(tax)} tax
        )
      </div>
    </div>
  );
}
