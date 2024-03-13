import mongoose from "mongoose";

let cachedDB: typeof mongoose;

export async function connectToDatabase() {
  if (!cachedDB) {
    console.info("Connecting to database", process.env.MONGODB_URI);
    cachedDB = await mongoose.connect(process.env.MONGODB_URI as string, {
  
    });
  } else {
    console.info("Using cached database instance");
  }
}
