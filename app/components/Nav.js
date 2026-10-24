"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";

const navLink = "flex min-h-11 items-center px-2 text-[15px] font-semibold underline-offset-4 hover:underline";

export default function Nav() {
  const pathname = usePathname();
  const [user, setUser] = useState(undefined); // undefined = still checking

  // Re-check on every page change so the nav updates right after login or logout.
  useEffect(() => {
    api("/api/auth/me").then((r) => setUser(r.ok ? r.data.user : null));
  }, [pathname]);

  return (
    <header>
      <div className="bg-yellow">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 sm:px-6">
          <Link href={user ? "/pools" : "/"} className="flex min-h-11 items-center font-display text-[28px] font-bold tracking-[0.04em]">
            POOLUP
          </Link>
          {user && (
            <div className="flex items-center">
              {pathname !== "/pools" && <Link href="/pools" className={navLink}>Pools</Link>}
              {pathname !== "/account" && <Link href="/account" className={navLink}>Account</Link>}
            </div>
          )}
          {user === null && pathname !== "/login" && (
            <Link href="/login" className={navLink}>Log in</Link>
          )}
        </nav>
      </div>
      <div className="h-2.5 bg-ink" />
    </header>
  );
}
