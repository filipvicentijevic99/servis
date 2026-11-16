import { cloneElement, type ReactElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: {
    data: null as { user: { name: string; role: string } } | null,
    isPending: false,
    error: null as Error | null,
    refetch: vi.fn(),
  },
  signOut: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
  toast: vi.fn(),
  logoutHandlers: [] as (() => Promise<void>)[],
  retry: vi.fn<(handler: () => void) => void>(),
}));
vi.mock("@/lib/auth-client", () => ({
  useSession: () => mocks.session,
  signOut: mocks.signOut,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mocks.replace, refresh: mocks.refresh }),
}));
vi.mock("sonner", () => ({ toast: { error: mocks.toast } }));
vi.mock("./theme-toggle", () => ({ ThemeToggle: () => null }));

// Expose both portal contents in SSR; actual focus and interaction are checked in Chrome.
type ControlProps = {
  children?: ReactNode;
  render?: ReactElement<Record<string, unknown>>;
  onClick?: () => Promise<void>;
  className?: string;
  disabled?: boolean;
};
function Control({ children, render, onClick, className, disabled }: ControlProps) {
  if (children === "Odjavi se" && onClick) mocks.logoutHandlers.push(onClick);
  if (children === "Ponovo učitaj nalog" && onClick) mocks.retry(onClick);
  return render ? (
    cloneElement(render, { className }, children)
  ) : (
    <button className={className} disabled={disabled}>
      {children}
    </button>
  );
}
function Content({ children }: { children?: ReactNode }) {
  return <div>{children}</div>;
}
vi.mock("@/components/ui/button", () => ({ Button: Control }));
vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: Content,
  DropdownMenuContent: Content,
  DropdownMenuTrigger: Control,
  DropdownMenuItem: Control,
  DropdownMenuSeparator: () => <hr />,
}));
vi.mock("@/components/ui/sheet", () => ({
  Sheet: Content,
  SheetContent: Content,
  SheetHeader: Content,
  SheetTitle: Content,
  SheetTrigger: Control,
  SheetClose: Control,
}));
import { Navbar } from "./Navbar";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.session.data = null;
  mocks.session.isPending = false;
  mocks.session.error = null;
  mocks.session.refetch.mockResolvedValue(undefined);
  mocks.signOut.mockResolvedValue({ error: null });
  mocks.logoutHandlers.length = 0;
});

function signedIn(role = "PLAYER") {
  mocks.session.data = { user: { name: "Demo igrač", role } };
  return renderToStaticMarkup(<Navbar />);
}

describe("authenticated navbar", () => {
  it("shows sign-in in desktop and mobile navigation for a confirmed guest", () => {
    const html = renderToStaticMarkup(<Navbar />);
    expect(html.match(/href="\/login"/g)).toHaveLength(2);
    expect(html).not.toContain("Moje rezervacije");
    expect(mocks.logoutHandlers).toHaveLength(0);
  });

  it("does not flash guest or account links while the session is loading", () => {
    mocks.session.isPending = true;
    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain('role="status"');
    expect(html).toContain("Učitavanje naloga");
    expect(html).not.toContain('href="/login"');
    expect(html).not.toContain("Moje rezervacije");
  });

  it("offers session retry instead of treating a network error as a guest", () => {
    mocks.session.error = new Error("Network unavailable");
    const html = renderToStaticMarkup(<Navbar />);
    expect(html).toContain("Ponovo učitaj nalog");
    expect(html).not.toContain('href="/login"');
    mocks.retry.mock.calls[0][0]();
    expect(mocks.session.refetch).toHaveBeenCalledOnce();
  });

  it("shows the player's name, bookings and logout in both navigation variants", () => {
    const html = signedIn();
    expect(html).toContain("Demo igrač");
    expect(html.match(/href="\/igrac\/rezervacije"/g)).toHaveLength(2);
    expect(html).not.toContain('href="/dashboard"');
    expect(html).not.toContain('href="/login"');
    expect(mocks.logoutHandlers).toHaveLength(2);
  });

  it("also shows Dashboard for owners in both navigation variants", () => {
    const html = signedIn("CLUB_OWNER");
    expect(html.match(/href="\/dashboard"/g)).toHaveLength(2);
    expect(html.match(/href="\/igrac\/rezervacije"/g)).toHaveLength(2);
    expect(html).not.toContain('href="/login"');
  });

  it("does not offer Dashboard for an unrecognized role", () => {
    expect(signedIn("ADMIN")).not.toContain('href="/dashboard"');
  });

  it("refetches the session and replaces the protected route after successful logout", async () => {
    signedIn();
    await mocks.logoutHandlers[0]();
    expect(mocks.signOut).toHaveBeenCalledOnce();
    expect(mocks.session.refetch).toHaveBeenCalledOnce();
    expect(mocks.replace).toHaveBeenCalledWith("/");
    expect(mocks.refresh).toHaveBeenCalledOnce();
    expect(mocks.toast).not.toHaveBeenCalled();
  });

  it("prevents duplicate logout requests from desktop and mobile controls", async () => {
    let resolve!: (result: { error: null }) => void;
    mocks.signOut.mockReturnValue(new Promise((done) => (resolve = done)));
    signedIn();
    const first = mocks.logoutHandlers[0]();
    await mocks.logoutHandlers[1]();
    expect(mocks.signOut).toHaveBeenCalledOnce();
    resolve({ error: null });
    await first;
  });

  it.each(["response", "network"])(
    "keeps the session and allows retry on %s logout failure",
    async (failure) => {
      signedIn();
      if (failure === "response") mocks.signOut.mockResolvedValueOnce({ error: { status: 500 } });
      else mocks.signOut.mockRejectedValueOnce(new Error("Offline"));
      await mocks.logoutHandlers[1]();
      expect(mocks.toast).toHaveBeenCalledOnce();
      expect(mocks.session.refetch).not.toHaveBeenCalled();
      expect(mocks.replace).not.toHaveBeenCalled();
      expect(mocks.refresh).not.toHaveBeenCalled();
      await mocks.logoutHandlers[1]();
      expect(mocks.signOut).toHaveBeenCalledTimes(2);
      expect(mocks.refresh).toHaveBeenCalledOnce();
    },
  );
});
