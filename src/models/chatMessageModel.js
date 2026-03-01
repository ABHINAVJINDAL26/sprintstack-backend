const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },
    attachments: [
      {
        originalName: {
          type: String,
          required: true,
          trim: true,
          maxlength: [255, 'Attachment name is too long'],
        },
        fileName: {
          type: String,
          required: true,
          trim: true,
        },
        mimeType: {
          type: String,
          required: true,
          trim: true,
        },
        size: {
          type: Number,
          required: true,
          min: [1, 'Attachment size must be greater than 0'],
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        kind: {
          type: String,
          enum: ['image', 'video', 'archive', 'file'],
          default: 'file',
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
