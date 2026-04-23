"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppFrame, SiteHeader } from "@xhs/ui";
import { NavLinks } from "./nav-links";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (pathname === "/" || pathname.startsWith("/interview")) {
    return children;
  }

  return (
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
  );
}
