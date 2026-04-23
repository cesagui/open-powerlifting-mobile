import { create } from 'zustand';

type FilterState = {
  federation: string;
  weightClass: string;
  sex: string;
  equipment: string;
  ageClass: string;
  year: string;
  sortBy: string;
  liftCriteria: string;
  setFederation: (value: string) => void;
  setWeightClass: (value: string) => void;
  setSex: (value: string) => void;
  setEquipment: (value: string) => void;
  setAgeClass: (value: string) => void;
  setYear: (value: string) => void;
  setSortBy: (value: string) => void;
  setLiftCriteria: (value: string) => void;
  resetFilters: () => void;
};

const defaultFilters = {
  federation: 'All',
  weightClass: 'All',
  sex: 'All',
  equipment: 'All',
  ageClass: 'All',
  year: 'All',
  sortBy: 'Dots',
  liftCriteria: 'All',
};

export const useFilterStore = create<FilterState>((set) => ({
  ...defaultFilters,
  setFederation: (value) => set({ federation: value }),
  setWeightClass: (value) => set({ weightClass: value }),
  setSex: (value) => set({ sex: value }),
  setEquipment: (value) => set({ equipment: value }),
  setAgeClass: (value) => set({ ageClass: value }),
  setYear: (value) => set({ year: value }),
  setSortBy: (value) => set({ sortBy: value }),
  setLiftCriteria: (value) => set({ liftCriteria: value }),
  resetFilters: () => set(defaultFilters),
}));
