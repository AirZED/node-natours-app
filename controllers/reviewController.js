// const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('../controllers/handlerFactory');
const Review = require('../models/reviewModel');

exports.setTourAndUserId = (req, res, next) => {
  // allow nested routing
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.params.id;

  next();
};

exports.setFilter = (req, res, next) => {
  let filter = {};
  if (req.params.tourId) filter = { tour: req.params.tourId };
  next();
};

exports.getAllReviews = factory.getAll(Review);
exports.createReview = factory.createOne(Review);
// Do not update password with this
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);
