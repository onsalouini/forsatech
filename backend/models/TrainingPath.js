const mongoose = require('mongoose');

const sectionVideoSchema = new mongoose.Schema(
	{
		title: { type: String, default: '', trim: true },
		url: { type: String, default: '', trim: true },
		order: { type: Number, default: 0 },
	},
	{ _id: false }
);

const testQuestionSchema = new mongoose.Schema(
	{
		question: { type: String, default: '', trim: true },
		options: { type: [String], default: [] },
		correctIndex: { type: Number, default: 0 },
	},
	{ _id: false }
);

const sectionTestSchema = new mongoose.Schema(
	{
		enabled: { type: Boolean, default: false },
		questions: { type: [testQuestionSchema], default: [] },
		passingScore: { type: Number, default: 50 }, // pourcentage 0-100
		timeLimitMinutes: { type: Number, default: 0 }, // 0 = pas de limite
	},
	{ _id: false }
);

const trainingSectionSchema = new mongoose.Schema(
	{
		title: { type: String, default: '', trim: true },
		description: { type: String, default: '', trim: true },
		order: { type: Number, default: 0 },
		videos: { type: [sectionVideoSchema], default: [] },
		test: { type: sectionTestSchema, default: () => ({}) },
	},
	{ _id: true }
);

const trainingPathSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			default: '',
			trim: true,
		},
		sections: {
			type: [trainingSectionSchema],
			default: [],
		},
		provider: {
			type: String,
			default: 'ForsaTech',
			trim: true,
		},
		category: {
			type: String,
			default: '',
			trim: true,
		},
		level: {
			type: String,
			enum: ['beginner', 'intermediate', 'advanced'],
			default: 'beginner',
		},
		duration: {
			type: String,
			default: '',
			trim: true,
		},
		imageUrl: {
			type: String,
			default: '',
			trim: true,
		},
		tags: {
			type: [String],
			default: [],
		},
		status: {
			type: String,
			enum: ['draft', 'published'],
			default: 'published',
		},
		createdByAdminId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Admin',
			default: null,
		},
		publishedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
);

module.exports = mongoose.model('TrainingPath', trainingPathSchema);
