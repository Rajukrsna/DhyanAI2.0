const express = require('express');
const router = express.Router();
const Habit = require('../models/habit');
const User = require('../models/User');
const authenticateToken= require('../middlewares/auth');
// Display habits
router.get('/', authenticateToken,async (req, res) => {
 const user= await User.findById(req.user.userId)
  const habits = await Habit.find({userId:req.user.userId})||[];
  const selectedDate = new Date().getDate();
  const sdate= new Date().toISOString().split('T')[0];
let y;
// Log the completedDates
habits.forEach((habit) => {
  
  habit.completedDates.forEach((date) => {
    console.log(date.toISOString().split('T')[0]);})
    console.log(new Date().toISOString().split('T')[0])
   y=habit.completedDates.some(date => new Date(date).toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) ? "Completed" : "Not Completed"
});



  console.log(y)
  res.render('display-habits', {user, habits,selectedDate});

});

router.post('/habits/add',authenticateToken, async (req, res) => {
  const { habitName } = req.body;
  userId=req.user.userId;

  const newHabit = new Habit({ userId: userId, habitName });
  await newHabit.save();
  res.redirect('/habits');
});

router.post('/habits/toggle/:id', async (req, res) => {
  try {
    const habitId = req.params.id;
    const habit = await Habit.findById(habitId);

    if (!habit) {
      return res.status(404).send('Habit not found');
    }

    // Set today's date to start of the day
    const today = new Date();
 
  
// Get the current month name
const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    // Get today's date string for comparison
    const todayStr = today.toISOString();

    // Check if today's date is already in completedDates
    const isCompleted = habit.completedDates.some(date => new Date(date).toISOString() === todayStr);

    

    if (isCompleted) {
      // If already completed, mark as not complete
      habit.completedDates = habit.completedDates.filter(date => new Date(date).toISOString() !== todayStr);
      habit.notCompletedDates.push(today);

      // Decrement the count for the current month
      if (habit.monthlyFollowed.has(currentMonth)) {
        habit.monthlyFollowed.set(currentMonth, habit.monthlyFollowed.get(currentMonth) - 1);
      }
    } else {
      // If not completed, mark as complete
      habit.notCompletedDates = habit.notCompletedDates.filter(date => new Date(date).toISOString() !== todayStr);
      habit.completedDates.push(today);

      // Increment the count for the current month
      habit.monthlyFollowed.set(currentMonth, (habit.monthlyFollowed.get(currentMonth) || 0) + 1);
    }

    await habit.save();
    res.redirect('/habits');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});



router.post('/habits/delete/:id', async (req, res) => {
  await Habit.findByIdAndDelete(req.params.id);
  res.status(200).json('Habit deleted successfully');
});
module.exports = router;
