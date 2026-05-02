import type { Metadata } from "next";
import Link from "next/link";
import { SiteNav } from "@/components/site-nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panwoo Security Lab",
  description: "Personal security dashboard for notes, writeups, and security intelligence.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/">
              <span aria-hidden="true">P</span>
              <strong>
                Panwoo Security Lab
                <small>private dashboard</small>
              </strong>
            </Link>
            <SiteNav />
          </div>
        </header>
        <main className="site-main">{children}</main>
      </body>
    </html>
  );
}
