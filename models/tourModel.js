const mongoose = require('mongoose');

const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      //the array on required the second object as a fallback document incase none has been specified
      unique: true,
      trim: true,
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
    priceDiscount: Number,
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
tourSchema.pre('find', function (next) {
  //setting this to find and return only tours where secret tours is not equal to true
  this.find({ secretTour: { $ne: true } });
  next();
});

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
