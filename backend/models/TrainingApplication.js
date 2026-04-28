const mongoose = require('mongoose');

const trainingApplicationSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    trainingPathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TrainingPath',
      required: true,
      index: true,
    },
    cvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CV',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['applied', 'accepted', 'rejected', 'withdrawn'],
      default: 'applied',
    },
    motivation: {
      type: String,
      default: '',
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

trainingApplicationSchema.index({ candidateId: 1, trainingPathId: 1 }, { unique: true });

module.exports = mongoose.model('TrainingApplication', trainingApplicationSchema);