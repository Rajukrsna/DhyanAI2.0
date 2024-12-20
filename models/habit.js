const mongoose = require('mongoose');


const habitSchema = new mongoose.Schema({
  userId: { type: String , ref: 'User', required: true },
  habitName: {
    type: String,
    required: true
  },
  completedDates: {
    type: [Date],  // Array to store dates when the habit was completed
    default: []
  },
  notCompletedDates: {
    type: [Date],  // Array to store dates when the habit was not completed
    default: []
  },
  monthlyFollowed: {
    type: Map,
    of: Number,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Habit = mongoose.model('Habit', habitSchema);

module.exports = Habit;
