/**
 * Escapes text for safe interpolation into HTML (element content AND quoted attribute values).
 * Used by the email templates: contact-form fields come from an unauthenticated public form, so
 * they must never be dropped into the HTML of an email as-is.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
