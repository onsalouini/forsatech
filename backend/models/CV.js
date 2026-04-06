const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema(
  {
    originalName: { type: String, default: '' },
    fileName: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    size: { type: Number, default: 0 },
    path: { type: String, default: '' },
  },
  { _id: false }
);

const cvSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
    },

    // When multiple CV versions exist, the active one is the default used for preview/matching/applying.
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    source: {
      type: String,
      enum: ['generated', 'uploaded'],
      required: true,
      default: 'generated',
    },

    personal: {
      firstName: { type: String, trim: true, default: '' },
      lastName: { type: String, trim: true, default: '' },
      professionalTitle: { type: String, trim: true, default: '' },
      email: { type: String, trim: true, default: '' },
      phone: { type: String, trim: true, default: '' },
      city: { type: String, trim: true, default: '' },
      country: { type: String, trim: true, default: '' },
      linkedin: { type: String, trim: true, default: '' },
      portfolio: { type: String, trim: true, default: '' },
      birthDate: { type: String, trim: true, default: '' },
      nationality: { type: String, trim: true, default: '' },
      profileImageDataUrl: { type: String, default: '' },
    },

    content: {
      professionalSummary: { type: String, trim: true, default: '' },

      // legacy simple fields
      education: { type: String, trim: true, default: '' },
      experience: { type: String, trim: true, default: '' },
      skills: { type: String, trim: true, default: '' },

      // structured builder fields
      educationItems: {
        type: [
          {
            degree: { type: String, trim: true, default: '' },
            institution: { type: String, trim: true, default: '' },
            startYear: { type: String, trim: true, default: '' },
            endYear: { type: String, trim: true, default: '' },
            mention: { type: String, trim: true, default: '' },
            specialty: { type: String, trim: true, default: '' },
            city: { type: String, trim: true, default: '' },
            pfeTitle: { type: String, trim: true, default: '' },
          },
        ],
        default: [],
      },

      experienceItems: {
        type: [
          {
            title: { type: String, trim: true, default: '' },
            company: { type: String, trim: true, default: '' },
            location: { type: String, trim: true, default: '' },
            period: { type: String, trim: true, default: '' },
            description: { type: String, trim: true, default: '' },
            stack: { type: String, trim: true, default: '' },
          },
        ],
        default: [],
      },

      languages: {
        type: [
          {
            name: { type: String, trim: true, default: '' },
            level: { type: String, trim: true, default: '' },
            certification: { type: String, trim: true, default: '' },
          },
        ],
        default: [],
      },

      certifications: {
        type: [
          {
            name: { type: String, trim: true, default: '' },
            organization: { type: String, trim: true, default: '' },
            obtainedAt: { type: String, trim: true, default: '' },
            expiresAt: { type: String, trim: true, default: '' },
            identifier: { type: String, trim: true, default: '' },
            verificationUrl: { type: String, trim: true, default: '' },
          },
        ],
        default: [],
      },

      projects: {
        type: [
          {
            name: { type: String, trim: true, default: '' },
            type: { type: String, trim: true, default: '' },
            period: { type: String, trim: true, default: '' },
            role: { type: String, trim: true, default: '' },
            description: { type: String, trim: true, default: '' },
            technologies: { type: String, trim: true, default: '' },
            githubUrl: { type: String, trim: true, default: '' },
            demoUrl: { type: String, trim: true, default: '' },
          },
        ],
        default: [],
      },

      qualities: { type: [String], default: [] },
      interests: { type: [String], default: [] },
    },

    uploadedFile: {
      type: uploadedFileSchema,
      default: () => ({}),
    },

    extraction: {
      lastExtractedAt: { type: Date, default: null },
      categories: {
        names: { type: [String], default: [] },
        emails: { type: [String], default: [] },
        phones: { type: [String], default: [] },
        titles: { type: [String], default: [] },
        yearsOfExperience: { type: [String], default: [] },
        experiences: { type: [String], default: [] },
        skills: { type: [String], default: [] },
        education: { type: [String], default: [] },
        certifications: { type: [String], default: [] },
        projects: { type: [String], default: [] },
        languages: { type: [String], default: [] },
        locations: { type: [String], default: [] },
        links: { type: [String], default: [] },
        summary: { type: [String], default: [] },
      },
      rawEntities: { type: mongoose.Schema.Types.Mixed, default: null },
      rawResponse: { type: mongoose.Schema.Types.Mixed, default: null },
    },
  },
  {
    timestamps: true,
  }
);

// Note: we intentionally allow multiple CVs per candidate (history).
cvSchema.index({ candidateId: 1, createdAt: -1 });
cvSchema.index({ candidateId: 1, isActive: 1 });

module.exports = mongoose.model('CV', cvSchema);
