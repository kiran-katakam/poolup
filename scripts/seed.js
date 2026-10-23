import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../lib/models/User.js";
import Pool from "../lib/models/Pool.js";

const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error("DEMO_PASSWORD is not set");

// Reviewer accounts: they start in no pool, so demo1 can create and demo2 can join.
const demos = [
  { email: "demo1@vitapstudent.ac.in", name: "Aarav Demo", phone: "9000000001" },
  { email: "demo2@vitapstudent.ac.in", name: "Diya Demo", phone: "9000000002" },
  { email: "demo3@vitapstudent.ac.in", name: "Rohan Demo", phone: "9000000003" },
];

// Seed-only members fill the listed pools. .invalid is a reserved domain, so no real inbox exists.
const seeds = [
  { email: "seed1@poolup.invalid", name: "Sneha (demo)", phone: "9000000011" },
  { email: "seed2@poolup.invalid", name: "Teja (demo)", phone: "9000000012" },
  { email: "seed3@poolup.invalid", name: "Meghana (demo)", phone: "9000000013" },
  { email: "seed4@poolup.invalid", name: "Rohan (demo)", phone: "9000000014" },
  { email: "seed5@poolup.invalid", name: "Kiran (demo)", phone: "9000000015" },
  { email: "seed6@poolup.invalid", name: "Arjun (demo)", phone: "9000000016" },
];

// members are indexes into seeds; the first one is the creator. No one is in two pools (one-pool rule).
const pools = [
  { from: "campus", to: "railway", hours: 2, members: [0, 1, 2] },
  { from: "bus-stand", to: "campus", hours: 5, members: [3, 4] },
  { from: "campus", to: "airport", hours: 26, members: [5] },
];

async function upsertUser(account, passwordHash) {
  return User.findOneAndUpdate(
    { email: account.email },
    { name: account.name, phone: account.phone, passwordHash },
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
    capacity: 4,
    totalFare: 400,
    creator: members[0],
    members,
    sharedPhones: [members[0]],
  });
}

console.log(`Seeded ${demoUsers.length} demo users, ${seedUsers.length} seed users and ${pools.length} pools`);
await mongoose.disconnect();
