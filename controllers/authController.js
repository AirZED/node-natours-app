const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const signToken = (id) => {
  console.log('expires in ' + process.env.JWT_SECRET_IN);
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_SECRET_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  // sends a secure jwt token to the browser that would be sent back to us upon every request
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // this makes the password and active not show in the response it send to the browser
  user.password = undefined;
  user.active = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const createdUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangeAt: req.body.passwordChangeAt,
    role: req.body.role,
  });

  //This is the authorization token
  createSendToken(createdUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //check if email and password is valid
  if (!email || !password) {
    return next(new AppError('Please provide a password and an email'));
  }
  // fetches password from database
  const user = await User.findOne({
    email,
  }).select('+password');

  // Throws an error incase of wrong password while running the instance method which is available on every doucment of the mongo instance
  if (!user || !(await user.correctPassword(password, user.password))) {
    throw new AppError('Incorrect email or password');
  }
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  // getting the token and check if it exist
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in, Please log in to get access', 401)
    );
  }

  // verification of the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // Check if user still exist
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    next(new AppError('The user belonging to this token no longer exist', 401));
  }

  // Check if user changed password after jwt was issued
  if (currentUser.checkPasswordChange(decoded.iat)) {
    next(new AppError('This user has changed password', 401));
  }

  // this req.user is found in the next middleware
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // the req.user is accessed from the last middleware
    if (!roles.includes(req.user.role)) {
      throw new AppError(
        "You don't have permission to perform this action only admin or tour guide can perform this actione",
        403
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Get user based on posted email
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError('There is no user with this email address', 404));
  }

  // Generate a random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // Send it to the users email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forget your password? Submit a new PATCH request with your new password and passwordConfirm to: ${resetURL}. \nIf you didn't forget you pasword, ignore this email`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password rest token {valid for 10 mins}',
      message,
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save({ validationBeforeSave: false });
    return next(
      new AppError(
        'There was an error sending this email, try again later!',
        500
      )
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  // get user based on token
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  // if token has not expired and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 404));
  }

  // updateChangedPasswordAt property for the user
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // log the user in
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get User from collection

  const activeUser = await User.findOne({ email: req.user.email }).select(
    '+password'
  );
  // getting from request body
  const { oldPassword, password, passwordConfirm } = req.body;

  const isCorrectPassword = await activeUser.correctPassword(
    oldPassword,
    activeUser.password
  );

  if (!isCorrectPassword) {
    return next(new AppError('Passwords do not match', 403));
  }

  // change the password
  activeUser.password = password;
  activeUser.passwordConfirm = passwordConfirm;
  await activeUser.save();

  createSendToken(activeUser, 201, res);
});
