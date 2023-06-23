const catchAsync = (fn) => {
  return (req, res, next) => {
    // fn(req, res, next).catch((error) => next(error));
    // the above is the same as below, just refined
    fn(req, res, next).catch(next);
  };
};

module.exports = catchAsync;
