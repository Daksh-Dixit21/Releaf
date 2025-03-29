const nodemailer = require("nodemailer");
const User = require("../models/User");

exports.sendSOS = async (req, res) => {
  const { name, city, state, phone, message } = req.body;

  if (!name || !city || !state || !phone || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const users = await User.find({}, "email");
    let recipientEmails = users.map(user => user.email).filter(email => email);

    recipientEmails.push("dchrono93@gmail.com");
    recipientEmails.join(',');
    if (recipientEmails.length === 0) {
      return res.status(400).json({ error: "No recipients found to send the SOS email." });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Set in .env
        pass: process.env.EMAIL_PASS, // Use an App Password instead of your actual password
      },
    });

    // HTML email template
    const emailHTML = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h3 style="color: #d9534f;">🚨 SOS Alert! Urgent Help Needed 🚨</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Location:</strong> ${city}, ${state}</p>
        <p><strong>Contact:</strong> <a href="tel:${phone}">${phone}</a></p>
        <p><strong>Message:</strong></p>
        <blockquote style="border-left: 4px solid #d9534f; padding-left: 10px; color: #555;">
          ${message}
        </blockquote>
        <p style="color: #d9534f;"><strong>Please respond if you can assist.</strong></p>
        <hr>
        <p style="font-size: 12px; color: #777;">This is an automated SOS request from Re-Leaf Link.</p>
      </div>
    `;

    // Email options
    const mailOptions = {
      from: `"Re-Leaf Link SOS" <${process.env.EMAIL_USER}>`,
      to: recipientEmails.join(","), // Convert array to string
      subject: "🚨 Urgent SOS Alert - Assistance Required",
      html: emailHTML,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Success response
    res.json({ success: "✅ SOS sent successfully to all users!" });

  } catch (error) {
    console.error("❌ Error sending SOS email:", error);
    res.status(500).json({ error: "Failed to send SOS email. Please try again later." });
  }
};