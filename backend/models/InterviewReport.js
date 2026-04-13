const mongoose = require('mongoose');

const InterviewReportSchema = new mongoose.Schema(
  {
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: true,
      index: true,
      unique: true,
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: false,
      index: true,
    },
    recruiterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: false,
      index: true,
    },
    generatedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    metricsOverview: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    behaviorAnalysis: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recommendations: {
      type: [String],
      default: [],
    },
    raw: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('InterviewReport', InterviewReportSchema);
