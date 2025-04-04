import User from "../models/User.js";
import nodemailer from "nodemailer";

export const loadHome = async (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const instantQuote = async (req, res) => {
    try {
      res.render("quote");
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  };


  export const sendQuote = async (req, res) => {
    try {
        const { name, contact, email, message} = req.body;
        const products = Array.isArray(req.body.products) ? req.body.products.join(', ') : req.body.products;

        // Handle uploaded files (both product images and logo)
        const logos = req.files?.logo ? req.files.logo.map(file => ({
            filename: file.originalname,
            path: file.path,
        })) : [];

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: 'ashidhagithub@gmail.com',
            subject: `New Quote Request from ${name} - ${new Date().toLocaleString()}`,
            html: `
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Contact:</strong> ${contact}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Products:</strong> ${products}</p>
                <p><strong>Message:</strong> ${message}</p>
            `,
            attachments: logos,
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'Quote submitted successfully!' });
    } catch (error) {
        console.error('Error sending quote:', error);
        res.status(500).json({ success: false, message: 'Error sending quote' });
    }
};
export const userLogin = async (req, res) => {
    try {
      res.render("userLogin");
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  };

export const userDashboard = async (req, res) => {
    try {
      res.render("userDashboard");
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).send("Internal Server Error");
    }
  };

  export const aboutUs = async (req, res) => {
    try {
      res.render("about");
    } catch (error) {
      res.status(500).send("Internal Server Error");
    }
  };