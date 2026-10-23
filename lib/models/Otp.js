import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  codeHash: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 }, // TTL index
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Otp || mongoose.model("Otp", schema);
