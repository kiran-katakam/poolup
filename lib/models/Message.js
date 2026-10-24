import mongoose from "mongoose";

const schema = new mongoose.Schema({
  pool: { type: mongoose.Schema.Types.ObjectId, ref: "Pool", required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

schema.index({ pool: 1, createdAt: 1 });
// MongoDB deletes a message when its expiresAt time arrives.
schema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.Message || mongoose.model("Message", schema);
