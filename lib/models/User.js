import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
  phone: { type: String, required: true },
  gender: { type: String, enum: ["female", "male", "unspecified"] },
  // Missing for Google-only accounts; login then fails against the dummy hash.
  passwordHash: { type: String },
  createdAt: { type: Date, default: Date.now },
});

schema.set("toJSON", {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    return ret;
  },
});

export default mongoose.models.User || mongoose.model("User", schema);
