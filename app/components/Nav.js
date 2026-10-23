"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";

const navLink = "flex min-h-11 items-center px-2 text-[15px] font-semibold underline-offset-4 hover:underline";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(undefined); // undefined = still checking

  // Re-check on every page change so the nav updates right after login or logout.
  useEffect(() => {
    api("/api/auth/me").then((r) => setUser(r.ok ? r.data.user : null));
  }, [pathname]);

  async function logOut() {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }

  return (
    <header>
      <div className="bg-yellow">
        <nav className="mx-auto flex max-w-[480px] items-center justify-between px-4 py-2.5">
          <Link href={user ? "/pools" : "/"} className="flex min-h-11 items-center font-display text-[28px] font-bold tracking-[0.04em]">
            POOLUP
          </Link>
          {user && (
            <div className="flex items-center">
              {pathname !== "/pools" && <Link href="/pools" className={navLink}>Pools</Link>}
              <span className="max-w-28 truncate pl-2 text-[15px] font-semibold">{user.name.split(" ")[0]}</span>
              <span aria-hidden="true" className="pl-1.5">·</span>
              <button type="button" onClick={logOut} className={`${navLink} cursor-pointer`}>Log out</button>
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
