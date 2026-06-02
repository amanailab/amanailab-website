// Shared grading helpers for the in-browser code judge.
//
// Problems are graded in the browser (Pyodide) for instant, free feedback — but
// that means the client must receive the test cases. We must NOT ship hidden
// tests' expected outputs (that reveals the answers and lets users hardcode
// them). So for hidden tests we send only a SHA-256 hash of the normalized
// expected output; the client hashes its own normalized stdout and compares.
// Visible tests keep plaintext so the UI can show expected-vs-actual.
//
// Uses Web Crypto (`crypto.subtle`) so the SAME hashing runs on the server
// (sanitizing) and in the browser (grading), guaranteeing parity.

export function normaliseOutput(s: string): string {
  return (s ?? '').trim().replace(/\s+/g, ' ')
}

export async function hashOutput(s: string): Promise<string> {
  const data = new TextEncoder().encode(normaliseOutput(s))
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export interface RawTestCase {
  id: number
  function_call: string
  expected_output: string
  is_hidden: boolean
  description: string
}

export interface ClientTestCase {
  id: number
  function_call: string
  is_hidden: boolean
  description: string
  expected_output?: string // present only for visible tests
  expected_hash?: string   // present only for hidden tests
}

/**
 * Strip hidden tests' plaintext answers before sending to the browser,
 * replacing each with a hash the client can still verify its output against.
 */
export async function sanitizeTestCasesForClient(
  testCases: RawTestCase[] | null | undefined,
): Promise<ClientTestCase[]> {
  return Promise.all(
    (testCases ?? []).map(async (tc): Promise<ClientTestCase> => {
      if (tc.is_hidden) {
        return {
          id: tc.id,
          function_call: tc.function_call,
          is_hidden: true,
          description: tc.description,
          expected_hash: await hashOutput(tc.expected_output),
        }
      }
      return {
        id: tc.id,
        function_call: tc.function_call,
        is_hidden: false,
        description: tc.description,
        expected_output: tc.expected_output,
      }
    }),
  )
}
