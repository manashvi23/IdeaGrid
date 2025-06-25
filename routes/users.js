const mongoose = require('mongoose');
const plm=require("passport-local-mongoose");  //after chnages in app.js

mongoose.connect("mongodb://127.0.0.1:27017/LookNew");

// Define the User Schema
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true, // Ensures usernames are unique
    trim: true,   // Removes whitespace from both ends of a string
    minlength: 3  // Example: Minimum length for username
  },
  email: {
    type: String,
    required: true,
    unique: true, // Ensures emails are unique
    trim: true,
    lowercase: true, // Converts email to lowercase
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] // Basic email validation
  },
  dp: { // dp for display picture or profile picture
    type: String, // Store the URL or path to the image
    default: 'https://example.com/default-dp.jpg' // A default image if none is provided
  },
  password: {
    type: String,
    minlength: 6 // Example: Minimum length for password
  },
  posts: [ // An array to store references to post IDs if you have a separate Post model
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post' // Assuming you'll have a Post model
    }
  ],
  fullname: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt timestamps automatically
});

userSchema.plugin(plm);

// Create the User Model
module.exports  = mongoose.model('User', userSchema);


