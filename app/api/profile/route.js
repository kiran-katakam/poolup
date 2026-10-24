import { NextResponse } from "next/server";
import { fail } from "@/lib/http.js";
import { getUser, unauthorized } from "@/lib/auth.js";
import { profileSchema, parseBody } from "@/lib/validation.js";
import User from "@/lib/models/User.js";

export async function POST(request) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();

    const body = await request.json().catch(() => null);
    const { data, error } = parseBody(profileSchema, body);
    if (error) return fail(400, error);

    const updated = await User.findByIdAndUpdate(user._id, { gender: data.gender }, { returnDocument: "after" });
    return NextResponse.json({ user: updated });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
