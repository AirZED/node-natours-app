const express = require('express');

const tourController = require('../controllers/tourController');

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
  .route(`/`)
  .get(tourController.getAlltours)
  .post(tourController.postAlltours);

router
  .route(`/:id`)
  .get(tourController.getSingltour)
  .patch(tourController.patchtour)
  .delete(tourController.deleteSingletour);

module.exports = router;
