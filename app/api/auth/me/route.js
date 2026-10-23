import { NextResponse } from "next/server";
import { fail } from "@/lib/http.js";
import { getUser } from "@/lib/auth.js";

export async function GET(request) {
  try {
    const user = await getUser(request);
    if (!user) return fail(401, "Log in first");
    return NextResponse.json({ user });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
