/** True only for absolute http(s) URLs. Rejects javascript:, data:, vbscript:, file:, etc. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * A value that is safe to place in an <a href>: an in-page anchor (#contact), a site-relative path
 * (/privacy-policy, but not protocol-relative //host), an absolute http(s) URL, mailto: or tel:.
 * Anything else — notably `javascript:` — is rejected.
 */
export function isSafeLink(value: string): boolean {
  const v = value.trim();
  if (v.startsWith('#')) return true;
  if (v.startsWith('/') && !v.startsWith('//')) return true;
  if (/^(mailto|tel):/i.test(v)) return true;
  return isSafeHttpUrl(v);
}
