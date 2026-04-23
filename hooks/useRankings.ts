import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchRankings, type RankingsQuery } from '@/lib/api';

type FilterInput = {
  federation: string;
  weightClass: string;
  sex: string;
  equipment: string;
  ageClass: string;
  year: string;
  sortBy: string;
};

function mapFiltersToQuery(filters: FilterInput): RankingsQuery {
  return {
    fed: mapFederation(filters.federation),
    class: mapWeightClass(filters.weightClass),
    sex: mapSex(filters.sex),
    equipment: mapEquipment(filters.equipment),
    ageclass: normalizeFilterValue(filters.ageClass),
    year: normalizeFilterValue(filters.year),
    sort: mapSort(filters.sortBy),
  };
}

function normalizeFilterValue(value: string): string | undefined {
  if (!value || value === 'All') {
    return undefined;
  }

  return value;
}

function mapFederation(value: string): string | undefined {
  const normalized = normalizeFilterValue(value);
  return normalized ? normalized.toLowerCase() : undefined;
}

function mapWeightClass(value: string): string | undefined {
  const normalized = normalizeFilterValue(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === '140+') return 'over140';
  if (normalized === '110+') return 'over110';
  if (normalized === '90+') return 'over90';

  return normalized;
}

function mapSex(value: string): string | undefined {
  const normalized = normalizeFilterValue(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'M') return 'men';
  if (normalized === 'F') return 'women';

  return normalized.toLowerCase();
}

function mapEquipment(value: string): string | undefined {
  const normalized = normalizeFilterValue(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'Raw') return 'raw';
  if (normalized === 'Wraps') return 'wraps';
  if (normalized === 'Single-ply') return 'single';
  if (normalized === 'Multi-ply') return 'multi';
  if (normalized === 'Unlimited') return 'unlimited';

  return normalized.toLowerCase();
}

function mapSort(value: string): string | undefined {
  const normalized = normalizeFilterValue(value);
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'Dots') return 'by-dots';
  if (normalized === 'Wilks') return 'by-wilks';
  if (normalized === 'Total') return 'by-total';
  if (normalized === 'GL Points') return 'by-goodlift';

  return normalized.toLowerCase();
}

export function useRankings(filters: FilterInput) {
  const query = mapFiltersToQuery(filters);

  return useInfiniteQuery({
    queryKey: ['rankings', query.fed, query.class, query.sex, query.equipment, query.ageclass, query.year, query.sort],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => fetchRankings({ ...query, page: pageParam }),
    getNextPageParam: (lastPage) =>
      lastPage.hasNextPage ? lastPage.page + 1 : undefined,
  });
}
