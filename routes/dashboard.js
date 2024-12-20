const express = require('express');
const router = express.Router();
const User = require('../models/User'); 
const Habit = require('../models/habit');
const multer = require('multer');
const authenticateToken = require('../middlewares/auth');   

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: './public',
    filename: (req, file, cb) => {
        cb(null, 'profile-pic.jpg'); // Save the image with a fixed name for simplicity
    }
});
const upload = multer({ storage });

router.post('/upload-profile-pic', authenticateToken,upload.single('profileImage'), async (req, res) => {
    try {
        const user = await User.findOne({_id :req.user.userId});
        user.profileImage = 'public/profile-pic.jpg'; // Store the image path in the user model
        await user.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});
router.get('/',authenticateToken, async (req, res) => {
    try {
        
         const user= await User.findOne({_id :req.user.userId});
        const habits = await Habit.find({userId:req.user.userId});  // Get all habits
        const a = habits.length;
        
        // Render the dashboard and pass the necessary data
        res.render('dashboard', {
            user,
            a,
            // Add any other data you want to display (e.g., healthProblems)
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/change-profile', authenticateToken,async(req,res)=>{
    try {
        const {username, email, height, weight, healthIssue} = req.body;
        const user = await User.findOne({_id :req.user.userId});
        user.username = username;
        user.email = email;
        user.height = height;
        user.weight = weight;
        user.healthIssue = healthIssue;
        
        await user.save();
        res.redirect('/dashboard');
    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
})
module.exports = router;
