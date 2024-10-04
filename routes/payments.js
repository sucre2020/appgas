const express = require("express");
const router = express.Router();
const Flutterwave = require("flutterwave-node-v3");

const flw = new Flutterwave("your-public-key", "your-secret-key");

router.post("/pay", async (req, res) => {
  const { email, amount, orderId } = req.body;

  try {
    const payment = await flw.Payment.initiate({
      tx_ref: orderId,
      amount: amount,
      currency: "NGN",
      redirect_url: "http://localhost:3000/payments/verify",
      customer: {
        email: email,
      },
    });

    if (payment.status === "success") {
      res.redirect(payment.meta.authorization.redirect);
    } else {
      res.status(500).send("Payment initiation failed");
    }
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

router.get("/verify", async (req, res) => {
  const transaction_id = req.query.transaction_id;

  try {
    const response = await flw.Transaction.verify({ id: transaction_id });
    if (response.status === "success") {
      // Update order payment status in the database
      res.render("payment-success", { payment: response.data });
    } else {
      res.render("payment-failed");
    }
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
