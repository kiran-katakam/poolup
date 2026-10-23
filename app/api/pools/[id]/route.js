import { NextResponse } from "next/server";
import { fail, isValidId } from "@/lib/http.js";
import { getUser, unauthorized } from "@/lib/auth.js";
import { toPoolJSON, withMembers } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";

export async function GET(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();
    const { id } = await params;
    if (!isValidId(id)) return fail(404, "Pool not found");
    const pool = await withMembers(Pool.findById(id));
    if (!pool) return fail(404, "Pool not found");
    return NextResponse.json({ pool: toPoolJSON(pool, user._id, new Date()) });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
