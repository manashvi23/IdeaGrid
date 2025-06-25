const mongoose = require('mongoose');

// Define the Post Schema as per your image
const postSchema = new mongoose.Schema({
  imageText: {
    type: String,
    required: true,
  },
  image:{
    type:String,
  },
  //after setting up routes...for sharing ids of dif models with each other
  user:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User'  //to tell of which model this id will be otherwise how mongoose will know..similarly in users.js
  },
  createdAt: { // Explicitly defining createdAt
    type: Date,
    default: Date.now, // Sets the default value to the current date and time
  },
  likes: { // Defining likes as a simple number
    type: Array, //changed to ary.......................
    default: [], // Starts with 0 likes by default
  },
});

// Create the Post Model
module.exports = mongoose.model('Post', postSchema);
