import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const roomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
      minlength: [3, 'Room name must be at least 3 characters'],
      maxlength: [50, 'Room name must not exceed 50 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Room must have a creator'],
    },
    privacyType: {
      type: String,
      enum: {
        values: ['public', 'private_request', 'private_password'],
        message:
          'privacyType must be public, private_request, or private_password',
      },
      default: 'public',
    },
    password: {
      type: String,
      select: false,
      minlength: [6, 'Password must be at least 6 characters'],
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
    maxMembers: {
      type: Number,
      min: [1, 'Room must have at least 1 members'],
      max: [10, 'Room cannot exceed 10 members'],
      default: 5,
    },
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    pendingMembers: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true },
);

roomSchema.pre('save', async function () {
  if (this.privacyType === 'public' && this.password) {
    throw new Error('Public rooms cannot have a password');
  }

  if (this.privacyType === 'private_request' && this.password) {
    throw new Error('Private request rooms should not have a password');
  }

  if (this.privacyType === 'private_password' && !this.password) {
    throw new Error('Private password rooms must have a password');
  }

  if (!this.isModified('password') || !this.password) return;

  this.password = await bcrypt.hash(this.password, 10);
});

roomSchema.methods.correctPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Room = mongoose.model('Room', roomSchema);

export default Room;