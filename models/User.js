const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Use a string to store the UUID

  username: {
    type: String,
    required: true,
    unique: true,  // Ensures that the username is unique
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
 
  maintananceCal:{
    type:Number,
    default:2000
  },
  height:{
    type:Number,
    default:0
  },
   weight:{
    type:Number,
    default:0
  },
  healthIssue:{
    type:String,
    default:""
  },
  todaysCalories:{
    type:Number,
    default:0
  },
  profileImage: {
    type: String,
    default: "", // You can store the image URL or file path
  },

});

module.exports = mongoose.model('User', UserSchema);
