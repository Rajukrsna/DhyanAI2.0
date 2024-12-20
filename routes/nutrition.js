const axios = require('axios');
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();  
const User = require('../models/User'); 
const Nutrition = require('../models/Nutrition');
const authenticateToken = require('../middlewares/auth')
require('dotenv').config();


const app_id = process.env.AID;
const app_key = process.env.AID2;


const analyzeNutrition = async (ingredients) => {
  try {
    const response = await axios.post(
      `https://api.edamam.com/api/nutrition-details?app_id=${app_id}&app_key=${app_key}`,
      { title: 'Recipe Analysis', ingr: ingredients },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    throw new Error('Failed to analyze nutrition data');
  }
};

router.post('/analyze', authenticateToken,async (req, res) => {
  const ingredients = req.body.ingredients.split('\n');
  const user = await User.findOne({_id :req.user.userId});
  const mealType = req.body.mealType; // Add a field in your form to capture meal type (breakfast, lunch, dinner)
//console.log(ingredients);
  try {
    const nutritionData = await analyzeNutrition(ingredients);

    // Prepare nutrition data for MongoDB document
    const mealData = {
      food: ingredients.join(', '),
      calories: nutritionData.totalNutrients.ENERC_KCAL.quantity,
      protein: nutritionData.totalNutrients.PROCNT.quantity,
      carbs: nutritionData.totalNutrients.CHOCDF.quantity,
      fats: nutritionData.totalNutrients.FAT.quantity,
    };

    // Fetch or create the user's daily nutrition document
    let nutritionEntry = await Nutrition.findOne({user: req.user.userId});
   // console.log("bujalo",nutritionEntry);  
    if (!nutritionEntry) {
      nutritionEntry = new Nutrition({
        user:req.user.userId,
        breakfast: { food: '', calories: 0, protein: 0, carbs: 0, fats: 0 },
        lunch: { food: '', calories: 0, protein: 0, carbs: 0, fats: 0 },
        dinner: { food: '', calories: 0, protein: 0, carbs: 0, fats: 0 },
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFats: 0,
      });
    }
//console.log(nutritionEntry)
    // Update the document based on the meal type
    nutritionEntry[mealType] = mealData;
//console.log("kujalo",nutritionEntry)
    // Update total nutrients
    nutritionEntry.totalCalories += mealData.calories;
    nutritionEntry.totalProtein += mealData.protein;
    nutritionEntry.totalCarbs += mealData.carbs;
    nutritionEntry.totalFats += mealData.fats;
user.todaysCalories+=mealData.calories;

await user.save();
    
    res.json(nutritionEntry);
    

  } catch (error) {
    
  }
});

module.exports = router;
