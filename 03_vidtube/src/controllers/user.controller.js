import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);

    //small check for user existence
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token to the user's record in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Skipping validation
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = req.body; // destructuring

  // 1. validation
  // The optional chaining (?.) operator checks if fullname is null or undefined.if it is null or undefined it will short circuit and return undefined instead of throwing an error
  if (
    // some checks if at least one element in the array passes a given condition
    [fullName, email, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // 2. logic to find if user already exists
  // since database is always in another continent we use async and User is mongoose model we can use findOne()
  // used to find a single document in the User collection that matches the given query.
  // $or takes an array of conditions and returns a document that matches at least one of the conditions.if not matches then return null
  const existedUser = await User.findOne({
    $or: [{ username, email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }

  // req.files is used in handling file uploads in an Express.js app,often when using middleware like multer.
  // avatar[0] accesses the first file in the avatar array (assuming avatar holds multiple files).
  // Using console.warn(req.files);  is a simple and effective way to verify whether your Multer file upload middleware is working properly.
  console.warn(req.files);
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverLocalPath = req.files?.coverImage?.[0]?.path;

  // throwing error bcz it is required in our schema
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  let avatar;
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("Uploaded avatar", avatar);
  } catch (error) {
    console.log("Erro uploading avatar", error);
    throw new ApiError(500, "Failed to upload avatar");
  }

  let coverImage;
  try {
    coverImage = await uploadOnCloudinary(coverLocalPath);
    console.log("Uploaded coverImage", coverImage);
  } catch (error) {
    console.log("Erro uploading coverImage", error);
    throw new ApiError(500, "Failed to upload coverImage");
  }

  // using await bcz database operation takes time
  try {
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase(),
    });

    // checking if the User field is created and excluding some sensitive info.
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "something went wrong while registering a user");
    }

    return res
      .status(201)
      .json(new ApiResponse(200, createdUser, "User registered successfully"));
  } catch (error) {
    console.log("User Creation Failed");
    if (avatar) {
      await deleteFromCloudinary(avatar.public_id);
    }
    if (coverImage) {
      await deleteFromCloudinary(coverImage.public_id);
    }
    throw new ApiError(
      500,
      "Something went wrong while registering a user and images were deleted"
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  // get data from body
  const { email, username, password } = req.body;
  // validation
  if (!email) {
    throw new ApiError(400, "Email is Required");
  }

  // checking if user already exists
  const user = await User.findOne({
    $or: [{ username }, { email }],
  });
  // if not exist throw error
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // if exits validate password
  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    // Setting httpOnly: true on a cookie makes it non-modifiable and inaccessible by the client-side JavaScript..It's a security measure to protect cookies from attacks like cross-site scripting (XSS).
    httpOnly: true,
    // if environment is production secure is always going to be true otherwise not making flexibility for our testing ...and also securing our webApp
    secure: process.env.NODE_ENV === "production",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, accessToken, refreshToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  // Model.findByIdAndUpdate(id, update, options, callback);
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true } // now mongoose will return the updated document
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  };

  //  options ensure security during cookie clearing, as they must match the settings used when the cookie was originally set.
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  //  refresh tokens are stored in HTTP-only cookies
  // (like mobile apps or non-browser clients), the refresh token might be sent in the request body instead.
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    return new ApiResponse(401, "Refresh token is required");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    // if decodedToken is null or undefined No error; it safely returns undefined, and `findById(undefined)` will likely return null. (no error)
    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };

    // generate token (send new access and refresh tokens to the client)
    // Renaming the refreshToken -> refreshToken: newRefreshToken.This means that the refreshToken property from the object returned by generateAccessAndRefreshToken is being renamed to newRefreshToken in the local scope.
    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessAndRefreshToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    return new ApiError(
      500,
      "Something went wrong while refreshing access token"
    );
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  // req.user represents the authenticated user's data that was previously attached to the req (request) object, most likely by a middleware function such as verifyJWT
  const user = await User.findById(req.user?._id);
  const isPasswordValid = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordValid) {
    throw new ApiError(401, "old password is incorrect");
  }
  user.password = newPassword;

  await user.save({ validateBeforeSave: false }); // skipping validation checks

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password Changed Successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  // the user info. is attached to req.user during authentication middleware (such as verifyJWT).
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current User Details"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!fullName || !email) {
    return new ApiError(400, "fullName and email are required");
  }
  // Model.findByIdAndUpdate(id, update, options, callback)
  User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"));
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  // the req.file object comes from using middleware like Multer
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    return new ApiError(400, "File is Required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  // when the img uploads cloudinary returns an object containing details about the uploaded image, such as its URL, size, dimensions, et

  if (!avatar.url) {
    throw new ApiError(500, "Something went wrong while uploading avatar");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar Updated Successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  // the req.file object comes from using middleware like Multer
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    return new ApiError(400, "File is required");
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  // when the img uploads cloudinary returns an object containing details about the uploaded image, such as its URL, size, dimensions, et
  if (!coverImage.url) {
    return new ApiError(
      500,
      "Something went wrong while uploading cover Image"
    );
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        coverImage: coverImage.url,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image Updated Successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  // if the URL is /users/:username, and the request is made to /users/johndoe, then req.params.username will be "johndoe"
  const { username } = req.params;

  if (!username?.trim()) {
    throw new ApiError(400, "username is required");
  }
  const Channel = await User.aggregate([
    {
      // username : username?.toLowerCase()
      // first username refers the the username field in the mongoDB document
      // second username comes from const { username } = req.params;
      $match: {
        username: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscription", // The collection to join with
        localField: "_id", // field from the source collection

        // in foreignField i am collecting all the channels which have localField: "_id" that means i am collecting how many subscribers this id have
        foreignField: "channel", // field from the target (foreign) collection
        as: "subscribers", // name of the new array field where matching documents will be stored
      },
    },
    {
      $lookup: {
        from: "subscription",
        localField: "_id", // Field from the source collection
        foreignField: "subscribers", // Field from the target (foreign) collection
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        // The size operator is used to count the number of elements in an array.
        // $subscribers refers to the subscribers array field (which was likely created earlier using a lookup operation).
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        // determine whether a user is subscribed to a particular channel or not.
        isSubscribed: {
          $cond: {
            // req.user: This refers to the current authenticated user making the request.this means you are logged in and you can only subscribe in yt when you logged in
            // in the subscribers do we have a subscriber which have this id
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      // Project only the necessary data
      $project: {
        fullName: 1, // Include fullName
        username: 1,
        avatar: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  // the aggregate() method returns an array of documents as the result of the aggregation pipeline.
  if (!Channel?.length) {
    throw new ApiError(404, "Channel not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, Channel[0], "Channel Profile fetched succesfully")
    );
});

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        // MongoDB requires that the _id be of the ObjectId type.If req.user._id (user's ID) is a string (e.g., "60c72b2f9af1b2c5e2f9a19d"), you need to convert it to an ObjectId for MongoDB to properly match it.
        _id: new mongoose.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        // watchHistory is all the ids of the videos
        localField: "watchHistory",
        foreignField: "_id",
        as: "WatchHistory",
        // pipeline for owner of video
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              // this information only for the owner of the video
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            // useful in cases where you only need the first value from a list of values stored in an array
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0]?.watchHistory,
        "Watch History fetched successfully"
      )
    );
});

export {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory,
};
