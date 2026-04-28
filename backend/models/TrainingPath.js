const mongoose = require('mongoose');

const trainingPathSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
			trim: true,
		},
		description: {
			type: String,
			required: true,
			trim: true,
		},
		provider: {
			type: String,
			default: 'A.I.R',
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
