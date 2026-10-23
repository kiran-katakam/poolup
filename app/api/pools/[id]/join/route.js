import { NextResponse } from "next/server";
import { fail, isValidId } from "@/lib/http.js";
import { getUser, unauthorized } from "@/lib/auth.js";
import { canSeePool, joinBlockReason } from "@/lib/rules.js";
import { joinSchema, parseBody } from "@/lib/validation.js";
import { hasActivePool, toPoolJSON, withMembers } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";

const MESSAGES = {
  cancelled: "This pool was cancelled",
  expired: "This pool already left",
  already_member: "You're already in this pool",
  full: "This pool is full",
  has_active_pool: "You're already in another pool. Leave it first.",
};

export async function POST(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();
    const { id } = await params;
    if (!isValidId(id)) return fail(404, "Pool not found");

    const { data, error } = parseBody(joinSchema, (await request.json().catch(() => null)) ?? {});
    if (error) return fail(400, error);

    const now = new Date();
    const existing = await Pool.findById(id);
    if (!existing || !canSeePool(existing, user)) return fail(404, "Pool not found");
    const reason = joinBlockReason(existing, user._id, await hasActivePool(user._id, now), now);
    if (reason) return fail(409, MESSAGES[reason]);

    // Atomic: only succeeds while a seat is free, even if another join landed after the check above.
    const updated = await Pool.findOneAndUpdate(
      {
        _id: id,
        status: "open",
        departEnd: { $gt: now },
        members: { $ne: user._id },
        $expr: { $lt: [{ $size: "$members" }, "$capacity"] },
      },
      { $push: { members: user._id, ...(data.sharePhone && { sharedPhones: user._id }) } },
      { returnDocument: "after" },
    );
    if (!updated) return fail(409, "This pool just filled or closed");

    const pool = await withMembers(Pool.findById(id));
    return NextResponse.json({ pool: toPoolJSON(pool, user._id, now) });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
