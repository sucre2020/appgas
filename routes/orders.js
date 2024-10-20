const express = require("express");
const router = express.Router();
const Order = require("../models/Order");
const Seller = require("../models/Seller");
const User = require("../models/User");

// Middleware to pass user data to all views
router.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Route to place an order
router.post("/place", async (req, res) => {
  const {
    userId,
    sellerId,
    quantityKg,
    deliveryAddress,
    deliveryStreet,
    deliveryCity,
    deliveryState,
    userPhoneNumber,
  } = req.body;

  try {
    // Ensure all required fields are present
    if (
      !userId ||
      !sellerId ||
      !quantityKg ||
      !deliveryAddress ||
      !deliveryStreet ||
      !deliveryCity ||
      !deliveryState ||
      !userPhoneNumber
    ) {
      return res.status(400).send("Missing required fields");
    }

    // Find the seller by ID
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).send("Seller not found");

    // Calculate the total price based on seller's price per Kg
    const totalPrice = seller.pricePerKg * quantityKg;

    // Create a new order
    const newOrder = new Order({
      user: userId, // Assuming `userId` is being passed in the request
      seller: sellerId,
      quantityKg,
      totalPrice,
      deliveryAddress,
      deliveryStreet,
      deliveryCity,
      deliveryState,
      userPhoneNumber,
    });

    // Save the new order
    await newOrder.save();

    // Redirect to the order details page after successfully placing the order
    res.redirect(`/orders/${newOrder._id}`);
  } catch (err) {
    console.error("Error placing order:", err); // Log the error for debugging
    res.status(500).send("Server Error");
  }
});

// Route to view a specific order
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user")
      .populate("seller");
    if (!order) return res.status(404).send("Order not found");
    res.render("order-details", { order });
  } catch (err) {
    console.error("Error fetching order:", err); // Log the error for debugging
    res.status(500).send("Server Error");
  }
});

// Route to list all orders for a user
router.get("/", async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).send("Unauthorized");
    }

    const orders = await Order.find({ user: req.user._id }).populate("seller");
    res.render("order-history", { orders });
  } catch (err) {
    console.error("Error fetching orders:", err); // Log the error for debugging
    res.status(500).send("Server Error");
  }
});

module.exports = router;
