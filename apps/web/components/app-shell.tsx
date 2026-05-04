"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppFrame, SiteHeader } from "@xhs/ui";
import { AuthGate } from "./auth-gate";
import { NavLinks } from "./nav-links";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/login") {
    return <AuthGate>{children}</AuthGate>;
  }

  if (
    pathname === "/" ||
    pathname.startsWith("/interview") ||
    pathname === "/resume-lab" ||
    pathname === "/history" ||
    pathname.startsWith("/jobs") ||
    pathname.startsWith("/plaza")
  ) {
    return <AuthGate>{children}</AuthGate>;
  }

  return (
    <AuthGate>
      <AppFrame>
        <div className="site-shell">
          <SiteHeader
            actions={
              <>
                <NavLinks />
                <Link href="/login" className="ghost-button">
                  登录
                </Link>
              </>
            }
          />
          {children}
        </div>
      </AppFrame>
    </AuthGate>
  );
}
