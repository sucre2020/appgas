const express = require("express");
const router = express.Router();
const ensureAuthenticated = require("../middleware/ensureAuthenticated"); //ensure user is logged in

//Get /profile route
router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { user: req.user }); //pass user info to the view
});

module.exports = router;
