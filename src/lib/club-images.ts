// Club photo upload (issue #11). The browser uploads straight to Cloudinary with a
// short-lived signature from the server, so files never pass through our server.

export const MAX_CLUB_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** Cloudinary rejects other formats, so the rule also holds if the browser check is skipped. */
export const ALLOWED_FORMATS = "jpg,png,webp";
/** Incoming transformation: large photos are scaled down before they are stored. */
export const UPLOAD_TRANSFORMATION = "c_limit,w_2000,h_2000";

export type CloudinaryConfig = { cloudName: string; apiKey: string; apiSecret: string };

/** Null when Cloudinary isn't configured; the dashboard then hides the upload button. */
export function cloudinaryConfigFromEnv(
  env: Record<string, string | undefined>,
): CloudinaryConfig | null {
  const cloudName = env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = env.CLOUDINARY_API_SECRET?.trim();
  if (!cloudName || !apiKey || !apiSecret) return null;
  return { cloudName, apiKey, apiSecret };
}

/** Every photo of a club lives under its own prefix, which addClubImage checks. */
export function clubImagePrefix(clubId: string): string {
  return `servis/clubs/${clubId}`;
}

/** True only for an HTTPS image on our Cloudinary account, in this club's folder. */
export function isClubImageUrl(value: string, cloudName: string, clubId: string): boolean {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") return false;
  if (url.search || url.hash || url.username || url.password) return false;
  const path = url.pathname;
  if (!path.startsWith(`/${cloudName}/image/upload/`)) return false;
  return path.includes(`/${clubImagePrefix(clubId)}/`);
}

/** Browser-side check before uploading; returns an error message or null. */
export function imageFileError(file: { type: string; size: number }): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Dozvoljeni su samo JPG, PNG i WebP fajlovi.";
  }
  if (file.size > MAX_IMAGE_BYTES) return "Fotografija može imati najviše 5 MB.";
  return null;
}
