"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import {
  ALLOWED_FORMATS,
  cloudinaryConfigFromEnv,
  clubImagePrefix,
  isClubImageUrl,
  MAX_CLUB_IMAGES,
  UPLOAD_TRANSFORMATION,
} from "@/lib/club-images";
import { cloudinarySignature } from "@/lib/cloudinary-signature";
import { clubIdSchema, clubImageSchema, type ClubImageInput } from "@/lib/validations/dashboard";

export type UploadSignature = {
  cloudName: string;
  apiKey: string;
  /** Signed params; the browser sends them unchanged together with the file. */
  params: Record<string, string>;
  signature: string;
};

export type ClubImageActionResult = { ok: true } | { ok: false; error: string };

const NOT_FOUND = "Klub ne postoji.";
const NOT_CONFIGURED = "Otpremanje fotografija nije podešeno.";
const LIMIT = `Klub može imati najviše ${MAX_CLUB_IMAGES} fotografija.`;

async function ownedClub(clubId: string) {
  const owner = await requireRole("CLUB_OWNER");
  return prisma.club.findFirst({
    where: { id: clubId, ownerId: owner.id },
    select: { id: true, slug: true, images: true },
  });
}

function revalidateClub(slug: string) {
  revalidatePath("/dashboard", "layout");
  revalidatePath(`/klub/${slug}`);
  revalidatePath("/klubovi");
}

/** A one-time signature for uploading one photo into the owner's club folder. */
export async function getClubImageUploadSignature(input: {
  clubId: string;
}): Promise<{ ok: true; upload: UploadSignature } | { ok: false; error: string }> {
  const config = cloudinaryConfigFromEnv(process.env);
  if (!config) return { ok: false, error: NOT_CONFIGURED };
  const parsed = clubIdSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: NOT_FOUND };

  const club = await ownedClub(parsed.data.clubId);
  if (!club) return { ok: false, error: NOT_FOUND };
  if (club.images.length >= MAX_CLUB_IMAGES) return { ok: false, error: LIMIT };

  const params = {
    allowed_formats: ALLOWED_FORMATS,
    public_id: `${clubImagePrefix(club.id)}/${randomUUID()}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
    transformation: UPLOAD_TRANSFORMATION,
  };
  return {
    ok: true,
    upload: {
      cloudName: config.cloudName,
      apiKey: config.apiKey,
      params,
      signature: cloudinarySignature(params, config.apiSecret),
    },
  };
}

/** Saves an uploaded photo to the club. Only URLs from the club's Cloudinary folder are accepted. */
export async function addClubImage(input: ClubImageInput): Promise<ClubImageActionResult> {
  const config = cloudinaryConfigFromEnv(process.env);
  if (!config) return { ok: false, error: NOT_CONFIGURED };
  const parsed = clubImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Neispravna adresa fotografije." };
  const { clubId, url } = parsed.data;

  const club = await ownedClub(clubId);
  if (!club) return { ok: false, error: NOT_FOUND };
  if (!isClubImageUrl(url, config.cloudName, club.id)) {
    return { ok: false, error: "Neispravna adresa fotografije." };
  }
  if (club.images.includes(url)) return { ok: true };
  if (club.images.length >= MAX_CLUB_IMAGES) return { ok: false, error: LIMIT };

  await prisma.club.update({ where: { id: club.id }, data: { images: { push: url } } });
  revalidateClub(club.slug);
  return { ok: true };
}

/** Removes a photo from the club's gallery. */
export async function removeClubImage(input: ClubImageInput): Promise<ClubImageActionResult> {
  const parsed = clubImageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Fotografija ne postoji." };
  const { clubId, url } = parsed.data;

  const club = await ownedClub(clubId);
  if (!club) return { ok: false, error: NOT_FOUND };
  if (!club.images.includes(url)) return { ok: false, error: "Fotografija ne postoji." };

  await prisma.club.update({
    where: { id: club.id },
    data: { images: club.images.filter((image) => image !== url) },
  });
  revalidateClub(club.slug);
  return { ok: true };
}
