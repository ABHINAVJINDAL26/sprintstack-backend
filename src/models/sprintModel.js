const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Sprint name is required'],
      trim: true,
      maxlength: [100, 'Sprint name cannot exceed 100 characters'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    status: {
      type: String,
      enum: ['planned', 'active', 'completed'],
      default: 'planned',
    },
    goal: {
      type: String,
      trim: true,
      maxlength: [300, 'Goal cannot exceed 300 characters'],
    },
  },
  { timestamps: true }
);

sprintSchema.pre('save', function () {
  if (this.endDate <= this.startDate) {
    throw new Error('End date must be after start date');
  }
});

module.exports = mongoose.model('Sprint', sprintSchema);
