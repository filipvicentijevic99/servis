"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, LoaderCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IMAGE_TYPES, imageFileError, MAX_CLUB_IMAGES } from "@/lib/club-images";
import type {
  addClubImage,
  getClubImageUploadSignature,
  removeClubImage,
} from "@/server/actions/club-images";

type Actions = {
  getClubImageUploadSignature: typeof getClubImageUploadSignature;
  addClubImage: typeof addClubImage;
  removeClubImage: typeof removeClubImage;
};

/** Uploads the file straight to Cloudinary with the server's signature; returns the image URL. */
async function uploadToCloudinary(
  file: File,
  upload: Extract<Awaited<ReturnType<typeof getClubImageUploadSignature>>, { ok: true }>["upload"],
): Promise<string> {
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", upload.apiKey);
  body.append("signature", upload.signature);
  for (const [key, value] of Object.entries(upload.params)) body.append(key, value);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(upload.cloudName)}/image/upload`,
    { method: "POST", body },
  );
  const result = (await response.json().catch(() => null)) as { secure_url?: string } | null;
  if (!response.ok || !result?.secure_url) throw new Error("UPLOAD_FAILED");
  return result.secure_url;
}

export function ClubPhotos({
  clubId,
  clubName,
  images,
  uploadEnabled,
  actions,
}: {
  clubId: string;
  clubName: string;
  images: string[];
  uploadEnabled: boolean;
  actions: Actions;
}) {
  const id = useId();
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<"upload" | string | null>(null);
  const full = images.length >= MAX_CLUB_IMAGES;

  async function onFile(file: File | undefined) {
    if (!file || busy) return;
    const fileError = imageFileError(file);
    if (fileError) {
      toast.error(fileError);
      return;
    }
    setBusy("upload");
    try {
      const signed = await actions.getClubImageUploadSignature({ clubId });
      if (!signed.ok) {
        toast.error(signed.error);
        return;
      }
      const url = await uploadToCloudinary(file, signed.upload);
      const saved = await actions.addClubImage({ clubId, url });
      if (!saved.ok) {
        toast.error(saved.error);
        return;
      }
      toast.success("Fotografija je dodata.");
      router.refresh();
    } catch {
      toast.error("Otpremanje nije uspelo. Pokušaj ponovo.");
    } finally {
      setBusy(null);
      if (input.current) input.current.value = "";
    }
  }

  async function remove(url: string) {
    if (busy) return;
    setBusy(url);
    try {
      const result = await actions.removeClubImage({ clubId, url });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Fotografija je uklonjena.");
      router.refresh();
    } catch {
      toast.error("Uklanjanje nije potvrđeno. Pokušaj ponovo.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="space-y-4" aria-labelledby={`${id}-title`}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id={`${id}-title`} className="text-xl font-semibold">
            Fotografije
          </h3>
          <p className="text-sm text-muted-foreground">
            Prva fotografija se prikazuje na kartici kluba. JPG, PNG ili WebP, najviše 5 MB, do{" "}
            {MAX_CLUB_IMAGES} fotografija.
          </p>
        </div>
        {uploadEnabled && (
          <>
            <input
              ref={input}
              id={`${id}-file`}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              className="sr-only"
              tabIndex={-1}
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              className="min-h-11"
              disabled={busy !== null || full}
              onClick={() => input.current?.click()}
            >
              {busy === "upload" ? (
                <LoaderCircle aria-hidden="true" className="animate-spin" />
              ) : (
                <ImagePlus aria-hidden="true" />
              )}
              {busy === "upload" ? "Otpremanje…" : full ? "Dostignut limit" : "Dodaj fotografiju"}
            </Button>
          </>
        )}
      </div>

      {!uploadEnabled && (
        <p className="rounded-xl border p-4 text-sm text-muted-foreground">
          Otpremanje fotografija nije podešeno na ovom serveru.
        </p>
      )}

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Klub još nema fotografija.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-muted"
            >
              <Image
                src={url}
                alt={`${clubName} — fotografija ${index + 1}`}
                fill
                sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                className="object-cover"
              />
              {index === 0 && (
                <span className="absolute top-2 left-2 rounded-md bg-background/90 px-2 py-0.5 text-xs font-medium">
                  Naslovna
                </span>
              )}
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="absolute top-2 right-2 size-11 bg-background/90"
                aria-label={`Ukloni fotografiju ${index + 1}`}
                disabled={busy !== null}
                onClick={() => void remove(url)}
              >
                {busy === url ? (
                  <LoaderCircle aria-hidden="true" className="animate-spin" />
                ) : (
                  <Trash2 aria-hidden="true" />
                )}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
