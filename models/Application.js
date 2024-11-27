const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    fullName: { 
        type: String, 
        required: true 
    },
    email: { 
        type: String, 
        required: true 
    },
    phone: { 
        type: String, 
        required: true 
    },
    position: { 
        type: String, 
        required: true 
    },
    experience: { 
        type: Number, 
        required: true },
    aboutYourself: { 
        type: String, 
        required: true 
    },
    resume: { 
        type: String, 
        required: true 
    }, // Stores file path
    status: { type: String, default: "pending" }, // pending, approved, rejected
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);
