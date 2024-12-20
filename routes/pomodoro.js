const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const User = require('../models/User');
const authenticateToken= require('../middlewares/auth');
// Home route
router.get('/',authenticateToken, async(req, res) => {
  const user= await User.findById(req.user.userId);
  
  res.render('Hindex', {user});
});



router.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const { name, duration } = req.body;
    console.log(name)
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to midnight

    // Find the document for the current day or create a new one
    let task = await Task.findOne({user: req.user.userId, date: today });

    if (!task) {
      task = new Task({ user: req.user.userId,date: today, activities: [] });
    }

    // Add the new activity to the activities array
    task.activities.push({ name, duration });
    await task.save();

    res.status(201).json({ message: 'Activity saved successfully', task });
  } catch (error) {
    res.status(500).json({ error: 'Error saving activity', details: error.message });
  }
});


router.get('/api/task', authenticateToken,async (req, res) => {
  try {
    // Find tasks created today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to midnight to get tasks for today
    const tasks = await Task.find({
      user: req.user.userId,
      date: { $gte: today }
    }).exec();

    res.json(tasks); // Send the tasks as a response
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Error fetching tasks' });
  }
});



module.exports = router;
