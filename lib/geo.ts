let _country: string | null = null

export async function detectCountry(): Promise<string> {
  if (_country) return _country
  try {
    const r = await fetch('https://api.country.is/', {
      signal: AbortSignal.timeout(2500),
    })
    const d = (await r.json()) as { country?: string }
    _country = d.country ?? 'IN'
  } catch {
    _country = 'IN'
  }
  return _country
}
