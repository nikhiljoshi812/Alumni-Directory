// models/PrivateMessage.js
const mongoose = require("mongoose");

const privateMessageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Alumnus",
    required: true,
  },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "Alumnus", required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("PrivateMessage", privateMessageSchema);
