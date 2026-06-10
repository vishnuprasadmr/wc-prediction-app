/** FIFA 3-letter country codes → local PNG in public/flags/ */
const TEAM_TO_FIFA_CODE: Record<string, string> = {
  Algeria: 'ALG',
  Argentina: 'ARG',
  Australia: 'AUS',
  Austria: 'AUT',
  Belgium: 'BEL',
  'Bosnia and Herzegovina': 'BIH',
  Brazil: 'BRA',
  Canada: 'CAN',
  'Cape Verde': 'CPV',
  Colombia: 'COL',
  'Congo DR': 'COD',
  Croatia: 'CRO',
  Curaçao: 'CUW',
  Czechia: 'CZE',
  Ecuador: 'ECU',
  Egypt: 'EGY',
  England: 'ENG',
  France: 'FRA',
  Germany: 'GER',
  Ghana: 'GHA',
  Haiti: 'HAI',
  Iran: 'IRN',
  Iraq: 'IRQ',
  'Ivory Coast': 'CIV',
  Japan: 'JPN',
  Jordan: 'JOR',
  Mexico: 'MEX',
  Morocco: 'MAR',
  Netherlands: 'NED',
  'New Zealand': 'NZL',
  Norway: 'NOR',
  Panama: 'PAN',
  Paraguay: 'PAR',
  Portugal: 'POR',
  Qatar: 'QAT',
  'Saudi Arabia': 'KSA',
  Scotland: 'SCO',
  Senegal: 'SEN',
  'South Africa': 'RSA',
  'South Korea': 'KOR',
  Spain: 'ESP',
  Sweden: 'SWE',
  Switzerland: 'SUI',
  Tunisia: 'TUN',
  Türkiye: 'TUR',
  USA: 'USA',
  Uruguay: 'URU',
  Uzbekistan: 'UZB',
}

/** Local copies in public/flags/ — run `node scripts/download-flags.mjs` to refresh */
const FLAG_BASE = '/flags'

export function getFifaCountryCode(teamName: string): string | null {
  return TEAM_TO_FIFA_CODE[teamName] ?? null
}

export function getFlagUrl(teamName: string): string | null {
  const code = getFifaCountryCode(teamName)
  return code ? `${FLAG_BASE}/${code}.png` : null
}

/** @deprecated use getFlagUrl */
export const getFifaFlagUrl = getFlagUrl
