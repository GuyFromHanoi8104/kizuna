"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const path = usePathname();
  const onApp = path.startsWith("/app");

  return (
    <header className="nav-wrap">
      <nav className="nav" aria-label="Main">
        <Link href="/" className="logo">
          <svg width="34" height="22" viewBox="0 0 34 22" aria-hidden="true">
            <circle className="ring-l" cx="11" cy="11" r="8.5" fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <circle className="ring-r" cx="23" cy="11" r="8.5" fill="none" stroke="#DD2C04" strokeWidth="3" />
          </svg>
          <span>KIZUNA</span>
        </Link>

        <div className="tabs">
          {/* The white pill slides between tabs; Nav lives in the layout, so it persists across pages. */}
          <span
            className="tab-ind"
            aria-hidden="true"
            style={onApp ? { transform: "translateX(var(--tab-x, 100px))", width: "var(--tab-w, 168px)" } : undefined}
          />
          <Link href="/" className="tab tab-home" aria-current={!onApp ? "page" : undefined}>
            Home
          </Link>
          <Link href="/app" className="tab tab-app" aria-current={onApp ? "page" : undefined}>
            My connections
          </Link>
        </div>

        <Link href="/app" className="nav-cta">
          Open my map
        </Link>
      </nav>
    </header>
  );
}
