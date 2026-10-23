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
    if (String(existing.creator) === String(user._id)) {
      return fail(403, "You made this pool — cancel it instead");
    }
    if (!existing.members.some((m) => String(m) === String(user._id))) {
      return fail(409, "You're not in this pool");
    }

    await Pool.updateOne({ _id: id }, { $pull: { members: user._id, sharedPhones: user._id } });
    const pool = await withMembers(Pool.findById(id));
    return NextResponse.json({ pool: toPoolJSON(pool, user._id, new Date()) });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
