import { PALETTE_BY_ID, type ResolvedSwatch, type SwatchId } from './palette.generated';

const SWATCH_IDS = Object.keys(PALETTE_BY_ID) as SwatchId[];
const SWATCH_ID_SET = new Set<string>(SWATCH_IDS);

// Mirrors shared/palette.ts HEX_TO_SWATCH for legacy entries that store hex.
const HEX_TO_SWATCH: Record<string, SwatchId> = {
  '6366f1': 'indigo',
  '0ea5e9': 'sky',
  '22c55e': 'emerald',
  'f59e0b': 'amber',
  'ef4444': 'red',
  '8b5cf6': 'violet',
  'a855f7': 'violet',
  'ec4899': 'pink',
  'f43f5e': 'pink',
  'f97316': 'orange',
  'eab308': 'amber',
  '84cc16': 'lime',
  '10b981': 'emerald',
  '14b8a6': 'teal',
  '06b6d4': 'teal',
  '3b82f6': 'blue',
  '64748b': 'slate',
  '78716c': 'slate',
};

export function resolveSwatchId(value: string | null | undefined): SwatchId {
  if (!value) return 'slate';
  if (SWATCH_ID_SET.has(value)) return value as SwatchId;
  const hex = value.replace(/^#/, '').slice(0, 6).toLowerCase();
  return HEX_TO_SWATCH[hex] ?? 'slate';
}

export function resolveSwatch(value: string | null | undefined): ResolvedSwatch {
  return PALETTE_BY_ID[resolveSwatchId(value)];
}
