"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  return (
    <header className="border-b border-border">
      <nav
        aria-label="Glavna navigacija"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4"
      >
        <Link href="/" className="font-semibold">
          Servis
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden items-center gap-6 md:flex">
            <Link href="/klubovi">Klubovi</Link>
            <Link href="/mecevi">Otvoreni mečevi</Link>

            <Link
              href="/login"
              className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
            >
              Prijava
            </Link>
          </div>
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-11"
                    aria-label="Otvori meni"
                  />
                }
              >
                <Menu aria-hidden="true" />
              </SheetTrigger>

              <SheetContent side="right" showCloseButton={false} className="overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Meni</SheetTitle>
                </SheetHeader>
                <SheetClose
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 size-11"
                      aria-label="Zatvori meni"
                    />
                  }
                >
                  <X aria-hidden="true" />
                </SheetClose>
                <nav aria-label="Mobilna navigacija" className="flex flex-col gap-4 px-4">
                  <SheetClose
                    nativeButton={false}
                    render={<Link href="/klubovi" />}
                    className="flex min-h-11 items-center rounded-lg px-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Klubovi
                  </SheetClose>

                  <SheetClose
                    nativeButton={false}
                    render={<Link href="/mecevi" />}
                    className="flex min-h-11 items-center rounded-lg px-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Otvoreni mečevi
                  </SheetClose>

                  <SheetClose
                    nativeButton={false}
                    render={<Link href="/login" />}
                    className="flex min-h-11 items-center rounded-lg px-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                  >
                    Prijava
                  </SheetClose>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
