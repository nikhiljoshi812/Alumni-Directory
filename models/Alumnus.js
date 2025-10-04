const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const AlumnusSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  graduationYear: { type: Number, required: true },
  branch: { type: String, required: true },
  currentCompany: { type: String, default: "Not updated" },
  role: { type: String, enum: ["alumni", "admin"], default: "alumni" },
  isVerified: { type: Boolean, default: false },
  registrationDate: { type: Date, default: Date.now },
});

// Password save hone se pehle use hash karne ka code
AlumnusSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

module.exports = mongoose.model("Alumnus", AlumnusSchema);
