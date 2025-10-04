const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Alumnus = require("../models/Alumnus");

// @route   POST api/auth/register
// @desc    Register a new alumnus
router.post("/register", async (req, res) => {
  const { name, email, password, graduationYear, branch, currentCompany } =
    req.body;

  try {
    let alumnus = await Alumnus.findOne({ email });
    if (alumnus) {
      return res.status(400).json({ msg: "User already exists" });
    }

    alumnus = new Alumnus({
      name,
      email,
      password,
      graduationYear,
      branch,
      currentCompany,
    });

    await alumnus.save();
    res
      .status(201)
      .json({
        msg: "Registration successful! Please wait for admin approval.",
      });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// @route   POST api/auth/login
// @desc    Authenticate alumnus & get token
router.post("/login", async (req, res) => {
    console.log("--- LOGIN ROUTE HIT ---");
  const { email, password } = req.body;

  try {
    let alumnus = await Alumnus.findOne({ email });
    if (!alumnus) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    const isMatch = await bcrypt.compare(password, alumnus.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Credentials" });
    }

    if (!alumnus.isVerified) {
      return res
        .status(401)
        .json({ msg: "Account not verified by admin yet." });
    }

    const payload = {
      user: { id: alumnus.id, role: alumnus.role },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) {
          console.error("JWT SIGN ERROR:", err); // Error ko aache se print karega
          return res.status(500).send("Server Error"); // Server crash nahi hoga
        }
        res.json({ token, role: alumnus.role });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});
const { auth } = require("../middleware/auth");

// @route   GET api/auth/me
// @desc    Get the logged-in user's data
// @access  Private
router.get("/me", auth, async (req, res) => {
  try {
    // req.user is set by the auth middleware
    const user = await Alumnus.findById(req.user.id).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
