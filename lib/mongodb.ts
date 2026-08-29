import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCached: MongooseCache | undefined;
}

let cached = global.mongooseCached;

if (!cached) {
  cached = global.mongooseCached = { conn: null, promise: null };
}

export async function dbConnect() {
  const currentCached = global.mongooseCached || { conn: null, promise: null };
  global.mongooseCached = currentCached;

  if (currentCached.conn) {
    return currentCached.conn;
  }

  if (!currentCached.promise) {
    const opts = {
      bufferCommands: false,
    };

    currentCached.promise = mongoose.connect(MONGODB_URI!, opts).then((m) => {
      return m;
    });
  }

  try {
    currentCached.conn = await currentCached.promise;
  } catch (e) {
    currentCached.promise = null;
    throw e;
  }

  return currentCached.conn;
}
