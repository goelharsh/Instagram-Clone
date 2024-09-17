import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import getDataUri from "../utils/dataUri.js";
import cloudinary from "../utils/cloudinary.js";

export const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if ((!username, !email, !password)) {
      return res.status(401).json({
        message: "Please enter required fields",
        success: false,
      });
    }
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(401).json({
        message: "Email already exists, please login...",
        success: false,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });
    return res.status(200).json({
      message: "User registered successfully",
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if ((!email, !password)) {
      return res.status(401).json({
        message: "Please enter required fields",
        success: false,
      });
    }
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: "User does not exist",
        success: false,
      });
    }
    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Incorrect email or password0",
        success: false,
      });
    }
    const payload = {
      userId: user._id,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });

    user = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePicture: user.profilePicture,
      bio: user.bio,
      followers: user.followers,
      following: user.following,
      posts: user.posts,
    };

    return res
      .cookie("token", token, {
        httpOnly: true,
        sameSite: "strict",
        maxAge: 1 * 24 * 60 * 60 * 1000,
      })
      .json({
        message: `Welcome back ${user.username}`,
        success: true,
        user,
      });
  } catch (error) {
    console.log(error);
  }
};

export const logout = async (req, res) => {
  try {
    return res.cookie("token", "", { maxAge: 0 }).json({
      message: "Logout successfully",
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getProfile = async (req, res) => {
  try {
    // in instagram we can open any user profile as well as our profile
    const userId = req.params.id;
    let user = await User.findById(userId).select("-password");
    console.log(user);
    return res.status(200).json({
      message: "User fetched successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const editProfile = async (req, res) => {
  try {
    // we can update profile of only logged in user
    // token is present in cookie, so token will be get from that cookie, as there is userid in token, now to decode the token we will make the middleware

    const userId = req.id;
    const { bio, gender } = req.body;
    const profilePicture = req.file;
    let cloudResponse;
    if (profilePicture) {
      const fileUri = getDataUri(profilePicture);
      cloudResponse = await cloudinary.uploader.upload(fileUri);
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    if (bio) user.bio = bio;
    if (gender) user.gender = gender;
    if (profilePicture) user.profilePicture = cloudResponse.secure_url;

    await user.save();
    return res.status(200).json({
      message: "Profile updated successfully",
      user,
      success: true,
    });
  } catch (error) {
    console.log(error);
  }
};

export const getSuggestedUsers = async (req, res) => {
  try {
    const suggestedUsers = await User.find({ _id: { $ne: req.id } }).select(
      "-password"
    );
    if (!suggestedUsers) {
      return res.status(404).json({
        message: "No suggested users found",
        success: false,
      });
    }
    return res.status(200).json({
      message: "Suggested users found",
      success: true,
      suggestedUsers,
    });
  } catch (error) {
    console.log(error);
  }
};

export const followOrUnfollow = async (req, res) => {
  try {
    // logged in user id
    const followKrneWala = req.id;
    // user who has to be followed
    const jiskoFollowKrnaHai = req.params.id;
    if (followKrneWala === jiskoFollowKrnaHai) {
      return res.status(404).json({
        message: "You cannot follow or unfollow yourself",
        success: false,
      });
    }

    // check whether user present in database or not 
    const user = await User.findById(followKrneWala);
    const targetUser = await User.findById(jiskoFollowKrnaHai);

    if (!user || !targetUser) {
      return res.status(404).json({
        message: "User not found",
        success: false,
      });
    }

    // checking if user has to be followed or unfollowed
    // if it is found, then it measn pehle hi follow kra hua hai , there fore we have to unfollow the user

    // there for me check krunga ki follow krna hai ya unfollow 
    const isFollowing = user.following.includes(jiskoFollowKrnaHai);
    if (isFollowing) {
      // then unfollow the user
      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $push: { following: jiskoFollowKrnaHai } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrnaHai },
          { $pull: { followers: followKrneWala } }
        ),
      ]);
      return res.status(200).json({
        message:"User unfollowed",
        success: true
      })
    } else {
      await Promise.all([
        User.updateOne(
          { _id: followKrneWala },
          { $push: { following: jiskoFollowKrnaHai } }
        ),
        User.updateOne(
          { _id: jiskoFollowKrnaHai },
          { $push: { followers: followKrneWala } }
        ),
      ]);
      return res.status(200).json({
        message:"User followed",
        success: true
      })
    }
  } catch (error) {
    console.log(error);
  }
};
