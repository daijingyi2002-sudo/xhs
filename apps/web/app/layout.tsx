import type { Metadata } from "next";
import { Cormorant_Garamond, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import { AppFrame, SiteHeader } from "@xhs/ui";
import { NavLinks } from "../components/nav-links";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"]
});

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  title: "求职 Agent / 面试知识库平台",
  description: "Agent-first job search console for AI product manager candidates."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body className={`${display.variable} ${body.variable}`}>
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
      </body>
    </html>
  );
}
