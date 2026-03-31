const mongoose = require('mongoose');

const candidacySchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true,
    },
    jobOfferId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOffer',
      required: true,
      index: true,
    },
    cvId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CV',
      required: false,
      index: true,
      default: null,
    },
    status: {
      type: String,
      enum: ['applied', 'reviewed', 'accepted', 'rejected'],
      default: 'applied',
    },
  },
  {
    timestamps: true,
  }
);

candidacySchema.index({ candidateId: 1, jobOfferId: 1 }, { unique: true });

module.exports = mongoose.model('Candidacy', candidacySchema);