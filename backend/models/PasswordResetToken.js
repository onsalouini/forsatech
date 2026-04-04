const mongoose = require('mongoose')

const passwordResetTokenSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			lowercase: true,
			trim: true,
			index: true,
		},
		codeHash: {
			type: String,
			required: true,
		},
		expiresAt: {
			type: Date,
			required: true,
		},
		attempts: {
			type: Number,
			default: 0,
		},
		consumedAt: {
			type: Date,
			default: null,
		},
	},
	{
		timestamps: true,
	}
)

// TTL index: automatically deletes expired tokens.
passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema)
