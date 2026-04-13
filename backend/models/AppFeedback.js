const mongoose = require('mongoose');

const AppFeedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['candidate', 'recruiter'],
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
  },
  { timestamps: true }
);

AppFeedbackSchema.index({ userId: 1, userRole: 1 }, { unique: true });

module.exports = mongoose.model('AppFeedback', AppFeedbackSchema);
