import mongoose from "mongoose";

const ref = { type: mongoose.Schema.Types.ObjectId, ref: "User" };

const schema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  departStart: { type: Date, required: true },
  departEnd: { type: Date, required: true },
  capacity: { type: Number, required: true, min: 2, max: 5 },
  totalFare: { type: Number, default: 400 },
  creator: { ...ref, required: true },
  members: [ref],
  sharedPhones: { type: [ref], default: [] },
  status: { type: String, enum: ["open", "cancelled"], default: "open" },
  createdAt: { type: Date, default: Date.now },
});

schema.index({ status: 1, departEnd: 1 });

export default mongoose.models.Pool || mongoose.model("Pool", schema);
