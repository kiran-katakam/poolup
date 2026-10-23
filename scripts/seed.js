import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "../lib/db.js";
import User from "../lib/models/User.js";
import Pool from "../lib/models/Pool.js";

const password = process.env.DEMO_PASSWORD;
if (!password) throw new Error("DEMO_PASSWORD is not set");

const demos = [
  { n: 1, name: "Aarav Demo", phone: "9000000001", from: "campus", to: "railway", hours: 2 },
  { n: 2, name: "Diya Demo", phone: "9000000002", from: "bus-stand", to: "campus", hours: 5 },
  { n: 3, name: "Rohan Demo", phone: "9000000003", from: "campus", to: "airport", hours: 26 },
];

await connectDB();
const passwordHash = await bcrypt.hash(password, 10);
const users = [];
for (const d of demos) {
  users.push(
    await User.findOneAndUpdate(
      { email: `demo${d.n}@vitapstudent.ac.in` },
      { name: d.name, phone: d.phone, passwordHash },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ),
  );
}

await Pool.deleteMany({ creator: { $in: users.map((u) => u._id) } });
const now = Date.now();
for (const [i, d] of demos.entries()) {
  const departStart = new Date(now + d.hours * 3600e3);
  await Pool.create({
    from: d.from,
    to: d.to,
    departStart,
    departEnd: new Date(departStart.getTime() + 30 * 60e3),
    capacity: 4,
    creator: users[i]._id,
    members: [users[i]._id],
    sharedPhones: [users[i]._id],
  });
}

console.log(`Seeded ${users.length} users and ${demos.length} pools`);
await mongoose.disconnect();
