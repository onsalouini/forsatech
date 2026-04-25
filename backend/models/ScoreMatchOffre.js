const mongoose = require('mongoose');

const keywordStatusSchema = new mongoose.Schema(
  {
    kw: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    ok: {
      type: Boolean,
      required: true,
    },
  },
  { _id: false }
);

const scoreMatchOffreSchema = new mongoose.Schema(
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
      default: null,
      index: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      index: true,
    },
    keywordScore: {
      type: Number,
      required: false,
      default: null,
      min: 0,
      max: 100,
    },
    semanticScore: {
      type: Number,
      required: false,
      default: null,
      min: 0,
      max: 100,
    },
    keywords: {
      type: [keywordStatusSchema],
      default: [],
    },
    matchedKeywords: {
      type: [String],
      default: [],
    },
    missingKeywords: {
      type: [String],
      default: [],
    },
    computedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

scoreMatchOffreSchema.index({ candidateId: 1, jobOfferId: 1 }, { unique: true });

module.exports = mongoose.model('ScoreMatchOffre', scoreMatchOffreSchema, 'score-MatchOffre');
