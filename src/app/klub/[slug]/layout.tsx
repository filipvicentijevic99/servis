import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { getClub } from "@/server/queries/clubs";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const club = await getClub((await params).slug);
  if (!club) return { title: "Klub nije pronađen | Servis", robots: { index: false } };
  const title = `${club.name} — ${club.city} | Servis`;
  const description =
    club.description?.trim().slice(0, 160) ||
    `Pogledaj terene, cene i radno vreme kluba ${club.name} u gradu ${club.city}.`;
  return { title, description, openGraph: { title, description, type: "website" } };
}

export default async function ClubLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // Resolve existence before the page's loading boundary starts streaming a 200 response.
  if (!(await getClub((await params).slug))) notFound();
  return children;
}
