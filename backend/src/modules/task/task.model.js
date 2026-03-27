import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      minlength: [3, 'Title must be at least 3 characters.'],
      maxlength: [100, 'Title must not exceed 100 characters.'],
      required: [true, 'Title is required.'],
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room is required.'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required.'],
    },
    doneBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        completedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

taskSchema.virtual('doneCount').get(function () {
  return this.doneBy.length;
});

const Task = mongoose.model('Task', taskSchema);

export default Task;