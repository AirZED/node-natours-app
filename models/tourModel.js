const mongoose = require('mongoose');
// const User = require('./userModel');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      //the array on required the second object as a fallback document incase none has been specified
      unique: true,
      trim: true,
      maxLength: [40, ' A tour name most have less or equal 40 characters'],
      minLength: [5, 'A tour name must have more or equal 5 characters'],
      // validate: [validator.isAlpa, 'Name must contain only alphabets'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a MaxgROU'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either easy, medium or difficult',
      },
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      // Below is used to set value to what is returned from the callback
      set: (val) => Math.toFixed(2),
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //this validator can only work when creating new documents as the this keyword points to an updating object during updates
        validator: function (val) {
          //value is the value the the user entered
          return val < this.price; //returns true, if val is discount is greater than price, this returns false and triggers the validate
        },
        message: 'Discount price [{VALUE}] should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      //reference to the image
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createAt: {
      type: Date,
      default: Date.now(),
      select: false,
      //the above hides this information from the client
    },
    startDates: [Date],
    //if mongo cannot parse the date entered here, it would throw an error
    secretTour: {
      type: Boolean,
      default: false,
    },

    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],

    // reviews: [{ type: mongoose.Schema.ObjectId, ref: 'Review' }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

// in the indexing, mongo db goes to the particular index searching either up or down
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// virtual populate
// It wouldn't really make sense implementing this logic on get all tours, hence, I would implement it on getSingleTour
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//using the document middleware in mongoose

//DOCUMENT MIDDLEWARE: this one runs before the .save() comand or the .create() command
tourSchema.pre('save', function (next) {
  //this adds a new property to the documents which would be a lowercase version of the name
  this.slug = slugify(this.name, { lower: true });
  next();
});

// this pre save middle ware runs just before the document is saved, it help convert the guide id to corresponding guide objects
// Ensure to use this function in the future
// tourSchema.pre('save', async function (next) {
//   const guidePromises = this.guides.map(async (id) => await User.findById(id));
//   this.guides = await Promise.all(guidePromises);

//   next();
// });

//QUERY MIDDLEWARE
// /^find/ this is a regular expression that runs for every situation that starts with find
tourSchema.pre(/^find/, function (next) {
  //setting this to find and return only tours where secret tours is not equal to true
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});
//The above runs before the find

tourSchema.pre(/^find/, function (next) {
  this.populate({ path: 'guides', select: '-__v -passwordChangeAt' });
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(
    `${
      Date.now() - this.start
    } is the amount of time it took our query middleware to switch from start to finish`
  );
  next();
});
//the above runs after the find

//AGGREGATION MIDDLEWARE
// tourSchema.pre('aggregate', function (next) {
//   //this point to the current aggregation object
//   //the pipeline object is an array of all the methods we added, hance we are trying to oput somthing in out array
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   // console.log(this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
