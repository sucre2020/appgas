const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/User");
const MongoStore = require("connect-mongo");
const dotenv = require("dotenv");
//routes
const dashboardRoutes = require("./routes/dashboard");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const usersRoute = require("./routes/users");
const paymentRoute = require("./routes/payment");

dotenv.config();

const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set("view engine", "ejs");
app.use(express.static("public"));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.yoczwia.mongodb.net/gas?retryWrites=true&w=majority`,
    }),
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
      try {
        const user = await User.findOne({ email });
        if (!user) {
          return done(null, false, { message: "Incorrect email or password." });
        }
        const isMatch = await user.comparePassword(password); // Assuming bcrypt comparison
        if (!isMatch) {
          return done(null, false, { message: "Incorrect email or password." });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Include route files
app.use("/auth", authRoutes);

app.use("/", require("./routes/index"));
app.use("/sellers", require("./routes/sellers"));
app.use("/orders", require("./routes/orders"));
app.use("/", dashboardRoutes);
app.use("/admin", adminRoutes);
// Middleware to make the 'user' object available in all EJS views
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  next();
});
app.use("/", usersRoute);
app.use("/payment", paymentRoute);

mongoose
  .connect(
    `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.yoczwia.mongodb.net/gas?retryWrites=true&w=majority`
  )
  .then(() => {
    console.log("Connected to MongoDB Successfully!");
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
