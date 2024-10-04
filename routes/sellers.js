const express = require("express");
const router = express.Router();
const Seller = require("../models/Seller");
const ensureAuthenticated = require("../middleware/ensureAuthenticated");

// Route to list all sellers
router.get("/", ensureAuthenticated, async (req, res) => {
  try {
    const sellers = await Seller.find();
    res.render("sellers", { sellers, user: req.user }); // Pass user object
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

// Route to get a specific seller by ID
router.get("/:id", ensureAuthenticated, async (req, res) => {
  try {
    const seller = await Seller.findById(req.params.id);
    if (!seller) return res.status(404).send("Seller not found");
    res.render("seller-details", { seller, user: req.user }); // Pass user object
  } catch (err) {
    res.status(500).send("Server Error");
  }
});

module.exports = router;
