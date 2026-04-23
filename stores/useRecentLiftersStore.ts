import { create } from 'zustand';

const MAX_RECENT_LIFTERS = 10;

export type RecentLifter = {
  slug: string;
  name: string;
  federation: string;
  sex: string;
  equipment: string;
  weightClass: string;
  dots: number | null;
};

type RecentLiftersState = {
  recentLifters: RecentLifter[];
  addRecentLifter: (lifter: RecentLifter) => void;
  removeRecentLifter: (slug: string) => void;
};

export const useRecentLiftersStore = create<RecentLiftersState>((set) => ({
  recentLifters: [],
  addRecentLifter: (lifter) =>
    set((state) => {
      const deduped = state.recentLifters.filter((entry) => entry.slug !== lifter.slug);
      return {
        recentLifters: [lifter, ...deduped].slice(0, MAX_RECENT_LIFTERS),
      };
    }),
  removeRecentLifter: (slug) =>
    set((state) => ({
      recentLifters: state.recentLifters.filter((entry) => entry.slug !== slug),
    })),
}));
