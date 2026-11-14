import { useId, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
  heading: Heading = "h2",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
  heading?: "h2" | "h3";
}) {
  const id = useId();
  return (
    <section
      aria-labelledby={id}
      className="rounded-xl border border-dashed bg-background px-4 py-10 text-center sm:py-12"
    >
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon aria-hidden="true" className="size-7" />
      </div>
      <Heading id={id} className="text-xl font-semibold break-words">
        {title}
      </Heading>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">{children}</div>
    </section>
  );
}
