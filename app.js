const express = require('express');

const morgan = require('morgan');

//importing routers
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);

const app = express();

//including middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

//comes in here to find the specified filed to be served as static content
app.use(express.static(`${__dirname}/public`));
// hence you cannot use 127.0.0.1:3000/public/overview because express would think of this as a normal route and find a route handler for it

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

// app.use((req, res, next) => {
//   req.requestTime = new Date().toISOString();
//   next();
// });

//mounting the tours
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/tours`, tourRouter);


module.exports = app;
