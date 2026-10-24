import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../lib/models/User.js";
import Pool from "../lib/models/Pool.js";

const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error("DEMO_PASSWORD is not set");

// Reviewer accounts, 2 female and 2 male (women-only pools need a female one). They start in no pool.
// Keep in sync with DEMO_ACCOUNTS in app/login/page.js.
const demos = [
  { email: "demo1@vitapstudent.ac.in", name: "Aarav Demo", nickname: "Aarav", phone: "9000000001", gender: "male" },
  { email: "demo2@vitapstudent.ac.in", name: "Diya Demo", nickname: "Diya", phone: "9000000002", gender: "female" },
  { email: "demo3@vitapstudent.ac.in", name: "Rohan Demo", nickname: "Rohan", phone: "9000000003", gender: "male" },
  { email: "demo4@vitapstudent.ac.in", name: "Ananya Demo", nickname: "Ananya", phone: "9000000004", gender: "female" },
];

// Seed-only members fill the listed pools. .invalid is a reserved domain, so no real inbox exists.
const seeds = [
  { email: "seed1@poolup.invalid", name: "Sneha (demo)", phone: "9000000011", gender: "female" },
  { email: "seed2@poolup.invalid", name: "Teja (demo)", phone: "9000000012", gender: "male" },
  { email: "seed3@poolup.invalid", name: "Meghana (demo)", phone: "9000000013", gender: "female" },
  { email: "seed4@poolup.invalid", name: "Rohan (demo)", phone: "9000000014", gender: "male" },
  { email: "seed5@poolup.invalid", name: "Kiran (demo)", phone: "9000000015", gender: "male" },
  { email: "seed6@poolup.invalid", name: "Arjun (demo)", phone: "9000000016", gender: "male" },
  { email: "seed7@poolup.invalid", name: "Priya (demo)", phone: "9000000017", gender: "female" },
];

// members are indexes into seeds; the first one is the creator. No one is in two pools (one-pool rule).
const pools = [
  { from: "campus", to: "railway", hours: 2, members: [0, 1, 2] },
  { from: "bus-stand", to: "campus", hours: 5, members: [3, 4] },
  { from: "campus", to: "airport", hours: 26, members: [5] },
  { from: "campus", to: "trendset", hours: 4, members: [6], womenOnly: true },
];

async function upsertUser(account, passwordHash) {
  // Only demo/seed emails are touched, so the file is the source of truth for gender.
  // Seed-only accounts use their name as the nickname, so "(demo)" stays visible.
  const fields = { $set: { name: account.name, nickname: account.nickname ?? account.name, phone: account.phone, passwordHash } };
  if (account.gender) fields.$set.gender = account.gender;
  else fields.$unset = { gender: 1 };
  return User.findOneAndUpdate(
    { email: account.email },
    fields,
    { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
  );
}

await connectDB();
const demoHash = await bcrypt.hash(password, 10);
const demoUsers = [];
for (const d of demos) demoUsers.push(await upsertUser(d, demoHash));

const seedUsers = [];
for (const s of seeds) {
  // A random password nobody knows, so these accounts can't be logged into.
  const hash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
  seedUsers.push(await upsertUser(s, hash));
}

// Re-running starts clean: drop every pool a demo or seed account created.
await Pool.deleteMany({ creator: { $in: [...demoUsers, ...seedUsers].map((u) => u._id) } });

const HALF_HOUR = 30 * 60e3;
const now = Date.now();
for (const p of pools) {
  // Round up to the next :00 or :30 so the demo shows tidy times like 5:30 pm.
  const departStart = new Date(Math.ceil((now + p.hours * 3600e3) / HALF_HOUR) * HALF_HOUR);
  const members = p.members.map((i) => seedUsers[i]._id);
  await Pool.create({
    from: p.from,
    to: p.to,
    departStart,
    departEnd: new Date(departStart.getTime() + HALF_HOUR),
    womenOnly: p.womenOnly ?? false,
    capacity: 4,
    totalFare: 400,
    creator: members[0],
    members,
    sharedPhones: [members[0]],
  });
}

console.log(`Seeded ${demoUsers.length} demo users, ${seedUsers.length} seed users and ${pools.length} pools`);
await mongoose.disconnect();
