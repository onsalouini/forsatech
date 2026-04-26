const mongoose = require('mongoose');

const certifRefSchema = new mongoose.Schema(
  {
    name: {
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
    weight: {
      // Poids sur une échelle de 1 à 10
      type: Number,
      required: true,
      min: 1,
      max: 10,
    },
    category: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CertifRef', certifRefSchema);
