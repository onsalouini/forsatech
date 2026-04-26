const mongoose = require('mongoose');

const candidacyScoreSchema = new mongoose.Schema(
  {
    candidacyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidacy',
      required: true,
      index: true,
    },
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

    // Score final (0-100), plafonné à 100 après bonus/pénalités
    finalScore: { type: Number, default: 0, min: 0, max: 100 },

    // Détail des composantes (chacune sur 100)
    matchCvScore: { type: Number, default: 0 },      // 35%
    quizScore: { type: Number, default: 0 },          // 10%
    skillsScore: { type: Number, default: 0 },        // 15%
    experienceScore: { type: Number, default: 0 },    // 15%
    certifScore: { type: Number, default: 0 },        // 15%
    educationScore: { type: Number, default: 0 },     // 5%
    locationScore: { type: Number, default: 0 },      // 5%

    bonus: { type: Number, default: 0 },
    penalty: { type: Number, default: 0 },

    // Données intermédiaires utiles pour affichage
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    matchedCertifs: { type: [String], default: [] },
    detectedEducationLevel: { type: String, default: '' },

    computedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

candidacyScoreSchema.index({ candidacyId: 1 }, { unique: true });

module.exports = mongoose.model('CandidacyScore', candidacyScoreSchema);
