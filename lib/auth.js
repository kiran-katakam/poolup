import bcrypt from "bcryptjs";
import { randomInt } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { connectDB } from "./db.js";
import { fail, isValidId } from "./http.js";
import User from "./models/User.js";

const WEEK_SECONDS = 7 * 24 * 60 * 60;

// Read at call time so tests can set it after import.
function secretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export const hashSecret = (plain) => bcrypt.hash(plain, 10);
export const verifySecret = (plain, hash) => bcrypt.compare(plain, hash);

export function generateOtp() {
  return String(randomInt(0, 1000000)).padStart(6, "0");
}

export async function signSession(userId) {
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

const GOOGLE_SIGNUP_SECONDS = 15 * 60;

// Short-lived proof that Google verified this email; the user still has to add name and phone.
export async function signGoogleSignup({ email, name }) {
  return new SignJWT({ purpose: "google_signup", email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("15m")
    .sign(secretKey());
}

export async function readGoogleSignup(token) {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (payload.purpose !== "google_signup" || typeof payload.email !== "string") return null;
    return { email: payload.email, name: payload.name };
  } catch {
    return null;
  }
}

export function setGoogleSignupCookie(response, token) {
  response.cookies.set("google_signup", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: GOOGLE_SIGNUP_SECONDS,
  });
}

export function clearGoogleSignupCookie(response) {
  response.cookies.set("google_signup", "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

// Also clears the cookie, so a valid token for a deleted user can't bounce between /login and /pools.
export function unauthorized() {
  const response = fail(401, "Log in first");
  clearSessionCookie(response);
  return response;
}

export async function getUser(request) {
  const token = request.cookies.get("session")?.value;
  const userId = token && (await readSession(token));
  if (typeof userId !== "string" || !isValidId(userId)) return null;
  await connectDB();
  return User.findById(userId);
}
