// routes/payment.js
const express = require("express");
const router = express.Router();
const Flutterwave = require("flutterwave-node-v3");
const Order = require("../models/Order");
const User = require("../models/User"); // Ensure User model is imported if needed
const ensureAuthenticated = require("../middleware/ensureAuthenticated");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

// Initialize Flutterwave with keys from environment variables for security
const flw = new Flutterwave(
  process.env.FLUTTERWAVE_PUBLIC_KEY,
  process.env.FLUTTERWAVE_SECRET_KEY,
  process.env.FLUTTERWAVE_ENCRYPTION_KEY // Added Encryption Key
);

// Debugging: Check if flw and flw.Charge are defined
console.log("Flutterwave Instance:", flw);
console.log("Flutterwave Charge Object:", flw.Charge); // Should now be defined

// Route to initiate payment for an order
router.post("/pay/:orderId", ensureAuthenticated, async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Fetch the order and populate the user details
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      console.error(`Order not found: ${orderId}`);
      return res.status(404).send("Order not found");
    }

    if (order.paymentStatus === "Completed") {
      console.warn(`Payment already completed for order: ${orderId}`);
      return res.status(400).send("Order already paid");
    }

    // Ensure user has a phone number
    if (!order.user.phoneNumber) {
      console.error(`User ${order.user._id} does not have a phoneNumber`);
      return res.status(400).send("User phone number is missing");
    }

    // Initiate payment with Flutterwave using Charge.card
    const payment = await flw.Charge.card({
      tx_ref: `${orderId}-${Date.now()}`, // Unique transaction reference
      amount: order.totalPrice,
      currency: "NGN",
      redirect_url: "http://localhost:3000/payment/verify",
      customer: {
        email: order.user.email,
        phone_number: order.user.phoneNumber, // Use consistent field name
        name: order.user.name,
      },
      // Optional: metadata ETC
      meta: {
        order_id: orderId,
      },
    });

    if (payment.status === "success") {
      console.log(`Payment initiated for order: ${orderId}`);
      res.redirect(payment.meta.authorization.redirect); // Redirect to Flutterwave's payment page
    } else {
      console.error(`Payment initiation failed for order: ${orderId}`, payment);
      res.status(500).send("Payment initiation failed");
    }
  } catch (err) {
    console.error("Error initiating payment:", err);
    res.status(500).send("Server Error");
  }
});

// Route to verify payment after redirection
router.get("/verify", async (req, res) => {
  const transaction_id = req.query.transaction_id;

  try {
    if (!transaction_id) {
      console.error("No transaction_id provided in verification");
      return res.status(400).send("Invalid transaction reference");
    }

    // Verify the transaction with Flutterwave
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.status === "success") {
      // Extract order ID from tx_ref
      const [orderId] = response.data.tx_ref.split("-");

      // Update the order's payment status
      const order = await Order.findById(orderId).populate("user");
      if (!order) {
        console.error(`Order not found during verification: ${orderId}`);
        return res.status(404).send("Order not found");
      }

      order.paymentStatus = "Completed";
      await order.save();

      console.log(`Payment completed for order: ${orderId}`);
      res.render("payment-success", { order });
    } else {
      console.warn(`Payment verification failed: ${response.message}`);
      res.render("payment-failed");
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
