import { NextResponse } from "next/server";
import { fail, isValidId } from "@/lib/http.js";
import { getUser, unauthorized } from "@/lib/auth.js";
import { chatBlockReason, canSeePool } from "@/lib/rules.js";
import { messageSchema, parseBody } from "@/lib/validation.js";
import { toMessageJSON } from "@/lib/pools.js";
import Pool from "@/lib/models/Pool.js";
import Message from "@/lib/models/Message.js";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function GET(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();
    const { id } = await params;
    if (!isValidId(id)) return fail(404, "Pool not found");

    const pool = await Pool.findById(id);
    if (!pool || !canSeePool(pool, user)) return fail(404, "Pool not found");
    // An ended pool's chat stays readable for members, so only membership is checked here.
    if (chatBlockReason(pool, user._id, new Date()) === "not_member") {
      return fail(403, "Only pool members can see this chat");
    }

    const latest = await Message.find({ pool: id }).sort({ createdAt: -1 }).limit(100).populate("author", "name");
    return NextResponse.json({ messages: latest.reverse().map(toMessageJSON) });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}

export async function POST(request, { params }) {
  try {
    const user = await getUser(request);
    if (!user) return unauthorized();
    const { id } = await params;
    if (!isValidId(id)) return fail(404, "Pool not found");

    const { data, error } = parseBody(messageSchema, await request.json().catch(() => null));
    if (error) return fail(400, error);

    const pool = await Pool.findById(id);
    if (!pool || !canSeePool(pool, user)) return fail(404, "Pool not found");
    const reason = chatBlockReason(pool, user._id, new Date());
    if (reason === "not_member") return fail(403, "Only pool members can see this chat");
    if (reason === "ended") return fail(409, "This pool has ended, so the chat is read-only");

    // Messages expire a day after the pool's departure window closes.
    const message = await Message.create({
      pool: id,
      author: user._id,
      text: data.text,
      expiresAt: new Date(pool.departEnd.getTime() + DAY_MS),
    });
    await message.populate("author", "name");
    return NextResponse.json({ message: toMessageJSON(message) }, { status: 201 });
  } catch (e) {
    console.error(e);
    return fail(500, "Something went wrong, try again");
  }
}
