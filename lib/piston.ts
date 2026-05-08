export const PISTON_URL = 'https://emkc.org/api/v2/piston'

export interface PistonResult {
  stdout: string
  stderr: string
  code: number
  timedOut: boolean
}

// Wraps user code with a safe test runner that formats output consistently
export function buildTestCode(userCode: string, functionCall: string): string {
  return `
import math, sys, json

${userCode}

def _fmt(v, d=5):
    if isinstance(v, float): return round(v, d)
    if isinstance(v, list):  return [_fmt(x, d) for x in v]
    if isinstance(v, tuple): return [_fmt(x, d) for x in v]
    return v

try:
    _r = ${functionCall}
    print(_fmt(_r))
except Exception as _e:
    print(str(_e), file=sys.stderr)
    sys.exit(1)
`.trim()
}

export async function runCode(code: string, timeoutMs = 5000): Promise<PistonResult> {
  const res = await fetch(`${PISTON_URL}/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      language: 'python',
      version: '3.10.0',
      files: [{ content: code }],
      stdin: '',
      args: [],
      run_timeout: timeoutMs,
    }),
  })

  if (!res.ok) throw new Error(`Piston API error: ${res.status}`)

  const data = await res.json()
  const run  = data.run ?? {}

  return {
    stdout:   (run.stdout ?? '').trim(),
    stderr:   (run.stderr ?? '').trim(),
    code:     run.code ?? 0,
    timedOut: run.signal === 'SIGKILL',
  }
}

export function normalizeOutput(raw: string): string {
  return raw.trim().replace(/\s+/g, ' ')
}

export function outputsMatch(actual: string, expected: string): boolean {
  return normalizeOutput(actual) === normalizeOutput(expected)
}
