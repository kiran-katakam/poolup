import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { getUser } from "@/lib/auth.js";
import { toPoolJSON, withMembers } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";

export async function GET(request) {
  try {
    const user = await getUser(request);
    if (!user) return fail(401, "Log in first");
    const now = new Date();
    const pool = await withMembers(
      Pool.findOne({ members: user._id, status: "open", departEnd: { $gt: now } }),
    );
    return NextResponse.json({ pool: pool ? toPoolJSON(pool, user._id, now) : null });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
