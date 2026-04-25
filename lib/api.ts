import { Platform } from 'react-native';

export interface Lifter {
  rank: number;
  name: string;
  federation: string;
  date: string;
  location: string;
  sex: string;
  age: number | null;
  equipment: string;
  weightClass: string;
  bodyweight: number | null;
  squat: number | null;
  bench: number | null;
  deadlift: number | null;
  total: number | null;
  dots: number | null;
  wilks: number | null;
}

export type AthleteCompetitionRow = {
  name: string;
  sex: string;
  place: string;
  federation: string;
  date: string;
  location: string;
  competition: string;
  division: string;
  age: string;
  equipment: string;
  weightClass: string;
  bodyweight: number | null;
  squat1: number | null;
  squat2: number | null;
  squat3: number | null;
  squat4: number | null;
  bestSquat: number | null;
  bench1: number | null;
  bench2: number | null;
  bench3: number | null;
  bench4: number | null;
  bestBench: number | null;
  deadlift1: number | null;
  deadlift2: number | null;
  deadlift3: number | null;
  deadlift4: number | null;
  bestDeadlift: number | null;
  total: number | null;
  dots: number | null;
  wilks: number | null;
  glossbrenner: number | null;
  goodlift: number | null;
  tested: string;
  country: string;
  state: string;
  parentFederation: string;
  meetCountry: string;
  meetState: string;
  meetTown: string;
  meetName: string;
  sanctioned: string;
  meetPath: string | null;
  meetFederation: string | null;
  meetId: string | null;
};

export type AthletePersonalBest = {
  equipment: string;
  squat: number | null;
  bench: number | null;
  deadlift: number | null;
  total: number | null;
  dots: number | null;
};

export type AthleteProfile = {
  name: string;
  sex: string;
  slug: string;
  personalBests: AthletePersonalBest[];
  results: AthleteCompetitionRow[];
};

export type MeetResultRow = {
  place: string;
  name: string;
  sex: string;
  age: string;
  equipment: string;
  weightClass: string;
  bodyweight: number | null;
  squat1: number | null;
  squat2: number | null;
  squat3: number | null;
  bestSquat: number | null;
  bench1: number | null;
  bench2: number | null;
  bench3: number | null;
  bestBench: number | null;
  deadlift1: number | null;
  deadlift2: number | null;
  deadlift3: number | null;
  bestDeadlift: number | null;
  total: number | null;
  dots: number | null;
};

export type MeetResults = {
  federation: string;
  meetId: string;
  date: string;
  location: string;
  meetName: string;
  rows: MeetResultRow[];
};

export type RankingsQuery = {
  fed?: string;
  class?: string;
  sex?: string;
  ageclass?: string;
  year?: string;
  equipment?: string;
  sort?: string;
  page?: number;
};

export type RankingsResponse = {
  lifters: Lifter[];
  page: number;
  hasNextPage: boolean;
};

type ApiRankingsResponse = {
  total_length: number;
  rows: unknown[];
};

type ApiSearchRankingsResponse = {
  next_index?: unknown;
};

const BASE_URL = 'https://www.openpowerlifting.org/api/rankings';
const SEARCH_BASE_URL = 'https://www.openpowerlifting.org/api/search/rankings';
const ATHLETE_CSV_URL = 'https://www.openpowerlifting.org/api/liftercsv';
const ATHLETE_PAGE_URL = 'https://www.openpowerlifting.org/u';
const MEET_CSV_URL = 'https://www.openpowerlifting.org/api/meetcsv';
const MEET_PAGE_URL = 'https://www.openpowerlifting.org/m';
const PAGE_SIZE = 50;
const DEFAULT_WEB_CORS_PROXY = 'https://api.allorigins.win/raw?url=';

const NETWORK_ERROR_PATTERNS = [
  /network request failed/i,
  /failed to fetch/i,
  /load failed/i,
  /internet/i,
  /offline/i,
  /timed out/i,
  /timeout/i,
  /networkerror/i,
];

type RankingsWindow = {
  start: number;
  end: number;
};

export async function fetchRankings(query: RankingsQuery): Promise<RankingsResponse> {
  const page = query.page ?? 1;
  const start = Math.max(0, (page - 1) * PAGE_SIZE);
  const end = start + PAGE_SIZE - 1;

  return fetchRankingsWindow({ start, end }, page, query);
}

export async function fetchRankingsWindow(
  window: RankingsWindow,
  page = Math.floor(window.start / PAGE_SIZE) + 1,
  query?: RankingsQuery
): Promise<RankingsResponse> {
  const url = buildRankingsUrl(window.start, window.end, query);

  const response = await fetchOpenPowerlifting(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch rankings (${response.status})`);
  }

  const payload = (await response.json()) as ApiRankingsResponse;
  const rows = Array.isArray(payload.rows) ? payload.rows : [];
  const lifters = rows
    .map((row) => parseApiRow(row, query?.sort))
    .filter((row): row is Lifter => row !== null);

  const totalLength = Number(payload.total_length) || 0;
  const hasNextPage = window.end + 1 < totalLength;

  return {
    lifters,
    page,
    hasNextPage,
  };
}

export async function searchRankingIndex(query: string, start = 0): Promise<number | null> {
  const url = new URL(SEARCH_BASE_URL);
  url.searchParams.set('q', query);
  url.searchParams.set('start', String(start));

  const response = await fetchOpenPowerlifting(url.toString(), {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to search rankings (${response.status})`);
  }

  const payload = (await response.json()) as ApiSearchRankingsResponse;
  const nextIndex = toNumber(payload.next_index);

  return nextIndex ?? null;
}

export function buildRankingsUrl(start: number, end: number, query?: RankingsQuery): URL {
  const pathSegments: string[] = [];

  if (query?.fed) {
    pathSegments.push(query.fed);
  }

  if (query?.equipment) {
    pathSegments.push(query.equipment);
  }

  if (query?.class) {
    pathSegments.push(query.class);
  }

  if (query?.sex) {
    pathSegments.push(query.sex);
  }

  if (query?.sort) {
    pathSegments.push(query.sort);
  }

  const url = new URL(pathSegments.length > 0 ? `${BASE_URL}/${pathSegments.map(encodeURIComponent).join('/')}` : BASE_URL);
  url.searchParams.set('start', String(start));
  url.searchParams.set('end', String(end));
  url.searchParams.set('lang', 'en');
  url.searchParams.set('units', 'kg');

  if (query?.ageclass) {
    url.searchParams.set('ageclass', query.ageclass);
  }
  if (query?.year) {
    url.searchParams.set('year', query.year);
  }

  return url;
}

export function buildLifterSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export async function fetchAthleteProfile(slug: string): Promise<AthleteProfile> {
  const response = await fetchOpenPowerlifting(`${ATHLETE_CSV_URL}/${encodeURIComponent(slug)}`, {
    headers: {
      Accept: 'text/csv, text/plain, */*',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch athlete profile (${response.status})`);
  }

  const [csvText, meetPathMap] = await Promise.all([response.text(), fetchAthleteMeetPathMap(slug)]);
  const parsed = parseCsv(csvText);

  if (parsed.length < 2) {
    throw new Error('Athlete profile is empty');
  }

  const [headerRow, ...dataRows] = parsed;
  const headers = headerRow.map((header) => header.replace(/^\uFEFF/, ''));
  const results = dataRows
    .map((row) => parseAthleteRow(headers, row))
    .filter((row): row is AthleteCompetitionRow => row !== null)
    .map((row) => attachMeetPath(row, meetPathMap))
    .sort((left, right) => compareDateDescending(left.date, right.date));

  if (results.length === 0) {
    throw new Error('Athlete profile has no valid results');
  }

  return {
    name: results[0].name,
    sex: results[0].sex,
    slug,
    personalBests: groupPersonalBests(results),
    results,
  };
}

export async function fetchMeetResults(federation: string, meetId: string): Promise<MeetResults> {
  const meetPageResponse = await fetchOpenPowerlifting(
    `${MEET_PAGE_URL}/${encodeURIComponent(federation)}/${encodeURIComponent(meetId)}`,
    {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    }
  );

  if (!meetPageResponse.ok) {
    throw new Error(`Failed to find meet (${meetPageResponse.status})`);
  }

  const response = await fetchOpenPowerlifting(
    `${MEET_CSV_URL}/${encodeURIComponent(federation)}/${encodeURIComponent(meetId)}`,
    {
      headers: {
        Accept: 'text/csv, text/plain, */*',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch meet results (${response.status})`);
  }

  const csvText = await response.text();
  const parsed = parseCsv(csvText);

  if (parsed.length < 2) {
    throw new Error('Meet results are empty');
  }

  const [headerRow, ...dataRows] = parsed;
  const headers = headerRow.map((header) => header.replace(/^\uFEFF/, ''));
  const rows = dataRows
    .map((row) => parseMeetRow(headers, row))
    .filter((row): row is MeetResultRow => row !== null)
    .filter((row, index, allRows) => index === allRows.findIndex((candidate) => candidate !== null && isSameMeetRow(candidate, row)))
    .sort((left, right) => compareNullableNumberDescending(left.dots, right.dots));

  if (rows.length === 0) {
    throw new Error('Meet results have no valid rows');
  }

  const metadata = headers.reduce<Record<string, string>>((accumulator, header, index) => {
    accumulator[header] = dataRows[0]?.[index] ?? '';
    return accumulator;
  }, {});

  return {
    federation,
    meetId,
    date: metadata.Date || '',
    location: [metadata.MeetCountry, metadata.MeetState, metadata.MeetTown].filter(Boolean).join(', '),
    meetName: metadata.MeetName || `${federation.toUpperCase()} ${meetId}`,
    rows,
  };
}

async function fetchOpenPowerlifting(url: string, init?: RequestInit): Promise<Response> {
  if (Platform.OS !== 'web') {
    return fetch(url, init);
  }

  try {
    return await fetch(url, init);
  } catch {
    // Browser requests are blocked by CORS on direct OPL endpoints.
    return fetch(buildWebProxyUrl(url), init);
  }
}

export function isNetworkError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (error instanceof TypeError) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  return NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function buildWebProxyUrl(url: string): string {
  const configuredProxy = process.env.EXPO_PUBLIC_OPL_CORS_PROXY?.trim();

  if (!configuredProxy) {
    return `${DEFAULT_WEB_CORS_PROXY}${encodeURIComponent(url)}`;
  }

  if (configuredProxy.includes('{url}')) {
    return configuredProxy.replace('{url}', encodeURIComponent(url));
  }

  const separator = configuredProxy.includes('?') ? '&' : '?';
  return `${configuredProxy}${separator}url=${encodeURIComponent(url)}`;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let index = 0;
  let insideQuotes = false;

  while (index < text.length) {
    const character = text[index];

    if (insideQuotes) {
      if (character === '"') {
        if (text[index + 1] === '"') {
          currentValue += '"';
          index += 2;
          continue;
        }

        insideQuotes = false;
        index += 1;
        continue;
      }

      currentValue += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      insideQuotes = true;
      index += 1;
      continue;
    }

    if (character === ',') {
      currentRow.push(currentValue);
      currentValue = '';
      index += 1;
      continue;
    }

    if (character === '\n') {
      currentRow.push(currentValue);
      rows.push(currentRow);
      currentRow = [];
      currentValue = '';
      index += 1;
      continue;
    }

    if (character === '\r') {
      index += 1;
      continue;
    }

    currentValue += character;
    index += 1;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((value) => value.trim().length > 0));
}

function parseAthleteRow(headers: string[], row: string[]): AthleteCompetitionRow | null {
  const values = headers.reduce<Record<string, string>>((accumulator, header, index) => {
    accumulator[header] = row[index] ?? '';
    return accumulator;
  }, {});

  const name = values.Name || '';
  if (!name) {
    return null;
  }

  return {
    name,
    sex: values.Sex || '',
    place: values.Place || '',
    federation: values.Federation || '',
    date: values.Date || '',
    location: [values.MeetCountry, values.MeetState].filter(Boolean).join('-') || values.MeetCountry || '',
    competition: values.MeetName || '',
    division: values.Division || '',
    age: values.Age || '',
    equipment: values.Equipment || '',
    weightClass: values.WeightClassKg || '',
    bodyweight: parseNullableNumber(values.BodyweightKg),
    squat1: parseNullableNumber(values.Squat1Kg),
    squat2: parseNullableNumber(values.Squat2Kg),
    squat3: parseNullableNumber(values.Squat3Kg),
    squat4: parseNullableNumber(values.Squat4Kg),
    bestSquat: parseNullableNumber(values.Best3SquatKg),
    bench1: parseNullableNumber(values.Bench1Kg),
    bench2: parseNullableNumber(values.Bench2Kg),
    bench3: parseNullableNumber(values.Bench3Kg),
    bench4: parseNullableNumber(values.Bench4Kg),
    bestBench: parseNullableNumber(values.Best3BenchKg),
    deadlift1: parseNullableNumber(values.Deadlift1Kg),
    deadlift2: parseNullableNumber(values.Deadlift2Kg),
    deadlift3: parseNullableNumber(values.Deadlift3Kg),
    deadlift4: parseNullableNumber(values.Deadlift4Kg),
    bestDeadlift: parseNullableNumber(values.Best3DeadliftKg),
    total: parseNullableNumber(values.TotalKg),
    dots: parseNullableNumber(values.Dots),
    wilks: parseNullableNumber(values.Wilks),
    glossbrenner: parseNullableNumber(values.Glossbrenner),
    goodlift: parseNullableNumber(values.Goodlift),
    tested: values.Tested || '',
    country: values.Country || '',
    state: values.State || '',
    parentFederation: values.ParentFederation || '',
    meetCountry: values.MeetCountry || '',
    meetState: values.MeetState || '',
    meetTown: values.MeetTown || '',
    meetName: values.MeetName || '',
    sanctioned: values.Sanctioned || '',
    meetPath: null,
    meetFederation: null,
    meetId: null,
  };
}

function parseMeetRow(headers: string[], row: string[]): MeetResultRow | null {
  const values = headers.reduce<Record<string, string>>((accumulator, header, index) => {
    accumulator[header] = row[index] ?? '';
    return accumulator;
  }, {});

  const name = values.Name || '';
  if (!name) {
    return null;
  }

  return {
    place: values.Place || '',
    name,
    sex: values.Sex || '',
    age: values.Age || '',
    equipment: values.Equipment || '',
    weightClass: values.WeightClassKg || '',
    bodyweight: parseNullableNumber(values.BodyweightKg),
    squat1: parseNullableNumber(values.Squat1Kg),
    squat2: parseNullableNumber(values.Squat2Kg),
    squat3: parseNullableNumber(values.Squat3Kg),
    bestSquat: parseNullableNumber(values.Best3SquatKg),
    bench1: parseNullableNumber(values.Bench1Kg),
    bench2: parseNullableNumber(values.Bench2Kg),
    bench3: parseNullableNumber(values.Bench3Kg),
    bestBench: parseNullableNumber(values.Best3BenchKg),
    deadlift1: parseNullableNumber(values.Deadlift1Kg),
    deadlift2: parseNullableNumber(values.Deadlift2Kg),
    deadlift3: parseNullableNumber(values.Deadlift3Kg),
    bestDeadlift: parseNullableNumber(values.Best3DeadliftKg),
    total: parseNullableNumber(values.TotalKg),
    dots: parseNullableNumber(values.Dots),
  };
}

function attachMeetPath(row: AthleteCompetitionRow, meetPathMap: Map<string, string[]>): AthleteCompetitionRow {
  const key = buildMeetLookupKey(row.date, row.federation, row.competition);
  const queue = meetPathMap.get(key);
  const meetPath = queue && queue.length > 0 ? queue.shift() ?? null : null;
  const parsedPath = parseMeetPath(meetPath);

  return {
    ...row,
    meetPath,
    meetFederation: parsedPath?.federation ?? null,
    meetId: parsedPath?.meetId ?? null,
  };
}

async function fetchAthleteMeetPathMap(slug: string): Promise<Map<string, string[]>> {
  try {
    const response = await fetchOpenPowerlifting(`${ATHLETE_PAGE_URL}/${encodeURIComponent(slug)}`, {
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!response.ok) {
      return new Map();
    }

    const html = await response.text();
    return parseAthleteMeetPathMapFromHtml(html);
  } catch {
    return new Map();
  }
}

function parseAthleteMeetPathMapFromHtml(html: string): Map<string, string[]> {
  const result = new Map<string, string[]>();
  const rowPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rowMatch: RegExpExecArray | null;

  while ((rowMatch = rowPattern.exec(html)) !== null) {
    const rowHtml = rowMatch[1];
    const cells = extractTableCells(rowHtml);
    if (cells.length < 5) {
      continue;
    }

    const meetPathMatch = rowHtml.match(/href="\/(m\/[^"#?]+)(?:#[^"]*)?"/i);
    if (!meetPathMatch) {
      continue;
    }

    const federation = decodeHtmlEntities(stripHtml(cells[1]));
    const date = decodeHtmlEntities(stripHtml(cells[2]));
    const competition = decodeHtmlEntities(stripHtml(cells[4]));
    if (!federation || !date || !competition) {
      continue;
    }

    const meetPath = `/${meetPathMatch[1]}`;
    const key = buildMeetLookupKey(date, federation, competition);
    const existing = result.get(key);

    if (existing) {
      existing.push(meetPath);
    } else {
      result.set(key, [meetPath]);
    }
  }

  return result;
}

function extractTableCells(rowHtml: string): string[] {
  const cells: string[] = [];
  const cellPattern = /<td[^>]*>([\s\S]*?)<\/td>/gi;
  let cellMatch: RegExpExecArray | null;

  while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
    cells.push(cellMatch[1]);
  }

  return cells;
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&#x([\da-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function buildMeetLookupKey(date: string, federation: string, competition: string): string {
  return [date, federation, competition].map((value) => value.trim().toLowerCase()).join('|');
}

function parseMeetPath(meetPath: string | null): { federation: string; meetId: string } | null {
  if (!meetPath) {
    return null;
  }

  const match = meetPath.match(/^\/m\/([^\/]+)\/([^\/?#]+)/i);
  if (!match) {
    return null;
  }

  return {
    federation: match[1],
    meetId: match[2],
  };
}

function groupPersonalBests(rows: AthleteCompetitionRow[]): AthletePersonalBest[] {
  const byEquipment = new Map<string, AthletePersonalBest>();

  for (const row of rows) {
    if (row.place.toUpperCase() === 'DQ') {
      continue;
    }

    const existing = byEquipment.get(row.equipment);
    byEquipment.set(row.equipment, {
      equipment: row.equipment,
      squat: maxNullable(existing?.squat, row.bestSquat),
      bench: maxNullable(existing?.bench, row.bestBench),
      deadlift: maxNullable(existing?.deadlift, row.bestDeadlift),
      total: maxNullable(existing?.total, row.total),
      dots: maxNullable(existing?.dots, row.dots),
    });
  }

  return Array.from(byEquipment.values()).sort((left, right) => left.equipment.localeCompare(right.equipment));
}

function compareDateDescending(left: string, right: string): number {
  return new Date(right).getTime() - new Date(left).getTime();
}

function parseNullableNumber(value: string): number | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const numeric = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(numeric) ? numeric : null;
}

function maxNullable(left: number | null | undefined, right: number | null): number | null {
  if (left === null || left === undefined) {
    return right;
  }

  if (right === null) {
    return left;
  }

  return Math.max(left, right);
}

function compareNullableNumberDescending(left: number | null, right: number | null): number {
  if (left === null && right === null) {
    return 0;
  }

  if (left === null) {
    return 1;
  }

  if (right === null) {
    return -1;
  }

  return right - left;
}

function isSameMeetRow(left: MeetResultRow, right: MeetResultRow): boolean {
  return (
    left.place === right.place &&
    left.name === right.name &&
    left.sex === right.sex &&
    left.age === right.age &&
    left.equipment === right.equipment &&
    left.weightClass === right.weightClass &&
    left.bodyweight === right.bodyweight &&
    left.squat1 === right.squat1 &&
    left.squat2 === right.squat2 &&
    left.squat3 === right.squat3 &&
    left.bestSquat === right.bestSquat &&
    left.bench1 === right.bench1 &&
    left.bench2 === right.bench2 &&
    left.bench3 === right.bench3 &&
    left.bestBench === right.bestBench &&
    left.deadlift1 === right.deadlift1 &&
    left.deadlift2 === right.deadlift2 &&
    left.deadlift3 === right.deadlift3 &&
    left.bestDeadlift === right.bestDeadlift &&
    left.total === right.total &&
    left.dots === right.dots
  );
}

function parseApiRow(row: unknown, sort?: string): Lifter | null {
  if (!Array.isArray(row) || row.length < 24) {
    return null;
  }

  const place = toNumber(row[1]);
  const name = toStringValue(row[2]);
  const federation = toStringValue(row[8]);
  const date = toStringValue(row[9]);
  const locationLeft = toStringValue(row[10]);
  const locationRight = toStringValue(row[11]);
  const sex = toStringValue(row[13]);
  const equipment = toStringValue(row[14]);
  const age = toNumber(row[15]);
  const bodyweight = toNumber(row[17]);
  const weightClass = toStringValue(row[18]);
  const squat = toNumber(row[19]);
  const bench = toNumber(row[20]);
  const deadlift = toNumber(row[21]);
  const total = toNumber(row[22]);
  const points = toNumber(row[23]);
  const selectedSort = normalizeSortValue(sort);

  return {
    rank: place ?? 0,
    name,
    federation,
    date,
    location: [locationLeft, locationRight].filter(Boolean).join('-'),
    sex,
    age,
    equipment,
    weightClass,
    bodyweight,
    squat,
    bench,
    deadlift,
    total,
    dots: points,
    wilks: selectedSort === 'by-wilks' ? points : null,
  };
}

function normalizeSortValue(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  return value.toLowerCase();
}

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const cleaned = String(value).replace(/,/g, '').trim();
  if (!cleaned || cleaned === '-' || cleaned.toLowerCase() === 'n/a') {
    return null;
  }

  const numeric = Number(cleaned);
  return Number.isFinite(numeric) ? numeric : null;
}

function toStringValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  return String(value).trim();
}
