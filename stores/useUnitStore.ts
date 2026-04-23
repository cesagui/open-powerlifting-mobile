import { create } from 'zustand';

export type Unit = 'kg' | 'lbs';

type UnitState = {
  unit: Unit;
  toggleUnit: () => void;
};

export const useUnitStore = create<UnitState>((set) => ({
  unit: 'kg',
  toggleUnit: () =>
    set((state) => ({
      unit: state.unit === 'kg' ? 'lbs' : 'kg',
    })),
}));
