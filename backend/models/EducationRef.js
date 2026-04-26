const mongoose = require('mongoose');

const educationRefSchema = new mongoose.Schema(
  {
    level: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    keywords: {
      // Mots-clés pour matcher avec le texte extrait du CV
      type: [String],
      default: [],
    },
    score: {
      // Score sur 100
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    rank: {
      // Pour trier du plus haut au plus bas
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EducationRef', educationRefSchema);
