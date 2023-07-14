const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findOneAndDelete({
      _id: id,
    });

    if (!doc) {
      return next(new AppError('No Document found with such ID', 404));
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findOneAndUpdate(
      {
        id,
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
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //we should have used;
    //const newTour = new Tour({})
    //newTour.save()

    const doc = await Model.create(req.body);
    //req.body passed the post request
    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //BUILD A QUERY

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
    const features = new APIFeatures(Model.find(), req.query || {})
      .filter()
      .sort()
      .limitFields()
      .paginate();
    const docs = await features.query;

    //SEND RESPONSE
    res.status(200).json({
      status: 'success',
      length: docs.length,
      data: {
        data: docs,
      },
    });
  });

exports.getOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const doc = await Model.findOne({
      _id: id,
    }).populate('reviews');

    if (!doc) {
      return next(new AppError('No document with that id is found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });
