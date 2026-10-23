import mongoose from "mongoose";

const cache = (globalThis._mongoose ??= { conn: null, promise: null });

export async function connectDB() {
  if (cache.conn) return cache.conn;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not set");
  // Cache the promise so concurrent callers share one connection attempt.
  cache.promise ??= mongoose.connect(uri, { dbName: "poolup" });
  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }
  return cache.conn;
}
