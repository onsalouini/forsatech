const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema(
	{
		questionIndex: { type: Number, required: true },
		selectedIndex: { type: Number, default: -1 },
		isCorrect: { type: Boolean, default: false },
	},
	{ _id: false }
);

const formationAttemptSchema = new mongoose.Schema(
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
		sectionId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			index: true,
		},
		answers: {
			type: [answerSchema],
			default: [],
		},
		score: { type: Number, default: 0 }, // pourcentage 0-100
		correctCount: { type: Number, default: 0 },
		totalQuestions: { type: Number, default: 0 },
		timeSpentSeconds: { type: Number, default: 0 },
		passed: { type: Boolean, default: false },
		passingScore: { type: Number, default: 50 },
	},
	{ timestamps: true }
);

formationAttemptSchema.index({ candidateId: 1, trainingPathId: 1, sectionId: 1, createdAt: -1 });

module.exports = mongoose.model('FormationAttempt', formationAttemptSchema);
