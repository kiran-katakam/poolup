import mongoose from "mongoose";
import { NextResponse } from "next/server";

export function fail(status, message) {
  return NextResponse.json({ error: message }, { status });
}

export function isValidId(id) {
  return mongoose.isValidObjectId(id);
}
