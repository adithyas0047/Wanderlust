// .env
if (process.env.NOD_ENV != "production") {
  require("dotenv").config();
}
console.log(process.env.SECRET);

// imports
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

// importing api routers
const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");

// port
let port = 3000;

// database server - mongodb
const dbUrl = process.env.ATLASDB_URL;

main()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });

async function main() {
  await mongoose.connect(dbUrl);
}

// ejs and urlencoded setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate); // using ejsMate for styling --> app.engine
app.use(express.static(path.join(__dirname, "/public")));

// connect-mongo
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});

store.on("error", () => {
  console.log("ERROR IN MONGO SESSION STORE!", err);
});

// session
const sessionOptions = {
  store,
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true,
  cookie: {
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
  },
};

// root route
// app.get("/", (req, res) => {
//   res.send("Root route!");
// });

// session and flash
app.use(session(sessionOptions));
app.use(flash());

// passport
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser()); //serialize user into the session
passport.deserializeUser(User.deserializeUser()); //deserialize user from the session

// flash middleware
app.use((req, res, next) => {
  res.locals.successMessage = req.flash("success");
  res.locals.errorMessage = req.flash("error");
  res.locals.currUser = req.user;
  next();
});

// demo user passport
// app.get("/demouser", async (req, res) => {
//   let fakeUser = new User({
//     email: "student@gmail.com",
//     username: "student",
//   });

//   let registeredUser = await User.register(fakeUser, "fakePassword");
//   res.send(registeredUser);
// });

// listingRouter api routes
app.use("/listings", listingRouter);

// reviewRouter api routes
app.use("/listings/:id/reviews", reviewRouter);

// userRoute api route
app.use("/", userRouter);

// Catches "INVALID API ROUTE" Error
app.all(/(.*)/, (req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

// Middleware -- Error Handling
app.use((err, req, res, next) => {
  let { statusCode = 500, message = "Something went wrong!" } = err;
  res.status(statusCode).render("error.ejs", { message });
  // res.status(statusCode).send(message);
});

// app listening
app.listen(port, (req, res) => {
  console.log("Server Started:", port);
});
