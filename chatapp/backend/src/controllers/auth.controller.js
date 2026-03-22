import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../../lib/utils.js";
import cloudinary from "../../lib/cloudinary.js";
import { lastlogin } from "../../lib/socket.js";
export const signup = async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    generateToken(newUser._id, res);
    let lastseen  = lastlogin(newUser._id);
    res.status(201).json({
      success: true,
      user: {
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
        lastseen : lastseen,
      },
    });
  } catch (error) {
    console.log("Signup error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Fill all entries",
      });
    }

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({
        success: false,
        message: "Invalid credentials",
      });

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect)
      return res.status(400).json({
        success: false,
        message: "Incorrect password",
      });

    generateToken(user._id, res);
let lastseen = lastlogin(user._id);
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        lastseen  : lastseen,
      },
    });
  } catch (error) {
    console.log("Login error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Logour
export const logout = async (req, res) => {
  try {

    const lastSeen = Date.now();

    await User.findByIdAndUpdate(
      req.user._id,
      { lastSeen: lastSeen }
    );

    res.clearCookie("jwt");

    res.status(200).json({
      success: true,
      lastSeen,
      message: "Logged out successfully"
    });

  } catch (error) {

    console.log("Logout error:", error);

    res.status(500).json({
      message: "Internal server error"
    });

  }
};
 export const updateProfile = async (req, res) => {
  try {
    const { profilePic } = req.body;
    const userId = req.user._id;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile pic is required" });
    }

    const uploadResponse = await cloudinary.uploader.upload(profilePic);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic: uploadResponse.secure_url },
      { new: true }
    );
  let lastseen = lastlogin(userId);
    res.status(200).json({
      success: true,
      user: {
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        profilePic: updatedUser.profilePic,
  lastseen
      },
    });
  } catch (error) {
    console.log("Update profile error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Check Auth
export const checkAuth = async (req, res) => {
  try {
    const user = req.user;
  
    if (!user)
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
 let lastseen = lastlogin(user._id);
 console.log(lastseen);
 console.log(lastseen);
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        profilePic: user.profilePic,
        lastseen
      },
    });
  } catch (error) {
    console.log("CheckAuth error:", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
};
