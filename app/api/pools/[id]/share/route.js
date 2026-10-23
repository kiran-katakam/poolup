import { NextResponse } from "next/server";
import { fail, isValidId } from "@/lib/http.js";
import { getUser } from "@/lib/auth.js";
import { shareSchema, parseBody } from "@/lib/validation.js";
import { toPoolJSON, withMembers } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";

export async function POST(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return fail(401, "Log in first");
    const { id } = await params;
    if (!isValidId(id)) return fail(404, "Pool not found");

    const { data, error } = parseBody(shareSchema, await request.json().catch(() => null));
    if (error) return fail(400, error);

    // Filtering on members makes the non-member check and the update one atomic step.
    const updated = await Pool.findOneAndUpdate(
      { _id: id, members: user._id },
      data.share ? { $addToSet: { sharedPhones: user._id } } : { $pull: { sharedPhones: user._id } },
      { returnDocument: "after" },
    );
    if (!updated) {
      return (await Pool.exists({ _id: id })) ? fail(403, "Only members can do that") : fail(404, "Pool not found");
    }

    const pool = await withMembers(Pool.findById(id));
    return NextResponse.json({ pool: toPoolJSON(pool, user._id, new Date()) });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
