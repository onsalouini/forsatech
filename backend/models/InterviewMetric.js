const mongoose = require('mongoose');

const InterviewMetricSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['candidate', 'recruiter', 'system'],
      default: 'candidate',
      index: true,
    },
    concentrationScore: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    sampledAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    signals: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

InterviewMetricSchema.index({ interviewId: 1, role: 1, sampledAt: -1 });

module.exports = mongoose.model('InterviewMetric', InterviewMetricSchema);
