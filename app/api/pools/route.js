import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db.js";
import { fail } from "@/lib/http.js";
import { getUser, unauthorized } from "@/lib/auth.js";
import { PLACE_IDS } from "@/lib/places.js";
import { istDayRange } from "@/lib/rules.js";
import { createPoolSchema, parseBody } from "@/lib/validation.js";
import { hasActivePool, toPoolJSON, withMembers } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";

export async function GET(request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const now = new Date();
    const q = request.nextUrl.searchParams;
    const filter = { status: "open", departEnd: { $gt: now } };
    // Unknown from/to values are ignored rather than rejected.
    if (PLACE_IDS.includes(q.get("from"))) filter.from = q.get("from");
    if (PLACE_IDS.includes(q.get("to"))) filter.to = q.get("to");
    const date = q.get("date");
    if (date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return fail(400, "Pick a valid date");
      const { start, end } = istDayRange(date);
      if (isNaN(start)) return fail(400, "Pick a valid date");
      filter.departStart = { $gte: start, $lt: end };
    }

    await connectDB();
    const pools = await withMembers(Pool.find(filter).sort({ departStart: 1 }).limit(100));
    // The list never carries phones, even for your own pool.
    const list = pools.map((p) => {
      const json = toPoolJSON(p, user._id, now);
      json.members = json.members.map(({ phone, ...m }) => m);
      return json;
    });
    return NextResponse.json({ pools: list });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}

export async function POST(request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const now = new Date();
    const body = await request.json().catch(() => null);
    const { data, error } = parseBody(createPoolSchema(now), body);
    if (error) return fail(400, error);

    if (await hasActivePool(user._id, now)) return fail(409, "You're already in an active pool");
    const { sharePhone, ...fields } = data;
    const created = await Pool.create({
      ...fields,
      creator: user._id,
      members: [user._id],
      sharedPhones: sharePhone ? [user._id] : [],
    });
    const pool = await withMembers(Pool.findById(created._id));
    return NextResponse.json({ pool: toPoolJSON(pool, user._id, now) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
