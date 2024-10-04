module.exports = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/auth/login"); // Redirect to login page if not authenticated
};

function ensureAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.redirect("/login"); // Redirect to login page if not admin
}

module.exports.ensureAdmin = ensureAdmin;
