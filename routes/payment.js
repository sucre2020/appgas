// routes/payment.js
const express = require("express");
const router = express.Router();
const Flutterwave = require("flutterwave-node-v3");
const Order = require("../models/Order");

// Initialize Flutterwave with your keys
const flw = new Flutterwave("your-public-key", "your-secret-key");

// Route to initiate payment for an order
router.post("/pay/:orderId", async (req, res) => {
  const orderId = req.params.orderId;

  try {
    // Fetch the order and populate the user details
    const order = await Order.findById(orderId).populate("user");
    if (!order) {
      return res.status(404).send("Order not found");
    }

    if (order.paymentStatus === "Completed") {
      return res.status(400).send("Order already paid");
    }

    // Initiate payment with Flutterwave
    const payment = await flw.Payment.initiate({
      tx_ref: `${orderId}-${Date.now()}`, // Unique transaction reference
      amount: order.totalPrice,
      currency: "NGN",
      redirect_url: "http://localhost:3000/payment/verify",
      customer: {
        email: order.user.email,
        phone_number: order.user.phoneNumber, // Ensure user has phoneNumber
        name: order.user.name,
      },
    });

    if (payment.status === "success") {
      res.redirect(payment.meta.authorization.redirect);
    } else {
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
    // Verify the transaction with Flutterwave
    const response = await flw.Transaction.verify({ id: transaction_id });

    if (response.status === "success") {
      // Extract order ID from tx_ref
      const [orderId] = response.data.tx_ref.split("-");

      // Update the order's payment status
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send("Order not found");
      }

      order.paymentStatus = "Completed";
      await order.save();

      res.render("payment-success", { order });
    } else {
      res.render("payment-failed");
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
