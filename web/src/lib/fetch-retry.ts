export type FetchRetryOptions = {
  /** Max attempts including the first try (default 4). */
  retries?: number;
  /** Initial backoff in ms (default 400). */
  baseDelayMs?: number;
  /** Only retry these status codes (default 408, 429, 502, 503, 504). */
  retryOn?: number[];
};

const DEFAULT_RETRY_ON = new Set([408, 429, 502, 503, 504]);

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * fetch with exponential backoff on transient failures and network errors.
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  options: FetchRetryOptions = {},
): Promise<Response> {
  const retries = options.retries ?? 4;
  const baseDelayMs = options.baseDelayMs ?? 400;
  const retryOn = options.retryOn
    ? new Set(options.retryOn)
    : DEFAULT_RETRY_ON;

  let lastError: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(input, init);
      if (res.ok) return res;
      if (!retryOn.has(res.status) || attempt === retries - 1) return res;
      await sleep(baseDelayMs * 2 ** attempt);
    } catch (e) {
      lastError = e;
      if (attempt === retries - 1) throw e;
      await sleep(baseDelayMs * 2 ** attempt);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("fetchWithRetry: exhausted retries");
}
