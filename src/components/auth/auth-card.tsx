import type { ReactNode } from "react";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footerText: string;
  linkLabel: string;
  linkHref: string;
};

export function AuthCard({
  title,
  description,
  children,
  footerText,
  linkLabel,
  linkHref,
}: AuthCardProps) {
  return (
    <Card>
      <CardHeader>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <p className="text-center text-sm text-muted-foreground">
          {footerText}{" "}
          <Link
            href={linkHref}
            className="rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            {linkLabel}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
