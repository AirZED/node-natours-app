const express = require('express');

const morgan = require('morgan');


//importing routers
const tourRouter = require(`${__dirname}/routes/tourRoutes`);
const userRouter = require(`${__dirname}/routes/userRoutes`);

const app = express();

//including middleware
app.use(morgan('dev'));
app.use(express.json());

app.use((req, res, next) => {
  console.log('Hello from the middleware');
  next();
});

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//mounting the toures
app.use(`/api/v1/users`, userRouter);
app.use(`/api/v1/tours`, tourRouter);
//start up a server

module.exports = app;
