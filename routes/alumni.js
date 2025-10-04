const express = require("express");
const router = express.Router();
const Alumnus = require("../models/Alumnus");
const { auth } = require("../middleware/auth");

// @route   GET api/alumni
// @desc    Get all verified alumni
// @access  Private
router.get("/", auth, async (req, res) => {
  try {
    const alumni = await Alumnus.find({ isVerified: true })
      .select("-password")
      .sort({ name: 1 });
    res.json(alumni);
  } catch (err) {
    res.status(500).send("Server Error");
  }
});
// @route   GET api/alumni/:id
// @desc    Get a single alumnus profile by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const alumnus = await Alumnus.findById(req.params.id).select('-password');
        if (!alumnus) {
            return res.status(404).json({ msg: 'Alumnus not found' });
        }
        res.json(alumnus);
    } catch (err) {
        console.error(err.message);
        // If the ID is not a valid ObjectId, it will throw an error
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Alumnus not found' });
        }
        res.status(500).send('Server Error');
    }
});

module.exports = router;
