'use client';

import * as React from 'react';
import { PILL_CLASS } from '@/lib/ui';
import type { FeeRule, PlatformKey } from '@/data/fees';

export type FeeOverrides = Partial<FeeRule> & { listingFixed?: number };

type Props = {
  platform: PlatformKey;
  baseRule: FeeRule;
  overrides: FeeOverrides;
  onChange: (next: FeeOverrides) => void;
  onClear: () => void;
};

const numberOrUndef = (v: string): number | undefined => {
  if (v.trim() === '') return undefined;
  const n = Number.parseFloat(v);
  return Number.isFinite(n) ? n : undefined;
};

export default function FeeOverridesDev({
  platform,
  baseRule,
  overrides,
  onChange,
  onClear,
}: Props) {
  // controlled text boxes that can be blank (=> undefined override)
  const [local, setLocal] = React.useState<{
    marketplacePct: string;
    marketplaceFixed: string;
    paymentPct: string;
    paymentFixed: string;
    listingFixed: string;
  }>(() => ({
    marketplacePct: overrides.marketplacePct?.toString() ?? '',
    marketplaceFixed: overrides.marketplaceFixed?.toString() ?? '',
    paymentPct: overrides.paymentPct?.toString() ?? '',
    paymentFixed: overrides.paymentFixed?.toString() ?? '',
    listingFixed: (overrides as { listingFixed?: number }).listingFixed?.toString() ?? '',
  }));

  React.useEffect(() => {
    setLocal({
      marketplacePct: overrides.marketplacePct?.toString() ?? '',
      marketplaceFixed: overrides.marketplaceFixed?.toString() ?? '',
      paymentPct: overrides.paymentPct?.toString() ?? '',
      paymentFixed: overrides.paymentFixed?.toString() ?? '',
      listingFixed: (overrides as { listingFixed?: number }).listingFixed?.toString() ?? '',
    });
  }, [overrides]);

  const push = (next: typeof local) => {
    setLocal(next);
    onChange({
      marketplacePct: numberOrUndef(next.marketplacePct),
      marketplaceFixed: numberOrUndef(next.marketplaceFixed),
      paymentPct: numberOrUndef(next.paymentPct),
      paymentFixed: numberOrUndef(next.paymentFixed),
      listingFixed: numberOrUndef(next.listingFixed),
    });
  };

  return (
    <section className="rounded-2xl border border-amber-500/40 p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold">
          Dev-only: Fee overrides — <span className="opacity-80">{platform}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            className={PILL_CLASS}
            onClick={onClear}
            title="Clear all overrides for this platform"
          >
            Clear overrides
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-amber-500/80">
        Leave a field blank to use the platform’s default. These overrides affect calculations immediately,
        and are not persisted.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="Marketplace %"
          base={baseRule.marketplacePct ?? 0}
          value={local.marketplacePct}
          onChange={(v) => push({ ...local, marketplacePct: v })}
        />
        <Field
          label="Marketplace fixed ($)"
          base={baseRule.marketplaceFixed ?? 0}
          value={local.marketplaceFixed}
          onChange={(v) => push({ ...local, marketplaceFixed: v })}
        />
        <Field
          label="Payment %"
          base={baseRule.paymentPct ?? 0}
          value={local.paymentPct}
          onChange={(v) => push({ ...local, paymentPct: v })}
        />
        <Field
          label="Payment fixed ($)"
          base={baseRule.paymentFixed ?? 0}
          value={local.paymentFixed}
          onChange={(v) => push({ ...local, paymentFixed: v })}
        />
        <Field
          label="Listing fixed ($)"
          base={(baseRule as { listingFixed?: number }).listingFixed ?? 0}
          value={local.listingFixed}
          onChange={(v) => push({ ...local, listingFixed: v })}
        />
      </div>
    </section>
  );
}

function Field(props: {
  label: string;
  base: number;
  value: string;
  onChange: (v: string) => void;
}) {
  const { label, base, value, onChange } = props;
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-gray-500 dark:text-gray-400">
        {label}{' '}
        <span className="opacity-70">(base {base})</span>
      </span>
      <input
        type="number"
        inputMode="decimal"
        placeholder="blank = base"
        className="w-full rounded-xl border border-amber-500/40 bg-transparent px-3 py-2 outline-none"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
