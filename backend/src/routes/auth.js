// src/routes/auth.js
const express = require("express");
const passport = require("passport");
const bcrypt = require("bcryptjs");
const router = express.Router();
const User = require("../models/User");

// =================== GOOGLE AUTH ===================
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/auth/failure",
    successRedirect: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

// =================== FACEBOOK AUTH ===================
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/auth/failure",
    successRedirect: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

// =================== REGISTER (manual) ===================
router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const existing = await User.findOne({ email: username });
    if (existing)
      return res.status(400).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      provider: "local",
      providerId: username,
      name: username,
      email: username,
      password: hashed,
    });

    res
      .status(201)
      .json({ message: "Registration successful", user: { email: newUser.email } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// =================== LOGIN (manual) ===================
router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: "Username and password required" });

    const user = await User.findOne({ email: username }).select("+password");
    if (!user) return res.status(400).json({ error: "User not found" });

    // 🚨 Tambahkan pengecekan ini
    if (user.provider !== "local") {
      return res.status(400).json({
        error: `This account was created with ${user.provider}. Please login using ${user.provider} instead.`,
      });
    }

    if (!user.password) {
      return res
        .status(400)
        .json({ error: "This account does not have a password set." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid password" });

    req.login(user, (err) => {
      if (err) {
        console.error("Passport login error:", err);
        return res.status(500).json({ error: "Login failed" });
      }

      const safeUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
      };
      return res.json({ message: "Login successful", user: safeUser });
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});


// =================== SESSION OPTIONS (Remember me) ===================
router.post("/session-options", (req, res) => {
  const { remember } = req.body;
  try {
    if (remember) {
      // remember session 7 hari
      req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000;
      res.json({ message: "Remember me enabled for 7 days" });
    } else {
      // session berakhir ketika browser ditutup
      req.session.cookie.expires = false;
      res.json({ message: "Session will expire when browser closes" });
    }
  } catch (err) {
    console.error("Session option error:", err);
    res.status(500).json({ error: "Failed to update session settings" });
  }
});

// =================== GET CURRENT USER ===================
router.get("/me", (req, res) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    const { _id, name, email, avatar } = req.user;
    return res.json({ user: { _id, name, email, avatar } });
  }
  res.json({ user: null });
});

// =================== LOGOUT ===================
router.get("/logout", (req, res, next) => {
  try {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy(() => {
        res.clearCookie("connect.sid", { path: "/" });
        res.json({ message: "Logged out successfully" }); // ✅ JSON, bukan redirect
      });
    });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Logout failed" });
  }
});

// =================== FAILURE HANDLER ===================
router.get("/failure", (req, res) => {
  res.status(401).json({ error: "Authentication failed" });
});

module.exports = router;
