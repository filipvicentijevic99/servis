import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ theme: undefined as string | undefined, setTheme: vi.fn() }));
vi.mock("next-themes", () => ({ useTheme: () => state }));
vi.mock("next/navigation", () => ({ useRouter: () => ({}) }));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => ({ data: null, isPending: false, error: null }),
  signOut: vi.fn(),
}));
import { ThemeToggle } from "./theme-toggle";
import { Navbar } from "./Navbar";

describe("theme controls", () => {
  it("keeps identical initial markup for unresolved, light, dark and system preferences", () => {
    const html = [undefined, "light", "dark", "system"].map((theme) => {
      state.theme = theme;
      return renderToStaticMarkup(<ThemeToggle />);
    });
    for (const markup of html) expect(markup).toBe(html[0]);
    expect(html[0]).toContain('aria-label="Izaberi temu"');
    expect(html[0]).toContain("dark:hidden");
    expect(html[0]).toContain("dark:block");
    expect(state.setTheme).not.toHaveBeenCalled();
  });
  it("provides separate labelled mobile menu and theme controls with touch targets", () => {
    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain('aria-label="Glavna navigacija"');
    expect(html).toContain('aria-label="Otvori meni"');
    expect(html).toContain('aria-label="Izaberi temu"');
    expect(html).toContain("size-11");
    expect(html).toContain("min-w-11");
    expect(html).toContain('href="/login"');
  });
});
