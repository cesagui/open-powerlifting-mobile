import { create } from 'zustand';

type FavoriteFederationsState = {
  favoriteFederations: string[];
  addFavorite: (federation: string) => void;
  removeFavorite: (federation: string) => void;
  isFavorite: (federation: string) => boolean;
};

export const useFavoriteFederationsStore = create<FavoriteFederationsState>((set, get) => ({
  favoriteFederations: [],
  addFavorite: (federation) =>
    set((state) => ({
      favoriteFederations: Array.from(new Set([...state.favoriteFederations, federation])),
    })),
  removeFavorite: (federation) =>
    set((state) => ({
      favoriteFederations: state.favoriteFederations.filter((f) => f !== federation),
    })),
  isFavorite: (federation) => get().favoriteFederations.includes(federation),
}));
