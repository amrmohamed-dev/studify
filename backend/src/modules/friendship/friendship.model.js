import mongoose from 'mongoose';

const buildPairKey = (requester, recipient) =>
  [requester.toString(), recipient.toString()].sort().join(':');

const friendshipSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Requester is required.'],
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient is required.'],
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
    pairKey: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

friendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });
friendshipSchema.index({ requester: 1, status: 1 });
friendshipSchema.index({ recipient: 1, status: 1 });

friendshipSchema.pre('validate', function () {
  if (!this.requester || !this.recipient) return;

  this.pairKey = buildPairKey(this.requester, this.recipient);
});

friendshipSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.pairKey;
    return ret;
  },
});

friendshipSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.__v;
    delete ret.pairKey;
    return ret;
  },
});

const Friendship = mongoose.model('Friendship', friendshipSchema);

export { buildPairKey };
export default Friendship;
