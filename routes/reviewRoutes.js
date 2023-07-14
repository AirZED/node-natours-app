const express = require('express');

const Router = express.Router({ mergeParams: true });

const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

Router.route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.protect,
    authController.restrictTo('user'),
    reviewController.createReview
  );

Router.route('/:id')
  .delete(reviewController.deleteReview)
  .patch(reviewController.updateReview)
  .post(reviewController.setTourAndUserId, reviewController.createReview)
  .get(reviewController.setFilter, reviewController.getAllReviews);

module.exports = Router;
