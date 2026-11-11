"use client";

import Link from "next/link";
import { Menu } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export function Navbar() {
  return (
    <header className="border-b border-border">
      <nav
        aria-label="Main navigation"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
      >
        <Link href="/" className="font-semibold">
          Servis
        </Link>

        {/* Desktop navigation */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/klubovi">Klubovi</Link>
          <Link href="/mecevi">Otvoreni mečevi</Link>

          <Link href="/login" className="rounded-md border border-border px-3 py-2 text-sm">
            Prijava
          </Link>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Otvori meni" />}>
              <Menu aria-hidden="true" />
            </SheetTrigger>

            <SheetContent side="right">
              <SheetTitle>Meni</SheetTitle>
              <nav aria-label="Mobilna navigacija" className="flex flex-col gap-4 px-4">
                <SheetClose render={<Link href="/klubovi" />}>Klubovi</SheetClose>

                <SheetClose render={<Link href="/mecevi" />}>Otvoreni mečevi</SheetClose>

                <SheetClose render={<Link href="/login" />}>Prijava</SheetClose>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
