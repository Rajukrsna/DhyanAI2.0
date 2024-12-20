const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  duration: {
    type: String,
    required: true,
  },
});

const TaskSchema = new mongoose.Schema({
  user: { type: String , ref: 'User', required: true },
  date: {
    type: Date,
    default: () => new Date()// Store only the date part
  },
  activities: {
    type: [ActivitySchema], // Array of activities
    required: true,
    default: [],            // Initialize with an empty array
  },
});

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
