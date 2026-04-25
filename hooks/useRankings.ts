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

const FEDERATION_REPLACEMENTS: Record<string, string> = {
    'all feds' : '',
    'all fully-tested' : 'fully-tested', 
    'all tested lifters' : 'all-tested',
    'all usa' : 'all-usa',
    'all tested usa' : 'all-usa-tested',
    'uspa tested' : 'uspa-tested',
    'uspc tested' : 'uspc-tested',
    'wrpf usa' : 'wrpf-usa',
    'wrpf usa tested' : 'wrpf-usa-tested',
    'wuap usa' : 'wuap-usa',
    'gpc and affil.' : 'gpcaff',
    'all uk': 'all-uk',
  'all tested uk' : 'all-uk-tested',
  'all scottish' : 'all-scotland',
  'uk ipl tested' : 'ukipl-tested',
  'ukpu tested' : 'ukpu-tested',
  'wrpf uk' : 'wrpf-uk',
  'wrpf uk tested' : 'wrpf-uk-tested',
  'all algeria': 'all-algeria',
  'wwpl argentina': 'wppl-argentina',
  'wrpf argentina': 'wrpf-argentina',
  'all australia' : 'all-australia',
  'all tested australia' : 'all-australia-tested',
  'auspl tested' : 'auspl-tested',
  'usapl australia' : 'usapl-australia',
  'all austria' : 'all-austria',
  'all azeri': 'all-azerbaijan',
  'all belarus': 'all-belarus',
  'gsf belarus': 'gsf-belarus',
  'wppl belarus': 'wppl-belarus',
  'wpsf belarus': 'wpsf-belarus',
  'wrpf belarus': 'wrpf-belarus',
  'all belgian': 'all-belgium',
  'all belgian ipf': 'all-ipf-belgium',
  'all belizean': 'all-belize',
  'all bolivian': 'all-bolivia',
  'wrpf bolivia': 'wprf-bolivia',
  'all lifters from b & h' : 'all-bosnia-and-herzegovina',
  'all brazil' : 'all-brazil',
  'gpc brazil': 'gpc-brazil',
  'wrpf brazil': 'wrpf-brazil',
  'wppl brazil': 'wppl-brazil',
  'all bulgarian': 'all-bulgaria',
  'wrpf bulgaria': 'wrpf-bulgaria',
  'all canadian' : 'all-canada',
  'wrpf-can tested': 'wrpf-can-tested',
  'all chilean': 'all-chile',
  'ipl-chile tested': 'iplchile-tested',
  'all chinese': 'all-china',
  'ipl-china tested' : 'iplchina-tested',
  'all colombian' : 'all-colombia',
  'wrpf costa rica' : 'wrpf-costa',
  'all croatia': 'all-croatia',
  'all cypriot': 'all-cyprus',
  'all czech': 'all-czechia',
  'all danish': 'all-denmark',
  'all ecuadorian': 'all-ecuador',
  'wrpf ecuador': 'wrpf-ecuador',
  'all egyptian': 'all-egypt',
  'wpc egypt': 'wpc-egypt',
  'all estonian': 'all estonia',
  'all finnish': 'all-finland',
  'wpc finland': 'wpc-finland',
  'all french': 'all-france',
  'gpc france' : 'gpc-france',
  'wpc france': 'wpc-france',
  'wrpf france': 'wrpf-france',
  'all georgian': 'all-georgia',
  'wppl georgia': 'wppl-georgia',
  'all german': 'all-germany',
  'wuap germany': 'wuap-germany',
  'wpc germany' : 'wpc-germany',
  'wrpf germany': 'wrpf-de',
  'all greek' : 'all-greece',
  'all guatemalan' : 'all-guatemala',
  'all guyanese': 'all-guyana',
  'all honduran': 'all-honduras',
  'wrpf honduras' : 'wrpf-honduras',
  'all hong kong' : 'all-hongkong',
  'all hungarian': 'all-hungary',
  'ipl hungary' : 'ipl-hungary',
  'wrpf hungary' : 'wrpf-hun',
  'all icelandic': 'all-iceland',
  'wpc iceland' : 'wpc-iceland',
  'wrpf iceland' : 'wrpf-iceland',
  'all indian' : 'all-india',
  'wp india': 'wp-india',
  'wprf india' : 'wrpf-india',
  'all indonesian' : 'all-indonesia',
  'all iranian' : 'all-iran',
  'all iraqi': 'all-iraq',
  'all irish' : 'all-ireland',
  'wrpf eire' : 'wrpf-eire',
  'all israeli' : 'all-israel',
  'gpc israel' : 'gpc-isr',
  'all italian' : 'all-italy',
  'ipl italy' : 'ipl-italy',
  'wpc italy' : 'wpc-italy',
  'wrpf italy' : 'wrpf-italy',
  'all japanese' : 'all-japan',
  'all kazakh' : 'all-kazakhstan',
  'wpc kazakhstan' : 'wpc-kaz',
  'wrpf kazakhstan' : 'wrpf-kaz',
  'all kuwaiti' : 'all-kuwait',
  'all kyrgyzstani' : 'all-kyrgyzstan',
  'wpc kyrgyzstan' : 'wpc-kgz',
  'all latvian' : 'all-latvia',
  'wpc latvia' : 'wpc-latvia',
  'all lebanese' : 'all-lebanon',
  'all libyan' : 'all-libya',
  'all lithuanian' : 'all-lithuania',
  'wrpf lithuania' : 'wrpf-lithuania',
  'all malaysian' : 'all-malaysia',
  'all mexican' : 'all-mexico',
  'wppl mexico' : 'wppl-mexico',
  'all moldovan' : 'all-moldova',
  'wpc moldova' : 'wpc-moldova',
  'all mongolian' : 'all-mongolian',
  'all moroccan' : 'all-morocco',
  'all nauruan' : 'all-naura',
  'all nepalese' : 'all-nepal',
  'all dutch' : 'all-netherlands',
  'all new zealand' : 'all-newzealand',
  'nzpu tested' : 'nzpu-tested',
  'all nicaraguan' : 'all-nicaraguan',
  'all nieue' : 'all-niue',
  'all norwegian' : 'all-norway',
  'all oman' : 'all-oman',
  'all panama' : 'all-panama',
  'all papua new guinean' : 'all-papuanewguinea',
  'all paraguayan' : 'all-paraguay',
  'all peruvian' : 'all-peru',
  'all phillippine' : 'all-phillippines',
  'all polish' : 'all-poland',
  'gpc poland' : 'gpc-pol',
  'wpc poland' : 'wpc-poland',
  'xpc poland' : 'xpc-poland',
  'all portuguese' : 'all-portugal',
  'app (paraguay)' : 'apparaguay',
  'app (portugal)' : 'apportugal',
  'gpc portugal' : 'gpc-portugal',
  'wpc portugal' : 'wpc-portugal',
  'wrpf portugal' : 'wrpf-portugal',
  'all qatar' : 'all-qatar',
  'all russian' : 'all-russia',
  'ipl-russia tested' : 'iplrussia-tested',
  'wppl russia' : 'wppl-russia', 
  'all saudi' : 'all-saudiarabia',
  'all serbian' : 'all-serbia',
  'all singaporean' : 'all-singapore',
  'all slovak' : 'all-slovakia',
  'all slovenian' : 'all-slovenia',
  'wrpf slovenia' : 'wrpf-slovenia',
  'all south african' : 'all-southafrica',
  'all south korean' : 'all-southkorean',
  'all spanish' : 'all-spain',
  'ipl spain' : 'ipl-spain',
  'wrpf spain' : 'wrpf-spain',
  'all sri lankan' : 'all-srilanka',
  'all swedish' : 'all-sweden',
  'wrpf sweden' : 'wrpf-sweden',
  'all swiss' : 'all-switzerland',
  'all syrian' : 'all-syria',
  'all taiwanese' : 'all-taiwan',
  'all thai' : 'all-thailand',
  'all turkish' : 'all-turkey',
  'all uae' : 'all-uae',
  'all ugandan' : 'all-uganda',
  'all ukrainian' : 'all-ukraine',
  'all uruguayan' : 'all-uruguay',
  'all us virgin islands' : 'all-usvirginislands',
  'all venezuelan' : 'all venezuela',
  'wrpf venezuela' : 'wrpf-venezuela',
  'all vietnamese' : 'all-vietnam',
  'wrpf vietnam' : 'wrpf-vietnam'
};

function mapFederation(value: string): string | undefined {
  const normalized = normalizeFilterValue(value);
  if (!normalized) {
    return undefined;
  }

  const normalizedLower = normalized.toLowerCase();
  const replacement = FEDERATION_REPLACEMENTS[normalizedLower];
  if (replacement !== undefined) {
    return replacement || undefined;
  }

  return normalizedLower.replace(/\s+/g, '');
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
  if (normalized === 'para49') return 'para49';
  if (normalized === 'para54') return 'para54';
  if (normalized === 'para59') return 'para59';
  if (normalized === 'para65') return 'para65';
  if (normalized === 'para72') return 'para72';
  if (normalized === 'para80') return 'para80';
  if (normalized === 'para88') return 'para88';
  if (normalized === 'para97') return 'para97';
  if (normalized === 'para107') return 'para107';
  if (normalized === 'paraover107') return 'paraover107';
  if (normalized === 'para41') return 'para41';
  if (normalized === 'para45') return 'para45';
  if (normalized === 'para50') return 'para50';
  if (normalized === 'para55') return 'para55';
  if (normalized === 'para61') return 'para61';
  if (normalized === 'para67') return 'para67';
  if (normalized === 'para73') return 'para73';
  if (normalized === 'para79') return 'para79';
  if (normalized === 'para86') return 'para86';
  if (normalized === 'paraover86') return 'paraover86';
  if (normalized === 'wp62') return 'wp62';
  if (normalized === 'wp69') return 'wp69';
  if (normalized === 'wp77') return 'wp77';
  if (normalized === 'wp85') return 'wp85';
  if (normalized === 'wp94') return 'wp94';
  if (normalized === 'wp105') return 'wp105';
  if (normalized === 'wp120') return 'wp120';
  if (normalized === 'wpover120') return 'wpover120';
  if (normalized === 'wp48') return 'wp48';
  if (normalized === 'wp53') return 'wp53';
  if (normalized === 'wp58') return 'wp58';
  if (normalized === 'wp64') return 'wp64';
  if (normalized === 'wp72') return 'wp72';
  if (normalized === 'wp84') return 'wp84';
  if (normalized === 'wp100') return 'wp100';
  if (normalized === 'wpover100') return 'wpover100';

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
