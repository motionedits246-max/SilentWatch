import type { MotionTier } from '@/types/telemetry';

export const EASINGS = {
  instantOut: [0.2, 0.9, 0.3, 1.0] as const,
  fluidOut: [0.16, 1.0, 0.3, 1.0] as const,
  signatureInOut: [0.4, 0.0, 0.2, 1.0] as const,
  cinematicEditorial: [0.22, 1.0, 0.36, 1.0] as const,
};

export const SPRINGS = {
  pillGlide: { type: 'spring' as const, stiffness: 520, damping: 42, mass: 0.85 },
  explorerExpand: { type: 'spring' as const, stiffness: 360, damping: 36, mass: 0.9 },
  detent: { type: 'spring' as const, stiffness: 700, damping: 44, mass: 0.6 },
};

export interface MotionSpec {
  id: string;
  tier: 1 | 2 | 3 | 4;
  durationMs: number;
  reducedDurationMs: number;
}

export const ANIM_CATALOG: Record<string, MotionSpec> = {
  'ANIM-01': { id: 'ANIM-01', tier: 1, durationMs: 100, reducedDurationMs: 60 },
  'ANIM-02': { id: 'ANIM-02', tier: 1, durationMs: 0, reducedDurationMs: 0 },
  'ANIM-03': { id: 'ANIM-03', tier: 1, durationMs: 85, reducedDurationMs: 0 },
  'ANIM-04': { id: 'ANIM-04', tier: 1, durationMs: 60, reducedDurationMs: 0 },
  'ANIM-05': { id: 'ANIM-05', tier: 2, durationMs: 180, reducedDurationMs: 80 },
  'ANIM-06': { id: 'ANIM-06', tier: 2, durationMs: 160, reducedDurationMs: 80 },
  'ANIM-07': { id: 'ANIM-07', tier: 2, durationMs: 180, reducedDurationMs: 0 },
  'ANIM-08': { id: 'ANIM-08', tier: 2, durationMs: 260, reducedDurationMs: 120 },
  'ANIM-09': { id: 'ANIM-09', tier: 2, durationMs: 200, reducedDurationMs: 80 },
  'ANIM-10': { id: 'ANIM-10', tier: 2, durationMs: 220, reducedDurationMs: 80 },
  'ANIM-11': { id: 'ANIM-11', tier: 2, durationMs: 240, reducedDurationMs: 80 },
  'ANIM-12': { id: 'ANIM-12', tier: 2, durationMs: 280, reducedDurationMs: 100 },
  'ANIM-13': { id: 'ANIM-13', tier: 3, durationMs: 360, reducedDurationMs: 100 },
  'ANIM-14': { id: 'ANIM-14', tier: 3, durationMs: 380, reducedDurationMs: 80 },
  'ANIM-15': { id: 'ANIM-15', tier: 3, durationMs: 380, reducedDurationMs: 0 },
  'ANIM-16': { id: 'ANIM-16', tier: 3, durationMs: 680, reducedDurationMs: 120 },
  'ANIM-17': { id: 'ANIM-17', tier: 3, durationMs: 420, reducedDurationMs: 0 },
  'ANIM-18': { id: 'ANIM-18', tier: 4, durationMs: 1050, reducedDurationMs: 150 },
  'ANIM-19': { id: 'ANIM-19', tier: 4, durationMs: 1200, reducedDurationMs: 180 },
};

export function resolveDurationSec(animId: keyof typeof ANIM_CATALOG, tier: MotionTier): number {
  const spec = ANIM_CATALOG[animId];
  if (!spec) return 0.16;
  if (tier === 'off') return spec.reducedDurationMs / 1000;
  if (tier === 'balanced' && spec.tier >= 3) {
    return (spec.durationMs * 0.7) / 1000;
  }
  return spec.durationMs / 1000;
}

export function prefersSystemReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function effectiveMotionTier(userTier: MotionTier): MotionTier {
  if (prefersSystemReducedMotion()) return 'off';
  return userTier;
}
