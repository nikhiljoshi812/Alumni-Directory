const express = require("express");
const router = express.Router();
const Alumnus = require("../models/Alumnus");
const { auth, adminAuth } = require("../middleware/auth");

// @route   GET api/admin/pending
// @desc    Get all unverified alumni
// @access  Private (Admin only)
router.get("/pending", [auth, adminAuth], async (req, res) => {
  try {
    const pendingAlumni = await Alumnus.find({ isVerified: false }).select(
      "-password"
    );
    res.json(pendingAlumni);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route   PUT api/admin/approve/:id
// @desc    Approve an alumnus
// @access  Private (Admin only)
router.put("/approve/:id", [auth, adminAuth], async (req, res) => {
  try {
    const alumnus = await Alumnus.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    );
    if (!alumnus) {
      return res.status(404).json({ msg: "Alumnus not found" });
    }
    res.json({ msg: "Alumnus approved successfully" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/admin/reject/:id
// @desc    Reject (delete) an alumnus registration
// @access  Private (Admin only)
router.delete("/reject/:id", [auth, adminAuth], async (req, res) => {
  try {
    const alumnus = await Alumnus.findByIdAndDelete(req.params.id);
    if (!alumnus) {
      return res.status(404).json({ msg: "Alumnus not found" });
    }
    res.json({ msg: "Alumnus registration rejected" });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
