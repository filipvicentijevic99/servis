"use client";

import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className="size-11" aria-label="Izaberi temu" />
        }
      >
        {/* Identical server/client markup: CSS selects the resolved theme icon. */}
        <Sun aria-hidden="true" className="size-5 dark:hidden" />
        <Moon aria-hidden="true" className="hidden size-5 dark:block" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44" aria-label="Tema prikaza">
        <DropdownMenuRadioGroup
          value={theme ?? "system"}
          onValueChange={setTheme}
          aria-label="Tema"
        >
          <DropdownMenuRadioItem value="light" closeOnClick className="min-h-11">
            <Sun aria-hidden="true" />
            Svetla
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark" closeOnClick className="min-h-11">
            <Moon aria-hidden="true" />
            Tamna
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system" closeOnClick className="min-h-11">
            <Monitor aria-hidden="true" />
            Sistemska
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
