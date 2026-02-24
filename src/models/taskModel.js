const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
      index: true,
    },
    sprintId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in-progress', 'review', 'done'],
      default: 'backlog',
      index: true,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    storyPoints: {
      type: Number,
      min: [0, 'Story points cannot be negative'],
      max: [100, 'Story points cannot exceed 100'],
      default: 0,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    statusUpdatedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

taskSchema.pre('save', function () {
  if (this.isModified('status')) {
    this.statusUpdatedAt = new Date();
  }
});

module.exports = mongoose.model('Task', taskSchema);
