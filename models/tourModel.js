const mongoose = require('mongoose');

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
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//using the document middleware in mongoose

//DOCUMENT MIDDLEWARE: this one runs before the .save() comand or the .create() command
tourSchema.pre('save', function (next) {
  //this adds a new property to the documents which would be a lowercase version of the name
  this.slug = slugify(this.name, { lower: true });
  next();
});

// //Another Premiddleware
// tourSchema.pre('save', function (next) {
//   console.log('Eh don be, eh don happen');
//   next();
// });

// //the post middleware function is executed after all premiddlewares are completed
// tourSchema.post('save', function (doc, next) {
//   // this post middleware has access to the next function and the document that is coming back
//   console.log(doc);
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
tourSchema.pre('aggregate', function (next) {
  //this point to the current aggregation object
  //the pipeline object is an array of all the methods we added, hance we are trying to oput somthing in out array
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  // console.log(this.pipeline());
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
