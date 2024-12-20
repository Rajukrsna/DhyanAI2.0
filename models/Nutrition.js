const mongoose = require('mongoose');

const nutritionSchema = new mongoose.Schema({
  
   user: { type: String , ref: 'User', required: true },

  breakfast: {
    food: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  },
  lunch: {
    food: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  },
  dinner: {
    food: String,
    calories: Number,
    protein: Number,
    carbs: Number,
    fats: Number,
  },
  totalCalories: Number,
  totalProtein: Number,
  totalCarbs: Number,
  totalFats: Number,
  createdAt: { type: Date, default: Date.now }
});

// Check if the model is already compiled to avoid OverwriteModelError
const Nutrition = mongoose.models.Nutrition || mongoose.model('Nutrition', nutritionSchema);

module.exports = Nutrition;