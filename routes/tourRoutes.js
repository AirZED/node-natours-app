const express = require('express');

const tourController = require('../controllers/tourController');
const authController = require('./../controllers/authController');
// //handles sending all tours to clients
// app.get('/api/v1/tours', getAlltours);
// app.get(`/api/v1/tours/:id`, getSingltour);
// //handles posting tour to client
// app.post('/api/v1/tours', postAlltours);
// app.patch(`/api/v1/tours/:id`, patchtour);
// app.delete(`/api/v1/tours/:id`, deleteSingletour);

//mounting route
const router = express.Router();

router
  .route('/top-5-cheap-tours')
  .get(tourController.aliasTopTours, tourController.getAlltours);

router.route('/tour-stats').get(tourController.getAllStats);
router.route('/:year/monthly-plan').get(tourController.getMonthlyPlan);
router
  .route(`/`)
  .get(authController.protect, tourController.getAlltours)
  .post(tourController.createTour);

router
  .route(`/:tourName`)
  .get(tourController.getSingltour)

  .patch(tourController.patchtour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'tour-guide'),
    tourController.deleteSingletour
  );

module.exports = router;
