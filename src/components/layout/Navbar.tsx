"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "./theme-toggle";
import { signOut, useSession } from "@/lib/auth-client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function Navbar() {
  const { data: session, isPending, error, refetch } = useSession();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const inFlight = useRef(false);
  const user = session?.user;
  const accountLinks = [
    ...(user?.role === "CLUB_OWNER" ? [{ href: "/dashboard", label: "Dashboard" }] : []),
    { href: "/igrac/rezervacije", label: "Moje rezervacije" },
  ];

  async function logout() {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoggingOut(true);
    try {
      const result = await signOut();
      if (result.error) {
        toast.error("Odjava nije uspela. Pokušaj ponovo.");
        return;
      }
      setMobileOpen(false);
      await refetch();
      router.replace("/");
      router.refresh();
    } catch {
      toast.error("Odjava nije potvrđena. Proveri vezu i pokušaj ponovo.");
    } finally {
      inFlight.current = false;
      setLoggingOut(false);
    }
  }

  const sessionStatus = isPending ? (
    <span role="status" className="inline-flex min-h-11 items-center">
      <span className="sr-only">Učitavanje naloga…</span>
      <span aria-hidden="true" className="h-5 w-24 rounded bg-muted motion-safe:animate-pulse" />
    </span>
  ) : error ? (
    <Button variant="outline" className="min-h-11" onClick={() => void refetch()}>
      Ponovo učitaj nalog
    </Button>
  ) : null;

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

            {sessionStatus ??
              (user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        variant="outline"
                        className="min-h-11 max-w-52"
                        aria-label={`Korisnički meni: ${user.name}`}
                      />
                    }
                  >
                    <span className="truncate">{user.name}</span>
                    <ChevronDown aria-hidden="true" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="min-w-52" aria-label="Moj nalog">
                    {accountLinks.map((link) => (
                      <DropdownMenuItem
                        key={link.href}
                        render={<Link href={link.href} />}
                        className="min-h-11"
                      >
                        {link.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      closeOnClick={false}
                      disabled={loggingOut}
                      aria-busy={loggingOut}
                      className="min-h-11"
                    >
                      {loggingOut ? "Odjavljivanje…" : "Odjavi se"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex min-h-11 items-center rounded-md border border-border px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-ring"
                >
                  Prijava
                </Link>
              ))}
          </div>
          <ThemeToggle />
          <div className="md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    className="min-h-11 max-w-40 min-w-11 gap-2 px-2"
                    aria-label="Otvori meni"
                  />
                }
              >
                {!isPending && !error && user && <span className="truncate">{user.name}</span>}
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

                  {sessionStatus ??
                    (user ? (
                      <div className="space-y-2 border-t pt-4">
                        <p className="px-3 font-medium [overflow-wrap:anywhere]">{user.name}</p>
                        {accountLinks.map((link) => (
                          <SheetClose
                            key={link.href}
                            nativeButton={false}
                            render={<Link href={link.href} />}
                            className="flex min-h-11 items-center rounded-lg px-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                          >
                            {link.label}
                          </SheetClose>
                        ))}
                        <Button
                          variant="ghost"
                          className="min-h-11 w-full justify-start px-3"
                          disabled={loggingOut}
                          aria-busy={loggingOut}
                          onClick={logout}
                        >
                          {loggingOut ? "Odjavljivanje…" : "Odjavi se"}
                        </Button>
                      </div>
                    ) : (
                      <SheetClose
                        nativeButton={false}
                        render={<Link href="/login" />}
                        className="flex min-h-11 items-center rounded-lg px-3 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring"
                      >
                        Prijava
                      </SheetClose>
                    ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>
    </header>
  );
}
