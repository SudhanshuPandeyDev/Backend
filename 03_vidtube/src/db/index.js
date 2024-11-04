// while connecting databases always remember 2 things :
// 1. you can get error while connecting to a databases so always use try catch
// 2. always use asyc await because database is in another continent

import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\n MongoDB conected! DB host: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MongoDB connection error", error);
    process.exit(1); // Exit with a status of 1 to indicate failure
  }
};

export default connectDB;
