const express = require("express");
const router = express.Router();
const passport = require("passport");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Seller = require("../models/Seller"); // Import Seller model

// Register route
router.get("/register", (req, res) => {
  res.render("register", { user: req.user || null }); // Pass user to view
});

router.post("/register", async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
    });
    await newUser.save();
    res.redirect("/auth/login");
  } catch (error) {
    res.redirect("/auth/register");
  }
});

// Login route
router.get("/login", (req, res) => {
  res.render("login", { user: req.user || null }); // Pass user to view
});

// Handle login form submission
router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard", // Redirect to dashboard on success
    failureRedirect: "/auth/login", // Redirect back to login on failure
    failureFlash: true, // Enable error messages
  })
);

// Logout route
router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err); // Handle the error
    }
    res.redirect("/auth/login"); // Redirect to login page after logout
  });
});

// Register seller route
router.get("/register-seller", (req, res) => {
  res.render("register-seller", { user: req.user || null }); // Pass user to view
});

router.post("/register-seller", async (req, res) => {
  const { name, location, pricePerKg, phoneNumber, emailAddress } = req.body;

  try {
    const newSeller = new Seller({
      name,
      location,
      pricePerKg,
      phoneNumber,
      emailAddress,
    });
    await newSeller.save();
    res.redirect("/sellers"); // Redirect to sellers list after registration
  } catch (error) {
    res.status(500).send("Error registering seller");
  }
});

module.exports = router;
