import mongoose from "mongoose";
let cachedDb: any = null;

export const connectToDatabase = async () => {
  if (cachedDb) {
    console.info("Using existing database connection");
    return cachedDb;
  } else {

    try {
      console.info("Connecting to database", process.env.DATABASE_NAME);
      cachedDb = await mongoose.connect(process.env.MONGODB_URI as string, {
        dbName: process.env.DATABASE_NAME,
      })
      console.info("Connected to database");
    } catch (error) {
      console.error("Error connecting to database", error);
      throw error;
    }
  }
};
