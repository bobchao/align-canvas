/** 網址列 query key：指向遠端 align-canvas JSON 檔的 URL。 */
export const URL_IMPORT_PARAM = 'import' as const;

const SAFE_PROTOCOLS = new Set(['http:', 'https:']);

export function getUrlImportParam(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get(URL_IMPORT_PARAM);
  if (raw == null || raw === '') return null;
  return raw.trim() || null;
}

export function removeUrlImportParamFromAddressBar(): void {
  if (typeof window === 'undefined') return;
  const u = new URL(window.location.href);
  u.searchParams.delete(URL_IMPORT_PARAM);
  const next = u.pathname + u.search + u.hash;
  window.history.replaceState(window.history.state, '', next);
}

/** 僅允許 http(s)，避免 javascript: 等。 */
export function isSafeRemoteUrlForFetch(url: string): boolean {
  try {
    const u = new URL(url);
    return SAFE_PROTOCOLS.has(u.protocol);
  } catch {
    return false;
  }
}

export async function fetchTextFromRemoteUrl(url: string): Promise<string> {
  const res = await fetch(url, { credentials: 'omit' });
  if (!res.ok) {
    throw new Error(`下載失敗 (HTTP ${res.status})`);
  }
  return res.text();
}

export function hasPersistedGraphData(payload: { kpis: unknown[]; relations: unknown[] }): boolean {
  return payload.kpis.length > 0 || payload.relations.length > 0;
}
