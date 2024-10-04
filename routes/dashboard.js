const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middleware/ensureAuthenticated"); // middleware to ensure the user is logged in

// Dashboard route
router.get("/dashboard", ensureAuthenticated, (req, res) => {
  res.render("dashboard", { user: req.user }); // Render the dashboard view and pass user data
});

module.exports = router;
