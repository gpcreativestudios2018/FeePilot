// State-level sales tax data (base rates only, no local surtaxes).
// Source of truth TBD; treat as placeholders until we wire a verified dataset.
// You can set real rates later without touching consumer code.

export type USStateCode =
  | 'AL' | 'AK' | 'AZ' | 'AR' | 'CA' | 'CO' | 'CT' | 'DE' | 'FL' | 'GA'
  | 'HI' | 'ID' | 'IL' | 'IN' | 'IA' | 'KS' | 'KY' | 'LA' | 'ME' | 'MD'
  | 'MA' | 'MI' | 'MN' | 'MS' | 'MO' | 'MT' | 'NE' | 'NV' | 'NH' | 'NJ'
  | 'NM' | 'NY' | 'NC' | 'ND' | 'OH' | 'OK' | 'OR' | 'PA' | 'RI' | 'SC'
  | 'SD' | 'TN' | 'TX' | 'UT' | 'VT' | 'VA' | 'WA' | 'WV' | 'WI' | 'WY'
  | 'DC' // include DC for convenience
;

export type USStateRate = {
  code: USStateCode;
  name: string;
  /** Base state-level sales tax as a percentage (e.g., 6.0 for 6%). `null` if no state tax. */
  basePct: number | null;
};

// NOTE: These values are SAFE PLACEHOLDERS.
// We'll plug authoritative rates in a follow-up step.
export const STATE_RATES: USStateRate[] = [
  { code: 'AL', name: 'Alabama', basePct: 4.0 },
  { code: 'AK', name: 'Alaska', basePct: null },      // no state-level sales tax
  { code: 'AZ', name: 'Arizona', basePct: 5.6 },
  { code: 'AR', name: 'Arkansas', basePct: 6.5 },
  { code: 'CA', name: 'California', basePct: 6.0 },
  { code: 'CO', name: 'Colorado', basePct: 2.9 },
  { code: 'CT', name: 'Connecticut', basePct: 6.35 },
  { code: 'DE', name: 'Delaware', basePct: null },     // no state-level sales tax
  { code: 'FL', name: 'Florida', basePct: 6.0 },
  { code: 'GA', name: 'Georgia', basePct: 4.0 },
  { code: 'HI', name: 'Hawaii', basePct: 4.0 },        // GET; treated like sales tax here
  { code: 'ID', name: 'Idaho', basePct: 6.0 },
  { code: 'IL', name: 'Illinois', basePct: 6.25 },
  { code: 'IN', name: 'Indiana', basePct: 7.0 },
  { code: 'IA', name: 'Iowa', basePct: 6.0 },
  { code: 'KS', name: 'Kansas', basePct: 6.5 },
  { code: 'KY', name: 'Kentucky', basePct: 6.0 },
  { code: 'LA', name: 'Louisiana', basePct: 4.45 },
  { code: 'ME', name: 'Maine', basePct: 5.5 },
  { code: 'MD', name: 'Maryland', basePct: 6.0 },
  { code: 'MA', name: 'Massachusetts', basePct: 6.25 },
  { code: 'MI', name: 'Michigan', basePct: 6.0 },
  { code: 'MN', name: 'Minnesota', basePct: 6.875 },
  { code: 'MS', name: 'Mississippi', basePct: 7.0 },
  { code: 'MO', name: 'Missouri', basePct: 4.225 },
  { code: 'MT', name: 'Montana', basePct: null },      // no state-level sales tax
  { code: 'NE', name: 'Nebraska', basePct: 5.5 },
  { code: 'NV', name: 'Nevada', basePct: 6.85 },
  { code: 'NH', name: 'New Hampshire', basePct: null },// no state-level sales tax
  { code: 'NJ', name: 'New Jersey', basePct: 6.625 },
  { code: 'NM', name: 'New Mexico', basePct: 5.125 },
  { code: 'NY', name: 'New York', basePct: 4.0 },
  { code: 'NC', name: 'North Carolina', basePct: 4.75 },
  { code: 'ND', name: 'North Dakota', basePct: 5.0 },
  { code: 'OH', name: 'Ohio', basePct: 5.75 },
  { code: 'OK', name: 'Oklahoma', basePct: 4.5 },
  { code: 'OR', name: 'Oregon', basePct: null },       // no state-level sales tax
  { code: 'PA', name: 'Pennsylvania', basePct: 6.0 },
  { code: 'RI', name: 'Rhode Island', basePct: 7.0 },
  { code: 'SC', name: 'South Carolina', basePct: 6.0 },
  { code: 'SD', name: 'South Dakota', basePct: 4.2 },
  { code: 'TN', name: 'Tennessee', basePct: 7.0 },
  { code: 'TX', name: 'Texas', basePct: 6.25 },
  { code: 'UT', name: 'Utah', basePct: 4.85 },
  { code: 'VT', name: 'Vermont', basePct: 6.0 },
  { code: 'VA', name: 'Virginia', basePct: 4.3 },
  { code: 'WA', name: 'Washington', basePct: 6.5 },
  { code: 'WV', name: 'West Virginia', basePct: 6.0 },
  { code: 'WI', name: 'Wisconsin', basePct: 5.0 },
  { code: 'WY', name: 'Wyoming', basePct: 4.0 },
  { code: 'DC', name: 'District of Columbia', basePct: 6.0 },
];

// Quick lookup map
export const STATE_RATE_MAP: Record<USStateCode, USStateRate> = STATE_RATES
  .reduce((acc, s) => { acc[s.code] = s; return acc; }, {} as Record<USStateCode, USStateRate>);

export function getStateBaseRatePct(code: USStateCode): number | null {
  return STATE_RATE_MAP[code]?.basePct ?? null;
}

export function formatPct(pct: number | null): string {
  return pct == null ? '—' : `${pct.toFixed(pct % 1 ? 2 : 0)}%`;
}
