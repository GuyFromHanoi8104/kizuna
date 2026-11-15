"use client";

import { usePathname } from "next/navigation";

/** Re-mounts on every navigation, so each page slides in from the side of its tab. */
export default function Template({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return <div className={path.startsWith("/app") ? "page-r" : "page-l"}>{children}</div>;
}
