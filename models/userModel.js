const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'User must have a name'],
    },
    email: {
      type: String,
      required: [true, 'User must have an email'],
      unique: true,
      //   this transforms the entered email to lowercase
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    role: {
      type: String,
      enum: ['admin', 'tour-guide', 'user', 'guide'],
      default: 'user',
    },
    photo: String,
    password: {
      type: String,
      required: [true, 'User must have a password'],
      minlength: 8,
      select: false,
    },
    passwordConfirm: {
      type: String,
      validate: {
        // this only works on create and save and not find one and update etc
        validator: function (val) {
          return val === this.password;
        },
        message: 'Password confrim should be the same as entered password',
      },
    },
    passwordChangeAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: { type: Boolean, default: true, select: false },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangeAt = Date.now() - 5000;
  next();
});

UserSchema.pre('save', async function (next) {
  // Check and only updates the password to it hash if its being changed or created for the first time
  if (!this.isModified('password')) return next();

  // Encrypts the password
  this.password = await bcrypt.hash(this.password, 12);

  // in this case we also need to delete the confirm password so we dont have to hash it
  this.passwordConfirm = undefined;
  next();
});

UserSchema.pre(/^find/, function (next) {
  // this point to the currect query
  this.find({ active: true });
  next();
});

// Instance Method
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.checkPasswordChange = function (JWTExpireTime) {
  if (this.passwordChangeAt) {
    const passwordChangeTime = parseInt(
      this.passwordChangeAt.getTime() / 1000,
      10
    );

    // Chceks if the time the password was changes is greater than the time the token was created
    return passwordChangeTime > JWTExpireTime;
  }
  return false;
};

UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encrypt the reset token
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

// UserSchema.compareResetToken = function (token) {
//   return crypto.createHash('sha256').update(token).digest('hex');
// };

const User = mongoose.model('User', UserSchema);

module.exports = User;
