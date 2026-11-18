import { createHash } from "node:crypto";

// Server-only (node:crypto); kept apart from club-images.ts, which the browser also imports.

/**
 * Cloudinary upload signature: SHA-1 of the signed params sorted by name,
 * joined as "a=1&b=2", with the API secret appended.
 */
export function cloudinarySignature(params: Record<string, string>, apiSecret: string): string {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1")
    .update(payload + apiSecret)
    .digest("hex");
}
