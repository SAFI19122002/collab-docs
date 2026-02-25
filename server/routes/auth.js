const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

/* 🔐 Register */
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  console.log("Register request:", email);

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  console.log("Existing user:", existing);

  if (existing) return res.status(400).json({ msg: "User exists" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashed,
  });

  res.json({ msg: "User created" });
});

/* 🔐 Login */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ msg: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ msg: "Invalid credentials" });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.json({
    token,
    user: { id: user._id, name: user.name, email: user.email },
  });
});

module.exports = router;
