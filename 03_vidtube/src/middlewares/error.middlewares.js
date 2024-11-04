// feel free to copy it this is just extra knowledge not necessary

//  It's designed to handle and format errors consistently across the app, ensure that certain error types (like Mongoose errors) are treated appropriately, and control how much information is exposed based on the environment (development or production).

import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";

const erroHandler = (err, req, res, next) => {
  let error = err;

  // If the error has a statusCode, use it.
  // If the error is a Mongoose error, set statusCode to 400.
  // If it’s neither, default the status code to 500 (server error).
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? 400 : 500;

    const message = error.message || "Something went wrong";
    // error?.errors uses the optional chaining operator (?.) to safely access the errors property of the error object, if it exist
    error = new ApiError(statusCode, message, error?.errors || [], err.stack);
  }

  const response = {
    ...error, // Spread Operator
    message: error.message,
    // The stack trace is included only if the app is running in development mode, making debugging easier for developers but preventing sensitive information from being exposed in production environments
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {}),
  };

  return res.status(error.statusCode).json(response);
};

export { erroHandler };
