"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/client.js";

// For pages only logged-out users need: sends logged-in users to /pools.
// Returns true once we know the user is logged out, so the page renders nothing before that (no flash).
export function useGuestOnly() {
  const router = useRouter();
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    api("/api/auth/me").then((r) => (r.ok ? router.replace("/pools") : setGuest(true)));
  }, [router]);

  return guest;
}
