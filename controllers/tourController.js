const fs = require('fs');
const Tour = require('../models/tourModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const factory = require('../controllers/handlerFactory');

//ROUTES HANDLERS

//this is a middleware function that would edit the query object to this values specified inside it
exports.aliasTopTours = (req, res, next) => {
  //this is called prefilling the query string for the user so the user dosent have to do it
  (req.query.limit = '5'), (req.query.sort = 'price, -ratingsAverage');
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getSingltour = exports.getAllStats = catchAsync(
  async (req, res, next) => {
    const stats = await Tour.aggregate([
      {
        $match: {
          ratingsAverage: {
            $gte: 4.5,
          },
        },
      },
      {
        $group: {
          _id: '$difficulty',
          //this count each document that goes through the num counter
          numofTours: { $sum: 1 },
          numRatings: { $sum: '$ratingsQuantity' },
          averageRating: { $avg: '$ratingsAverage' },
          averagePrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
        },
      },
      {
        $sort: {
          averagePrice: 1,
        },
      },
      // { $match: { _id: { $ne: 'easy' } } },
    ]);

    res.status(200).json({
      status: 'success',
      data: {
        stats,
      },
    });
  }
);

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    { $unwind: '$startDates' },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        //below count amount of tours
        numToursStart: { $sum: 1 },
        //below creates an array with all names that match pipeline
        tours: { $push: '$name' },
      },
    },
    { $addFields: { month: '$_id' } },

    //in project, more like projection, a zero makes the id hide while a 1 makes the id show up
    { $project: { _id: 0 } },

    //For sort, 1 stands for ascending while -1 stands for decending
    { $sort: { numToursStart: -1 } },

    //limits works like limit in the query
    { $limit: 7 },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      plan,
    },
  });
});

exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError('Include latitude and longitude in the format lat, lng', 404)
    );
  }

  const radius = unit == 'm' ? distance / 3963.2 : distance / 6378.1;

  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  });

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

exports.getDistance = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params;
  const [lat, lng] = latlng.split(',');

  if (!lat || !lng) {
    return next(
      new AppError('Include latitude and longitude in the format lat, lng', 404)
    );
  }

  const distances = await Tour.aggregate([
    {
      $geoNear: {
        near: {
          type: 'Point',
          coordinates: [-115.570154, 51.178456],
        },
        distanceField: 'distance',
        spherical: true,
        distanceMultiplier: 0.001,
      },
    },
    {
      $project: {
        distance: 1,
        name: 1,
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });
});

//create tour and get all tour controllers
exports.createTour = factory.createOne(Tour);
exports.getAlltours = factory.getAll(Tour);

// update factory is called
exports.patchtour = factory.updateOne(Tour);
// delete factory is called
exports.deleteSingletour = factory.deleteOne(Tour);
