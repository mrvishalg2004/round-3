import mongoose from 'mongoose';

// Cache the mongoose connection to avoid multiple connections
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

// Default connection string for local development
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rounds:rounds123@aiodysseyrounds.rr88p.mongodb.net/retryWrites=true&w=majority&appName=AIODYSSEYRounds';

/**
 * Connect to MongoDB database
 */
async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('Connected to MongoDB');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect; 