import { catchAsync } from "../utils/catchAsync.js";
import User from "../models/user.model.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { mapAuthUser } from "../mappers/userMapper.js";

const signTokenAndSendCookie = (user, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };
  res.cookie("jwt", token, cookieOptions);
  return token;
};

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    return res.status(400).json({ message: "Invalid email or password" });
  }

  const token = signTokenAndSendCookie(user, res);
  res.status(200).json({
    status: "success",
    message: "Login successful",
    token,
    user: mapAuthUser(user),
  });
});

export const register = catchAsync(async (req, res, next) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = new User({ name, email, password });
  await newUser.save();

  const token = signTokenAndSendCookie(newUser, res);
  res.status(201).json({
    status: "success",
    message: "User registered successfully",
    user: mapAuthUser(newUser),
    token,
  });
});
