import { z } from "zod";
import { normalizeEmail, isCollegeEmail } from "./rules.js";
import { PLACE_IDS } from "./places.js";

const HOUR = 60 * 60 * 1000;

const email = z.string().transform(normalizeEmail);
const collegeEmail = email.refine(isCollegeEmail, "Use your @vitapstudent.ac.in or @vitap.ac.in email");
const name = z.string().trim().min(2, "Name needs at least 2 characters").max(50, "Name can be 50 characters at most");
const phone = z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number");
const place = z.enum(PLACE_IDS, "Pick a place from the list");
const gender = z.enum(["female", "male", "unspecified"], "Pick your gender");
const otp = z.string().regex(/^\d{6}$/, "Code is 6 digits");
const password = z.string("Password needs at least 8 characters").min(8, "Password needs at least 8 characters").max(72, "Password can be 72 characters at most");

// "register" needs a new email, "reset" needs an existing account.
export const otpRequestSchema = z.object({ email: collegeEmail, purpose: z.enum(["register", "reset"]).default("register") });

export const registerSchema = z.object({
  email: collegeEmail,
  otp,
  name,
  phone,
  password,
  gender,
});

export const googleCompleteSchema = z.object({ name, phone, gender, password });
export const resetPasswordSchema = z.object({ email: collegeEmail, otp, password });

export const loginSchema = z.object({
  email: email.refine((e) => e !== "", "Enter your email"),
  password: z.string().min(1, "Enter your password"),
});

// A function so tests can pass a fixed "now".
export function createPoolSchema(now = new Date()) {
  return z
    .object({
      sharePhone: z.boolean().default(true),
      womenOnly: z.boolean().default(false),
      from: place,
      to: place,
      departStart: z.coerce.date("Pick a valid start time"),
      departEnd: z.coerce.date("Pick a valid end time"),
      capacity: z.number().int("Seats must be a whole number").min(2, "Pick 2 to 5 seats").max(5, "Pick 2 to 5 seats"),
      totalFare: z.number().int("Fare must be a whole number").min(50, "Fare must be at least ₹50").max(5000, "Fare can be ₹5000 at most").default(400),
    })
    .superRefine((v, ctx) => {
      const bad = (message) => ctx.addIssue({ code: "custom", message });
      if (v.from === v.to) bad("Pick two different places");
      // Autos run between campus and the city, so every pool starts or ends at campus.
      else if (v.from !== "campus" && v.to !== "campus") bad("One end must be VIT-AP Campus");
      if (v.departEnd <= v.departStart) bad("End time must be after start time");
      else if (v.departEnd - v.departStart > 3 * HOUR) bad("Pick a window of 3 hours or less");
      if (v.departEnd <= now) bad("That time has already passed");
      if (v.departStart > new Date(now.getTime() + 7 * 24 * HOUR)) bad("You can only plan up to 7 days ahead");
    });
}

export const joinSchema = z.object({ sharePhone: z.boolean().default(true) });
export const shareSchema = z.object({ share: z.boolean("share must be true or false") });
export const messageSchema = z.object({
  text: z.string().trim().min(1, "Type a message").max(500, "Messages can be 500 characters at most"),
});

// No gender: it is set once at sign-up and can't be changed (zod drops unknown keys).
export const accountSchema = z.object({
  name,
  nickname: z.string().trim().min(2, "Nickname needs at least 2 characters").max(20, "Nickname can be 20 characters at most"),
  phone,
});

export function parseBody(schema, data) {
  const r = schema.safeParse(data);
  return r.success ? { data: r.data } : { error: r.error.issues[0].message };
}
