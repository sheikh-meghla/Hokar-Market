/**
 * Accepts only same-site paths (e.g. "/checkout?x=1"). Anything else, such as
 * "https://evil.example", "//evil.example", "/\evil.example" or control
 * characters, falls back to the home page. Auth pages are refused to avoid loops.
 */
function hasUnsafeChar(value: string) {
  for (const ch of value) {
    const code = ch.charCodeAt(0);
    if (code < 32 || code === 127 || ch === "\\") return true;
  }
  return false;
}

export function safeReturnTo(value: unknown, fallback = "/"): string {
  if (typeof value !== "string" || value.length > 500) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || hasUnsafeChar(value)) {
    return fallback;
  }
  try {
    const url = new URL(value, "http://same-site.invalid");
    if (url.origin !== "http://same-site.invalid") return fallback;
    if (/^\/(login|signup|admin\/login)(\/|$)/.test(url.pathname)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}
