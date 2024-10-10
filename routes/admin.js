const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const Seller = require("../models/Seller");
const Order = require("../models/Order");
const User = require("../models/User");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");
const ensureAdmin = require("../middleware/ensureAuthenticated");

// Admin route to view and manage sellers, users, and orders
router.get("/dashboard", ensureAuthenticated, ensureAdmin, async (req, res) => {
  try {
    const sellers = await Seller.find();
    const users = await User.find();
    const orders = await Order.find()
      .populate("seller")
      .populate("user")
      .populate("seller") // Populate the seller
      .populate("user"); // Populate the user
    res.render("admin-dashboard", { sellers, users, orders, user: req.user }); // pass req.user to the view
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Route to add a new user
router.post("/add-user", ensureAuthenticated, ensureAdmin, async (req, res) => {
  const { name, email, password, isAdmin } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      isAdmin,
    });
    await newUser.save();
    res.redirect("/admin/dashboard");
  } catch (err) {
    res.status(500).send("Error adding user");
  }
});

// Route to edit a user
router.post(
  "/edit-user/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    const { name, email, password, isAdmin } = req.body;
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).send("User not found");

      if (password) {
        user.password = await bcrypt.hash(password, 10);
      }
      user.name = name;
      user.email = email;
      user.isAdmin = isAdmin;
      await user.save();
      res.redirect("/admin/dashboard");
    } catch (err) {
      res.status(500).send("Error editing user");
    }
  }
);

// Route to delete a user
router.post(
  "/delete-user/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await User.findByIdAndDelete(req.params.id);
      res.redirect("/admin/dashboard");
    } catch (err) {
      res.status(500).send("Error deleting user");
    }
  }
);

// Route to add a new seller
// GET route to render the 'Add Seller' form
router.get("/add-seller", ensureAuthenticated, ensureAdmin, (req, res) => {
  res.render("admin-add-seller", { user: req.user });
});

// POST route to handle form submission and add a new seller
router.post(
  "/add-seller",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    const {
      name,
      pricePerKg,
      location,
      rating,
      deliveryTime,
      emailAddress,
      phoneNumber,
    } = req.body;

    try {
      const newSeller = new Seller({
        name,
        pricePerKg,
        location,
        rating,
        deliveryTime,
        emailAddress,
        phoneNumber,
      });

      await newSeller.save();
      res.redirect("/admin/dashboard"); // Redirect to the admin dashboard after adding a seller
    } catch (err) {
      console.error("Error adding seller:", err);
      res.status(500).send("Error adding seller");
    }
  }
);

// Route to edit a seller
router.post(
  "/edit-seller/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    const { name, location, pricePerKg, phoneNumber, emailAddress } = req.body;
    try {
      const seller = await Seller.findById(req.params.id);
      if (!seller) return res.status(404).send("Seller not found");

      seller.name = name;
      seller.location = location;
      seller.pricePerKg = pricePerKg;
      seller.phoneNumber = phoneNumber;
      seller.emailAddress = emailAddress;
      await seller.save();
      res.redirect("/admin/dashboard");
    } catch (err) {
      res.status(500).send("Error editing seller");
    }
  }
);

// Route to delete a seller
router.post(
  "/delete-seller/:id",
  ensureAuthenticated,
  ensureAdmin,
  async (req, res) => {
    try {
      await Seller.findByIdAndDelete(req.params.id);
      res.redirect("/admin/dashboard");
    } catch (err) {
      res.status(500).send("Error deleting seller");
    }
  }
);

module.exports = router;
