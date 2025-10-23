"use client";

import React from "react";
import {
  formatMoneyWithParens,
  formatPercent,
  isNegative,
  cx,
} from "../../lib/format";

/** Shared props for both inline and table cells */
type BaseProps = {
  value?: number;
  kind: "money" | "percent";
  className?: string;
  /** force green on positive money cells */
  positiveGreen?: boolean;
  /** decimals for percent display (default 1) */
  percentDigits?: number;
  /** when true, use stronger green in light mode */
  isLight?: boolean;
};

function getContent(kind: "money" | "percent", value: number | undefined, digits: number) {
  return kind === "money"
    ? formatMoneyWithParens(value)
    : formatPercent(value, digits);
}

function getColorClasses({
  value,
  kind,
  positiveGreen,
  isLight,
}: Pick<BaseProps, "value" | "kind" | "positiveGreen" | "isLight">) {
  const neg = isNegative(value);
  if (neg) return "text-red-500";
  if (kind === "money" && positiveGreen) {
    // Light mode vivid green; dark mode soft green
    return isLight ? "text-emerald-700" : "text-emerald-300";
  }
  return "";
}

/** Inline version — safe anywhere (returns a <span>) */
export default function NumberInline({
  value,
  kind,
  className,
  positiveGreen = false,
  percentDigits = 1,
  isLight = false,
}: BaseProps) {
  return (
    <span
      className={cx(
        getColorClasses({ value, kind, positiveGreen, isLight }),
        className
      )}
    >
      {getContent(kind, value, percentDigits)}
    </span>
  );
}

/** Table version — only for use *inside* <tr>…</tr> (returns a <td>) */
export function TableNumberCell({
  value,
  kind,
  className,
  positiveGreen = false,
  percentDigits = 1,
  isLight = false,
}: BaseProps) {
  return (
    <td
      className={cx(
        "py-2 pr-4",
        getColorClasses({ value, kind, positiveGreen, isLight }),
        className
      )}
    >
      {getContent(kind, value, percentDigits)}
    </td>
  );
}
