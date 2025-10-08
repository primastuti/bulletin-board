// src/models/User.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    // Jenis provider: local (manual), google, facebook
    provider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    // ID unik dari provider sosial
    providerId: {
      type: String,
      index: true,
    },

    // Nama pengguna
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // Email — bisa kosong untuk akun sosial
    email: {
      type: String,
      unique: true,
      sparse: true, // mencegah duplicate error untuk akun tanpa email
      trim: true,
      lowercase: true,
    },

    // Avatar URL (foto profil)
    avatar: {
      type: String,
      default: "",
    },

    // Password hanya untuk akun "local"
    password: {
      type: String,
      select: false, // tidak dikirim ke client
    },
  },
  {
    timestamps: true, // otomatis menambahkan createdAt dan updatedAt
  }
);

// Index tambahan untuk mempercepat pencarian login sosial
UserSchema.index({ provider: 1, providerId: 1 });

// Export model
module.exports = mongoose.model("User", UserSchema);
