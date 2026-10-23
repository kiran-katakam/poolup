import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "./db.js";
import User from "./models/User.js";

const WEEK_SECONDS = 7 * 24 * 60 * 60;

// Read at call time so tests can set it after import.
const secretKey = () => new TextEncoder().encode(process.env.JWT_SECRET);

export const hashSecret = (plain) => bcrypt.hash(plain, 10);
export const verifySecret = (plain, hash) => bcrypt.compare(plain, hash);

export function generateOtp() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

export function signSession(userId) {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function readSession(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    return payload.userId ?? null;
  } catch {
    return null;
  }
}

export function setSessionCookie(response, token) {
  response.cookies.set("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: WEEK_SECONDS,
  });
}

export function clearSessionCookie(response) {
  response.cookies.set("session", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function getUser(request) {
  const token = request.cookies.get("session")?.value;
  const userId = token && (await readSession(token));
  if (!userId) return null;
  await connectDB();
  return User.findById(userId);
}
