// imports
const Listing = require("./models/listing");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js"); //if deconstruction is required, use {listingSchema}
const Review = require("./models/reviews.js");

// Middleware --> Is user Logged in?
module.exports.isLoggedIn = (req, res, next) => {
  console.log(req.user);
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be logged in to use this feature");
    return res.redirect("/login");
  }
  next();
};

// Middleware --> Redirect to the same link before/after logging in
module.exports.savedRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

// Middleware --> Is user the rightful owner of the listing?
module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing.owner._id.equals(res.locals.currUser._id)) {
    req.flash("error", "You don't have permission to edit/delete this listing");
    return res.redirect(`/listings/${id}`);
  }
  next();
};

// Middleware -- Joi Error Handling for validating listing
module.exports.validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errorMessage = error.details
      .map((element) => element.message)
      .join(",");
    throw new ExpressError(400, errorMessage);
  } else {
    next();
  }
};

// Middleware -- Joi Error Handling for validating reviews
module.exports.validateReview = (req, res, next) => {
  let { error } = reviewSchema.validate(req.body);
  if (error) {
    let errorMessage = error.details
      .map((element) => element.message)
      .join(",");
    throw new ExpressError(400, errorMessage);
  } else {
    next();
  }
};

// Middleware -- Is the user the rightful author of this review?
module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review.author.equals(res.locals.currUser._id)) {
    req.flash("error", "You don't have permission to delete this review");
    return res.redirect(`/listings/${id}`);
  }
  next();
};
