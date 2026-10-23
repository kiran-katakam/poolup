import { NextResponse } from "next/server";
import { fail, isValidId } from "@/lib/http.js";
import { getUser } from "@/lib/auth.js";
import { toPoolJSON, withMembers } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";

export async function POST(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return fail(401, "Log in first");
    const { id } = await params;
    if (!isValidId(id)) return fail(404, "Pool not found");

    const existing = await Pool.findById(id);
    if (!existing) return fail(404, "Pool not found");
    if (String(existing.creator) !== String(user._id)) {
      return fail(403, "Only the person who made the pool can cancel it");
    }

    await Pool.updateOne({ _id: id }, { status: "cancelled" });
    const pool = await withMembers(Pool.findById(id));
    return NextResponse.json({ pool: toPoolJSON(pool, user._id, new Date()) });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
