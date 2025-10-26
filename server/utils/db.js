// utils/db.js
import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";

const connectDB = async () => {
  const uri = process.env.MONGOOSE_CONNECTION_STRING;
  if (!uri) {
    throw new Error("MONGOOSE_CONNECTION_STRING is undefined. Check .env, path, and key name.");
  }
  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
