import type { Lifter } from '@/lib/api';
import type { Unit } from '@/stores/useUnitStore';

const KG_TO_LBS = 2.20462;

export function convertWeight(value: number | null, unit: Unit): number | null {
  if (value === null) {
    return null;
  }

  if (unit === 'kg') {
    return value;
  }

  return value * KG_TO_LBS;
}

export function convertLifterWeights(lifter: Lifter, unit: Unit): Lifter {
  if (unit === 'kg') {
    return lifter;
  }

  return {
    ...lifter,
    bodyweight: convertWeight(lifter.bodyweight, unit),
    squat: convertWeight(lifter.squat, unit),
    bench: convertWeight(lifter.bench, unit),
    deadlift: convertWeight(lifter.deadlift, unit),
    total: convertWeight(lifter.total, unit),
  };
}

export function formatWeight(value: number | null, unit: Unit): string {
  if (value === null) {
    return '-';
  }

  return `${value.toFixed(1)} ${unit}`;
}
