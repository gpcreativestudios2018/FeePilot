'use client';

import React from 'react';
import { cx, formatMoneyWithParens } from '../../lib/format';

type Props = {
  className?: string;
  isLight?: boolean;
  price: number;
  shipCharge: number;
  shipCost: number;
  cogs: number;
  discountPct: number;
  tax: number;
};

export default function CurrentInputs({
  className,
  isLight = false,
  price,
  shipCharge,
  shipCost,
  cogs,
  discountPct,
  tax,
}: Props) {
  const detailClass = isLight ? 'text-gray-700' : 'text-gray-300';

  return (
    <div className={cx('mb-4', className)}>
      <div className="text-base font-semibold">Current Inputs</div>
      {/* Hydration-safe: values can differ between server and client */}
      <div className={cx('text-sm', detailClass)} suppressHydrationWarning>
        (
        {formatMoneyWithParens(price)} price,{' '}
        {formatMoneyWithParens(shipCharge)} ship charge,{' '}
        {formatMoneyWithParens(shipCost)} ship cost,{' '}
        {formatMoneyWithParens(cogs)} COGS,{' '}
        {discountPct.toFixed(1)}% discount,{' '}
        {formatMoneyWithParens(tax)} tax
        )
      </div>
    </div>
  );
}
