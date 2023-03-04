const fs = require('fs');
const Tour = require('../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');

//ROUTES HANDLERS
exports.createTour = async (req, res) => {
  //we should have used;
  //const newTour = new Tour({})
  //newTour.save()

  try {
    const newTour = await Tour.create(req.body);
    //req.body passed the post request
    res.status(201).json({
      status: 'success',
      data: {
        tour: newTour,
      },
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error,
    });
  }
};

//this is a middleware function that would edit the query object to this values specified inside it
exports.aliasTopTours = (req, res, next) => {
  //this is called prefilling the query string for the user so the user dosent have to do it
  (req.query.limit = '5'), (req.query.sort = 'price, -ratingsAverage');
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAlltours = async (req, res) => {
  try {
    //BUILD A QUERY
    console.log(req.query);

    //1a.) FILTERING

    //creating a shallow copy of the req.query onjects
    // const queryObj = { ...req.query };
    // const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // excludedFields.forEach((field) => delete queryObj[field]);

    // //1b.) ADVANCE FILTERING

    // let queryStr = JSON.stringify(queryObj);
    // queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    // let query = Tour.find(JSON.parse(queryStr));

    // // 2.) SORTING
    // if (req.query.sort) {
    //   const sortStr = req.query.sort.split(',').join(' ');
    //   query = query.sort(sortStr);
    // } else {
    //   query = query.sort('-createAt');
    // }

    // //3.) FIELD LIMITING
    // if (req.query.fields) {
    //   const fields = req.query.fields.split(',').join(' ');
    //   query = query.select(fields);
    // } else {
    //   query = query.select('-__v');
    // }

    // //4.)PAGINATION
    // //defining default page value
    // const page = req.query.page * 1 || 1;
    // const limit = req.query.limit * 1 || 100;

    // const skip = (page - 1) * limit;
    // query = query.skip(skip).limit(limit);

    // if (req.query.page) {
    //   const numTours = await Tour.countDocuments();
    //   if (numTours < skip) throw new Error('This page does not exist');
    // }

    //ONE WAY TO QUERY DB FOR CERTAIN DOCUMENTS
    //  const allTours = Tour.find()
    //    .where('duration')
    //    .equals(5)
    //    .where('difficulty')
    //    .equals('easy');

    //EXECUTE THE QUERY
    const features = new APIFeatures(Tour.find(), req.query || {})
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const allTours = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      length: allTours.length,
      data: {
        tours: allTours,
      },
    });
  } catch (error) {
    console.log(error.stack);
    res.status(404).json({
      status: 'failed',
      message: error.message,
    });
  }
};

exports.getSingltour = async (req, res) => {
  try {
    const { tourName } = req.params;
    const matchedTour = await Tour.find({
      name: tourName,
    });

    console.log(matchedTour);

    res.status(200).json({
      status: 'success',
      data: {
        tour: matchedTour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: 'tour not found',
    });
  }

  // const matchedTour = tours.find((tour) => tour._id === tourId);

  // const matchedTour = tours[+tourId];

  //incase param value is too large
  //   if (!matchedTour) {
  //     return res.status(404).json({
  //       status: 'failed',
  //       message: {
  //         message: 'Could not locate tour in database',
  //       },
  //     });
  //   }
};

exports.patchtour = async (req, res) => {
  try {
    const { tourName } = req.params;

    const updatedTour = await Tour.findOneAndUpdate(
      {
        name: tourName,
      },
      {
        $set: req.body,
      },
      {
        new: true,
        runValidators: true,
      }
      //setting new to true in the third argument ensures what is returned is the new object or doument and runValidators to true runs the inbbuilt schema validation each time a document is recreated
    );
    res.status(201).json({
      status: 'success',
      data: {
        tour: updatedTour,
      },
    });
  } catch (error) {
    res.status(404).json({
      status: 'failed',
      message: {
        message: 'Could not locate tour in database',
      },
    });
  }
};

exports.deleteSingletour = async (req, res) => {
  try {
    const { tourName } = req.params;

    const deletedTour = await Tour.findOneAndDelete(
      {
        name: tourName,
      },
      req.body
    );

    res.status(204).json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    res.status(408).json({
      status: 'failed',
      message: 'could not find tour',
    });
  }
};

exports.getAllStats = async (req, res) => {
  try {
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
  } catch (err) {
    res.satus(400).json({
      statue: 'failed',
      message: err,
    });
  }
};

exports.getMonthlyPlan = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(400).json({
      message: 'failed',
      error: error,
    });
  }
};
