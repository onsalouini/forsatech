const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
  {
    // Sorted array of "role:id" strings, e.g. ["candidate:abc123", "recruiter:def456"]
    // Sorting ensures the same two people always get the same conversationKey
    conversationKey: {
      type: String,
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['recruiter', 'candidate'],
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('DirectMessage', directMessageSchema);