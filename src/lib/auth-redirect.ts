import { homeForRole, isRole } from "./roles";

/** Accept only local paths, including after URL normalization. */
export function safeAuthCallback(value?: string | null): string | null {
  if (!value?.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020\u007f]/.test(value)) {
    return null;
  }

  const base = "https://servis.invalid";
  try {
    const url = new URL(value, base);
    if (url.origin !== base || url.pathname.startsWith("//")) return null;
    return url.pathname + url.search + url.hash;
  } catch {
    return null;
  }
}

export function authRedirectFor(role: unknown, callbackUrl?: string | null): string {
  const callback = safeAuthCallback(callbackUrl);
  const path = callback?.split(/[?#]/)[0].replace(/\/+$/, "");
  const authDestination =
    path === "/login" || path === "/registracija" || path === "/prijava/povratak";
  return (!authDestination && callback) || (isRole(role) ? homeForRole(role) : "/");
}
