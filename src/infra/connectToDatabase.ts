import mongoose from "mongoose";

export const connectToDatabase = async () => {
  try {
    console.info("Connecting to database", process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI as string, {
      dbName: process.env.DATABASE_NAME,
    });

    console.info("Connected to database");
  } catch (error) {
    console.error("Error connecting to database", error);
    throw error;
  }
};
