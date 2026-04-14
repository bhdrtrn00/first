/**
 * freightosClient.ts
 * Freightos Freight Rate Estimator API  — v3.0.0
 * POST https://api.freightos.com/api/v1/freightEstimates
 *
 * Note: results are indicative/estimate only (per Freightos T&C).
 */

// ─── API types ────────────────────────────────────────────────────────────────

type FreightosUnitType =
  | 'container20'
  | 'container40'
  | 'container40HC'
  | 'container45HC'
  | 'pallets'
  | 'boxes';

interface FreightosLoad {
  quantity: number;
  unitType: FreightosUnitType;
  unitWeightKg?: number;
  unitVolumeCBM?: number;
}

interface FreightosLocation {
  unLocationCode?: string;
  airportCode?: string;
}

interface FreightosRequest {
  load: [FreightosLoad];
  legs: [{ origin: FreightosLocation; destination: FreightosLocation }];
}

interface FreightosEstimate {
  priceEstimates?: { min: number; max: number };
  transitTime?: { min: number; max: number };
}

export interface FreightosResponse {
  OCEAN?: FreightosEstimate;
  AIR?: FreightosEstimate;
  _source: 'live' | 'sandbox';
}

// ─── UN/LOCODE lookup ─────────────────────────────────────────────────────────
// Maps common city/port names (lowercase, normalised) to UN/LOCODE

const UNLOCODE: Record<string, string> = {
  // Asia
  shanghai: 'CNSHA',
  shenzhen: 'CNSZX',
  guangzhou: 'CNGUA',
  ningbo: 'CNNGB',
  qingdao: 'CNTAO',
  tianjin: 'CNTJN',
  xiamen: 'CNXMN',
  dalian: 'CNDLC',
  'hong kong': 'HKHKG',
  'hongkong': 'HKHKG',
  hkg: 'HKHKG',
  singapore: 'SGSIN',
  busan: 'KRPUS',
  tokyo: 'JPTYO',
  yokohama: 'JPYOK',
  nagoya: 'JPNGO',
  osaka: 'JPOSA',
  kaohsiung: 'TWKHH',
  taipei: 'TWTPE',
  jakarta: 'IDJKT',
  surabaya: 'IDSUB',
  bangkok: 'THBKK',
  'laem chabang': 'THLCH',
  manila: 'PHMNL',
  'ho chi minh': 'VNSGN',
  'ho chi minh city': 'VNSGN',
  mumbai: 'INBOM',
  nhava: 'INNSA',
  'nhava sheva': 'INNSA',
  chennai: 'INMAA',
  colombo: 'LKCMB',
  karachi: 'PKKHI',
  dubai: 'AEDXB',
  'jebel ali': 'AEJEA',
  dammam: 'SADMM',

  // Turkey
  istanbul: 'TRIST',
  'ambarli': 'TRIST',
  mersin: 'TRMER',
  izmir: 'TRIZM',

  // Europe
  rotterdam: 'NLRTM',
  antwerp: 'BEANR',
  hamburg: 'DEHAM',
  bremen: 'DEBRE',
  bremerhaven: 'DEBRV',
  felixstowe: 'GBFXT',
  southampton: 'GBSOU',
  london: 'GBLON',
  le: 'FRLEH',
  'le havre': 'FRLEH',
  marseille: 'FRMRS',
  barcelona: 'ESBCN',
  valencia: 'ESVLC',
  algeciras: 'ESALG',
  genova: 'ITGOA',
  genoa: 'ITGOA',
  la: 'ITLSP',
  'la spezia': 'ITLSP',
  gioia: 'ITGIT',
  'gioia tauro': 'ITGIT',
  piraeus: 'GRPIR',
  athens: 'GRPIR',
  gdansk: 'PLGDN',
  stockholm: 'SESTO',
  gothenburg: 'SEGOT',
  copenhagen: 'DKCPH',
  oslo: 'NOOSL',
  helsinki: 'FIHEL',

  // Americas
  'los angeles': 'USLAX',
  'long beach': 'USLGB',
  'new york': 'USNYC',
  newark: 'USNWK',
  savannah: 'USSAV',
  houston: 'USHOU',
  miami: 'USMIA',
  seattle: 'USSEA',
  vancouver: 'CAVAN',
  toronto: 'CATOR',
  montreal: 'CAMTR',
  santos: 'BRSSZ',
  'sao paulo': 'BRSSZ',
  'são paulo': 'BRSSZ',
  'rio de janeiro': 'BRRIO',
  buenos: 'ARBUE',
  'buenos aires': 'ARBUE',
  manzanillo: 'MXMZN',
  'mexico city': 'MXMEX',
  veracruz: 'MXVER',
  callao: 'PECLL',
  lima: 'PECLL',

  // Africa / Middle East
  lagos: 'NGLOS',
  'cape town': 'ZACPT',
  durban: 'ZADUR',
  'port said': 'EGPSD',
  alexandria: 'EGALY',
  mombasa: 'KEMBA',
  dar: 'TZDAR',
  'dar es salaam': 'TZDAR',
  casablanca: 'MACAS',
};

// Airport code → IATA (already in correct format for air freight)
const AIRPORT_CODES: Record<string, string> = {
  shanghai: 'PVG', pvg: 'PVG', sha: 'SHA',
  beijing: 'PEK', pek: 'PEK',
  guangzhou: 'CAN', can: 'CAN',
  'hong kong': 'HKG', hkg: 'HKG',
  singapore: 'SIN', sin: 'SIN',
  tokyo: 'NRT', nrt: 'NRT', hnd: 'HND',
  dubai: 'DXB', dxb: 'DXB',
  istanbul: 'IST', ist: 'IST',
  frankfurt: 'FRA', fra: 'FRA',
  amsterdam: 'AMS', ams: 'AMS',
  london: 'LHR', lhr: 'LHR',
  paris: 'CDG', cdg: 'CDG',
  'los angeles': 'LAX', lax: 'LAX',
  'new york': 'JFK', jfk: 'JFK',
  chicago: 'ORD', ord: 'ORD',
  miami: 'MIA', mia: 'MIA',
  houston: 'IAH', iah: 'IAH',
};

// ─── Container type mapping ───────────────────────────────────────────────────

const CONTAINER_TYPE_MAP: Record<string, FreightosUnitType> = {
  '20gp': 'container20',
  '20': 'container20',
  '40gp': 'container40',
  '40': 'container40',
  '40hc': 'container40HC',
  '40hq': 'container40HC',
  '45hc': 'container45HC',
  '45': 'container45HC',
};

// ─── Location resolvers ───────────────────────────────────────────────────────

export function resolveUnlocode(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  // Direct UNLOCODE format (5 chars: 2 country + 3 loc)
  if (/^[A-Z]{2}[A-Z0-9]{3}$/.test(name.toUpperCase())) return name.toUpperCase();
  return UNLOCODE[key];
}

export function resolveAirportCode(name: string): string | undefined {
  const key = name.trim().toLowerCase();
  if (/^[A-Z]{3}$/.test(name.toUpperCase())) return name.toUpperCase();
  return AIRPORT_CODES[key];
}

export function resolveContainerType(input: string): FreightosUnitType {
  const key = input.trim().toLowerCase().replace(/[\s_-]/g, '');
  return CONTAINER_TYPE_MAP[key] ?? 'container40HC';
}

// ─── Main API client ──────────────────────────────────────────────────────────

const LIVE_URL    = 'https://api.freightos.com/api/v1/freightEstimates';
const SANDBOX_URL = 'https://sandbox.freightos.com/api/v1/freightEstimates';

export interface FreightRateQuery {
  originName: string;
  destinationName: string;
  quantity: number;
  containerType?: string;   // for ocean
  weightKg?: number;        // for air / LCL
  volumeCBM?: number;
  mode?: 'ocean' | 'air' | 'both';
  useSandbox?: boolean;
}

export async function getFreightEstimate(
  apiKey: string,
  query: FreightRateQuery,
): Promise<FreightosResponse> {
  const useSandbox = query.useSandbox ?? false;
  const url = useSandbox ? SANDBOX_URL : LIVE_URL;

  // Resolve locations
  const isAir = query.mode === 'air';
  let originLoc: FreightosLocation;
  let destLoc: FreightosLocation;

  if (isAir) {
    const o = resolveAirportCode(query.originName);
    const d = resolveAirportCode(query.destinationName);
    if (!o) throw new Error(`Unknown airport code for origin: "${query.originName}"`);
    if (!d) throw new Error(`Unknown airport code for destination: "${query.destinationName}"`);
    originLoc = { airportCode: o };
    destLoc   = { airportCode: d };
  } else {
    const o = resolveUnlocode(query.originName);
    const d = resolveUnlocode(query.destinationName);
    if (!o) throw new Error(`Unknown UN/LOCODE for origin: "${query.originName}". Try a major port name or 5-char UNLOCODE.`);
    if (!d) throw new Error(`Unknown UN/LOCODE for destination: "${query.destinationName}". Try a major port name or 5-char UNLOCODE.`);
    originLoc = { unLocationCode: o };
    destLoc   = { unLocationCode: d };
  }

  // Build load
  const unitType = isAir ? 'boxes' : resolveContainerType(query.containerType ?? '40HC');
  const load: FreightosLoad = { quantity: query.quantity, unitType };
  if (query.weightKg  !== undefined) load.unitWeightKg  = query.weightKg;
  if (query.volumeCBM !== undefined) load.unitVolumeCBM = query.volumeCBM;

  const body: FreightosRequest = {
    load: [load],
    legs: [{ origin: originLoc, destination: destLoc }],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-apikey': apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Freightos API error ${res.status}: ${text || res.statusText}`);
  }

  const data = await res.json() as { OCEAN?: FreightosEstimate; AIR?: FreightosEstimate };
  return { ...data, _source: useSandbox ? 'sandbox' : 'live' };
}

// ─── Formatted result builder ─────────────────────────────────────────────────

export interface FormattedRateResult {
  origin: string;
  destination: string;
  mode: string;
  quantity: number;
  unitType: string;
  priceMin: number | null;
  priceMax: number | null;
  currency: 'USD';
  transitDaysMin: number | null;
  transitDaysMax: number | null;
  source: 'live' | 'sandbox';
  disclaimer: string;
  raw: FreightosResponse;
}

export function formatEstimate(
  query: FreightRateQuery,
  resp: FreightosResponse,
  modeKey: 'OCEAN' | 'AIR',
): FormattedRateResult {
  const est = resp[modeKey];
  const unitType = modeKey === 'AIR' ? 'boxes' : resolveContainerType(query.containerType ?? '40HC');

  return {
    origin:          query.originName,
    destination:     query.destinationName,
    mode:            modeKey,
    quantity:        query.quantity,
    unitType,
    priceMin:        est?.priceEstimates?.min ?? null,
    priceMax:        est?.priceEstimates?.max ?? null,
    currency:        'USD',
    transitDaysMin:  est?.transitTime?.min ?? null,
    transitDaysMax:  est?.transitTime?.max ?? null,
    source:          resp._source,
    disclaimer:      'Indicative estimate only — not a booking quote. Source: Freightos Rate Estimator API.',
    raw:             resp,
  };
}
