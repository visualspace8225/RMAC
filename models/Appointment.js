const mongoose = require("mongoose");
const { Schema } = mongoose;

// Define schema for appointments
const appointmentSchema = new Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      trim: true 
    },
    mobile: { 
      type: String, 
      required: true, 
      trim: true 
    },
    service: { 
      type: String, 
      required: true, 
      trim: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    // time: { 
    //   type: String, 
    //   required: true 
    // }, // Can be refined as needed
    message: { 
      type: String, 
      trim: true 
    },
  },
  { timestamps: true }
);

const Appointment = mongoose.model("Appointment", appointmentSchema);

module.exports = Appointment;
