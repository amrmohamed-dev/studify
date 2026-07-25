import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      minlength: [3, 'Name must be at least 3 characters.'],
      maxlength: [35, 'Name must not exceed 35 characters.'],
      required: [true, 'Name is required.'],
    },
    email: {
      type: String,
      lowercase: true,
      unique: [true, 'Email is already in use.'],
      required: [true, 'Email is required.'],
    },
    password: {
      type: String,
      select: false,
      minlength: [8, 'Password must be at least 8 characters.'],
      maxlength: [30, 'Password must not exceed 30 characters.'],
      required: [true, 'Password is required.'],
    },
    passwordChangedAt: Date,
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    image: {
      url: {
        type: String,
        default: null,
      },
      publicId: {
        type: String,
        default: null,
      },
    },
    favouriteRooms: [
      {
        room: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Room',
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    otp: {
      type: {
        code: String,
        expires: Date,
        purpose: String, //Email Confirmation or Password Recovery
      },
      default: {},
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const hiddenFields = (doc, ret) => {
  delete ret.__v;
  delete ret.updatedAt;
  delete ret.password;
  delete ret.passwordChangedAt;
  delete ret.otp;
  return ret;
};

userSchema.set('toJSON', { transform: hiddenFields });
userSchema.set('toObject', { transform: hiddenFields });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.pre('save', function () {
  if (this.isModified('password') && !this.isNew) {
    this.passwordChangedAt = Date.now() - 1000;
  }
});

userSchema.pre('deleteOne', async function () {
  const { _id: user } = this.getFilter();
  if (user) {
    await mongoose.model('Notification').deleteMany({ user });
  }
});

userSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generateOtp = function (otpPurpose) {
  const otp = crypto.randomInt(100000, 999999).toString();
  this.otp.code = crypto.createHash('sha256').update(otp).digest('hex');
  this.otp.expires = Date.now() + 10 * 60 * 1000;
  this.otp.purpose = otpPurpose;
  return otp;
};

// Consumes/invalidates whatever OTP or reset token is currently stored.
userSchema.methods.clearOtp = function () {
  this.set('otp.code', undefined);
  this.set('otp.expires', undefined);
  this.set('otp.purpose', undefined);
};

// Issues a short-lived, cryptographically random one-time token used to
// authorize the "set new password" step right after an OTP has been
// verified, instead of re-using/re-exposing the original 6-digit OTP.
userSchema.methods.generateResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.otp.code = crypto.createHash('sha256').update(token).digest('hex');
  this.otp.expires = Date.now() + 10 * 60 * 1000;
  this.otp.purpose = 'Password Recovery';
  return token;
};

userSchema.methods.changedPasswordAfter = function (jwtIat) {
  if (this.passwordChangedAt) {
    const passwordChangedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000,
    );
    return passwordChangedTimestamp > jwtIat;
  }
  return false;
};

const User = mongoose.model('User', userSchema);

export default User;
