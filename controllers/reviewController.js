const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const Review = require('../models/reviewModel');

exports.createReview = catchAsync(async (req, res, next) => {
  // allow nested routing
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;

  const review = await Review.create(req.body);

  if (!review) return next(new AppError('Review not created', 400));

  res.status(200).json({
    status: 'success',
    data: {
      review,
    },
  });
});

exports.getAllReviews = catchAsync(async (req, res, next) => {
  let filter = {};

  if (req.params.tourId) filter = { tour: req.params.tourId };

  const reviews = await Review.find(filter);

  if (!reviews) return next('Reviews not found', 404);

  res.status(201).json({
    status: 'success',
    data: {
      reviews,
    },
  });
});
