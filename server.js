const express = require("express");
const mongoose = require("mongoose");
const connectDB = require("./db.js")
const Appointment = require("./models/Appointment");  // Make sure the path is correct
const Application = require("./models/Application");
const nodemailer = require("nodemailer");
const multer = require("multer");
const path = require("path");
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const session = require("express-session");

// Load environment variables from .env file
dotenv.config();

const fs = require('fs');
const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


// Connect to MongoDB using the URI from .env file
connectDB(process.env.MONGODB_URI);



// Initialize Express app
const app = express();

// Add this middleware before your routes
app.use(
  session({
    secret: "BasketBall@8225@", // Replace with a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set secure: true if using HTTPS
  })
);

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");  // Prevent MIME type sniffing
  res.setHeader("X-Frame-Options", "SAMEORIGIN");      // Prevent clickjacking
  res.setHeader("Permissions-Policy", "interest-cohort=()");
  next();
});


app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  next();
});


// Create HTTP server and initialize WebSocket
const server = http.createServer(app);
const io = socketIo(server);


// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
    return next();
  } else {
    res.redirect('/login');
  }
}



// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));  // Set the views directory


// Middleware to parse incoming JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the "public" folder
app.use(express.static("public"));

//middleware
app.use(cors());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// Serve uploaded files

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});


// Serve the login.html file when someone visits the /login URL
app.get('/login', (_req, res) => {
  res.sendFile('login.html', { root: 'public' });
});


// Handle login form submission
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const predefinedUsername = 'admin'; // Replace with your username
  const predefinedPassword = 'password'; // Replace with your password

  if (username === predefinedUsername && password === predefinedPassword) {
    req.session.isAuthenticated = true;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Incorrect username or password' });
  }
});

// Render the dashboard with data
app.get('/admin-dashboard', isAuthenticated, async (req, res) => {
  try {
    const applications = await Application.find(); // Get all applications
    const appointments = await Appointment.find(); // Get all appointments

    res.render('admin-dashboard', { applications, appointments });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).send("Error loading dashboard.");
  }
});




  

// Create a reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  service: "gmail", // Use your SMTP service here (Gmail in this case)
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});



  // Multer Configuration (For File Uploads)
  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads'); // Save in the 'uploads' folder directly
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
  });
  
  
  


const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
  } else {
      cb(new Error('Only .pdf, .doc, and .docx files are allowed'), false);
  }
};


  const upload = multer({
    storage,
    fileFilter
  });
  


// Routes
app.post("/submit_application", upload.single("resume"), async (req, res) => {
  try {
    const { fullName, email, phone, position, experience, address } = req.body;

    // Check for duplicate email address in the database
    const existingApplication = await Application.findOne({ email: email });

    if (existingApplication) {
      return res.status(400).send("An application with this email already exists.");
    }

    // Save data to database
    const newApplication = new Application({
      fullName,
      email,
      phone,
      position,
      experience,
      aboutYourself: address,
      resume: req.file.filename, // Save only the file name
    });

    await newApplication.save();

    console.log("Uploaded resume path:", req.file.path); // Log the saved file path
    console.log("Saved resume path:", req.file.filename);

    const mailOptions = {
      from: ' "RMA Contractors" contractorsrma@gmail.com',
      to: email,  // Send to the applicant's email
      subject: "Your Application with RMA Contractors is Received",
      html: `
        <p>Dear ${fullName},</p>
        <p>Thank you for submitting your application for the <strong>${position}</strong> position at RMA Contractors.</p>
        <p>We have successfully received your application and are currently reviewing your details. Our team will get back to you shortly regarding the next steps in the recruitment process.</p>
        <p>If you have any questions or require further assistance, please do not hesitate to contact us at any time.</p>
        <p>Once again, Thank you for showing interest in joining our team. We appreciate the time and effort you’ve put into your application.</p>
        <p>Best regards,</p>
        <p>The RMA Contractors Team</p>
        <p>Phone: +91 99008 21959</p>
        <p>Email: contractorsrma@gmail.com</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).send("Failed to send confirmation email.");
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Send a success response to the frontend
    res.status(200).send("Application submitted successfully!");

  } catch (error) {
    console.error("Error saving application:", error);
    res.status(500).send("Failed to submit application. Please try again.");
  }
});



// Fetch all applications
app.get("/api/applications", async (req, res) => {
  try {
    const applications = await Application.find();
    res.json(applications);
  } catch (error) {
    res.status(500).send("Error fetching applications.");
  }
});

// Define route for handling appointment submissions
app.post("/api/appointments", async (req, res) => {
  try {
    const { name, email, mobile, service, date, time, message, extra_field } = req.body;

    // Honeypot validation
 if (extra_field) {
  return res.status(400).json({ error: "Spam submission detected." });
}

    // Check if an appointment already exists with the same email
    const existingAppointment = await Appointment.findOne({ email });
    if (existingAppointment) {
      return res.status(400).json({ error: "An appointment with this email already exists!" });
    }
    
    // Validate if a service was selected
    if (!service || service === "") {
      return res.status(400).json({ error: "Please select a service." });
    }

    // Create and save the appointment
    const newAppointment = new Appointment({
      name,
      email,
      mobile,
      service,
      date,
      time,
      message,
    });

    await newAppointment.save();
    

//     // Emit socket event for new message
//     // In the /api/appointments route
// io.emit('newMessage', { email: newAppointment.email }); // Emit the event with the appointment email


    // Send a confirmation email to the user using Nodemailer
    let mailOptions = {
      from: ' "RMA Contractors" contractorsrma@gmail.com',
      to: email,
      subject: 'Your Appointment with RMA Contractors is Confirmed!',
      html: `
        <p>Dear ${name},</p>
        <p>Thank you for choosing RMA Contractors! We are excited to connect with you and discuss your upcoming project.</p>
        <p>We’ve successfully received your appointment request, and our team is currently reviewing the details. Below is a summary of your appointment:
</p>
        <ul>
          <li><strong>Service:</strong> ${service}</li>
          <li><strong>Date:</strong> ${date}</li>
        </ul>
        <p>Our team will reach out to you to confirm the time and date that works best for you. If you have any additional information, requests, or documents related to your project, please feel free to reply to this email.</p>
        <p>We greatly appreciate the opportunity to work with you and look forward to bringing your vision to life.</p>
        <br>
        <p>Best regards,</p>
        <p>The RMA Contractors Team</p>
        <p>Phone: +91 99008 21959</p>
        <p>Email: contractorsrma@gmail.com</p>
      `,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ error: "Failed to send confirmation email." });
      } else {
        console.log('Email sent:', info.response);
      }
    });

    // Send success response to frontend
    res.status(201).json({ message: "Appointment booked successfully!" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to book appointment." });
  }
});


// Fetch all appointments
app.get("/api/appointments", async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.json(appointments);
  } catch (error) {
    res.status(500).send("Error fetching appointments.");
  }
});


// Route to view the resume
app.get('/view-resume/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  const filePath = path.join(__dirname, 'uploads', fileName); 


  console.log("Attempting to access file:", filePath);

  // Check if the file exists before sending
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send("File not found");
  }
});


app.post("/applications/approve/:id", async (req, res) => {
  const { id } = req.params;
  const { email, name } = req.body;

  try {
    // Update application status
    await Application.findByIdAndUpdate(id, { status: "approved" });

    // Send email notification
    const mailOptions = {
      from: '"RMA Contractors" <contractorsrma@gmail.com>',
      to: email,
      subject: "Application Approved",
      text: `Dear ${name},\n\nCongratulations! Your application has been approved.\n\nBest regards,\nTeam RMA Contractors`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Failed to send notification email.");
      }
      console.log("Email sent:", info.response);
      res.status(200).send("Application approved and notification sent.");
    });
  } catch (error) {
    console.error("Error approving application:", error);
    res.status(500).send("Error approving application.");
  }
});

app.post("/api/notify", async (req, res) => {
  const { email, action } = req.body;

  if (!email) {
    console.error("Email not provided in request");
    return res.status(400).send("Email is required.");
  }

  try {
    const subject = action === "approve" ? "Application Approved" : "Application Rejected";
    const message = action === "approve"
      ? "Congratulations! Your application has been approved."
      : "We regret to inform you that your application has been rejected.";

    const mailOptions = {
      from: '"RMA Contractors" <pavankalyan.yes@gmail.com>',
      to: email,
      subject,
      text: message,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return res.status(500).send("Failed to send email.");
      }
      console.log("Email sent:", info.response);
      res.status(200).send("Notification email sent.");
    });
  } catch (error) {
    console.error("Error handling notification:", error);
    res.status(500).send("Failed to handle notification.");
  }
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.redirect('/admin-dashboard'); // Redirect back if session destruction fails
    }
    res.clearCookie('connect.sid'); // Clear the session cookie
    res.redirect('/login'); // Redirect to login page
  });
});


app.get('/contact', (req,res) =>{
  res.sendFile('contact.html', { root: 'public' });
})

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
