// The middleware is responsible for verifying a JWT access token, which can be sent either as a cookie or in the Authorization header. It validates the token and checks if the user exists in the database.

import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// not using res here so _
export const verifyJWT = asyncHandler(async (req, _, next) => {
  // An access token is typically included in the Authorization header of an HTTP request to authenticate the client making the request to the server.
  const token =
    req.cookies.accessToken ||
    req.header("Authorization")?.replace("Bearer ", ""); // use ("Bearer ")

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }
  try {
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password",
      "-refreshToken"
    );
    if (!user) {
      throw new ApiError(401, "Unauthorized");
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid access token");
  }
});
