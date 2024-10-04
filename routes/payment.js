const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// Route to process payment for an order
router.post("/pay/:orderId", async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).send("Order not found");

    // Process payment logic here (e.g., connect to payment gateway)
    // For now, we'll assume payment is always successful.

    order.paymentStatus = "Completed";
    await order.save();

    res.render("payment-success", { order });
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
