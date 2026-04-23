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

  if (normalized === 'ipf53') return 'ipf53';
  if (normalized === 'ipf59') return 'ipf59';
  if (normalized === 'ipf66') return 'ipf66';
  if (normalized === 'ipf74') return 'ipf74';
  if (normalized === 'ipf83') return 'ipf83';
  if (normalized === 'ipf93') return 'ipf93';
  if (normalized === 'ipf105') return 'ipf105';
  if (normalized === 'ipf120') return 'ipf120';
  if (normalized === 'ipfover120') return 'ipfover120';
  if (normalized === 'ipf43') return 'ipf43';
  if (normalized === 'ipf47') return 'ipf47';
  if (normalized === 'ipf52') return 'ipf52';
  if (normalized === 'ipf57') return 'ipf57';
  if (normalized === 'ipf63') return 'ipf63';
  if (normalized === 'ipf69') return 'ipf69';
  if (normalized === 'ipf76') return 'ipf76';
  if (normalized === 'ipf84') return 'ipf84';
  if (normalized === 'ipfover84') return 'ipfover84';

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
  if (normalized === 'Squat') return 'by-squat';
  if (normalized === 'Bench') return 'by-bench';
  if (normalized === 'Deadlift') return 'by-deadlift';

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
