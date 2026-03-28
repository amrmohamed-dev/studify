import mongoose from 'mongoose';

const participantSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Participant user is required.'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
      default: null,
    },
  },
  {
    _id: false,
  },
);

const sessionSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required.'],
      index: true,
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Session starter is required.'],
    },
    type: {
      type: String,
      enum: ['study', 'break'],
      required: [true, 'Session type is required.'],
    },
    status: {
      type: String,
      enum: ['active', 'ended'],
      default: 'active',
      index: true,
    },
    duration: {
      type: Number,
      min: [1, 'Duration must be at least 1 minute.'],
      required: [true, 'Duration is required.'],
    },
    startedAt: {
      type: Date,
      required: [true, 'Started at is required.'],
    },
    endsAt: {
      type: Date,
      required: [true, 'Ends at is required.'],
      index: true,
    },
    cycle: {
      type: Number,
      min: [1, 'Cycle must be at least 1.'],
      required: [true, 'Cycle is required.'],
    },
    participants: {
      type: [participantSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  },
);

sessionSchema.index(
  { room: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: 'active',
    },
  },
);

sessionSchema.index({ room: 1, createdAt: -1 });
sessionSchema.index({ type: 1, status: 1, endsAt: -1 });
sessionSchema.index({
  'participants.user': 1,
  type: 1,
  status: 1,
  endsAt: -1,
});

sessionSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

sessionSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

const Session = mongoose.model('Session', sessionSchema);

export default Session;
