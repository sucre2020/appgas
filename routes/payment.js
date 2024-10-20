const express = require("express");
const router = express.Router();
const axios = require("axios");
const Order = require("../models/Order");
const User = require("../models/User");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");
const dotenv = require("dotenv");

// Load environment variables from .env file
dotenv.config();

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

    // Initiate payment with Paystack
    const paymentData = {
      email: order.user.email,
      amount: order.totalPrice * 100, // Paystack requires amount in kobo (NGN)
      reference: `${orderId}-${Date.now()}`, // Unique transaction reference
      // callback_url: `http://localhost:3000/payment/verify?orderId=${orderId}`,
      callback_url: `${process.env.BASE_URL}/payment/verify?orderId=${orderId}`,
      metadata: {
        order_id: orderId,
        custom_fields: [
          {
            display_name: "Phone Number",
            variable_name: "phone_number",
            value: order.user.phoneNumber,
          },
        ],
      },
    };

    // Make the API call to Paystack to initiate the payment
    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      paymentData,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { data } = response;

    // Check if the payment initiation was successful (from Paystack's data object)
    if (data.status) {
      console.log(`Payment initiated successfully for order: ${orderId}`);
      console.log(`Redirecting to: ${data.data.authorization_url}`);

      // Use res.setHeader to force the redirect
      res.setHeader("Location", data.data.authorization_url);
      res.status(302).end(); // End the response with a redirect (302 Found)
    } else {
      console.error(`Payment initiation failed for order: ${orderId}`, data);
      res.status(500).send("Payment initiation failed");
    }
  } catch (err) {
    console.error("Error initiating payment:", err);
    res.status(500).send("Server Error");
  }
});

// Route to verify payment after redirection
router.get("/verify", async (req, res) => {
  const { reference, orderId } = req.query;

  try {
    if (!reference) {
      console.error("No reference provided in verification");
      return res.status(400).send("Invalid transaction reference");
    }

    // Verify the transaction with Paystack
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const { status, data } = response;

    if (status === 200 && data.status === true) {
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
      console.warn(`Payment verification failed: ${data.message}`);
      res.render("payment-failed");
    }
  } catch (err) {
    console.error("Error verifying payment:", err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
