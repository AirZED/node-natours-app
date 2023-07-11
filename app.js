const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

//importing utils
const AppError = require('./utils/appError');
const errorController = require('./controllers/errorController');
//importing routers
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);
const reviewRouter = require(`${__dirname}/routes/reviewRoutes`);

const app = express();
// set security http
app.use(helmet());
//including global middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// This allows 100 request from an IP in one
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, Please try again in an hour',
});

app.use('/api', limiter);

// Body Parser, reading data from body in req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against no-sql query attack
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({ whitelist: ['duration'] }));

//comes in here to find the specified filed to be served as static content
app.use(express.static(`${__dirname}/public`));
// hence you cannot use 127.0.0.1:3000/public/overview because express would think of this as a normal route and find a route handler for it

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//mounting the tours
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/tours`, tourRouter);
app.use(`/api/v1/reviews`, reviewRouter);

// This middleware can only execute if the above two where not executed, hence it is a better way to handle errors
// no need to call next though
app.all(`*`, (req, res, next) => {
  const err = new AppError(
    `Can\'t find ${req.originalUrl} on this server`,
    404
  );
  next(err);
  //if the next function recieves an argument, express assumes its an error
});

//this middleware catches every error and throws the response for it

app.use(errorController);

module.exports = app;
