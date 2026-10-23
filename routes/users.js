
// const mongoose = require('mongoose');
// const plm=require("passport-local-mongoose");  //after chnages in app.js

// mongoose.connect("mongodb://127.0.0.1:27017/LookNew");

// // Define the User Schema
// const userSchema = new mongoose.Schema({
//   username: {
//     type: String,
//     required: true,
//     unique: true, // Ensures usernames are unique
//     trim: true,   // Removes whitespace from both ends of a string
//     minlength: 3  // Example: Minimum length for username
//   },
//   email: {
//     type: String,
//     required: true,
//     unique: true, // Ensures emails are unique
//     trim: true,
//     lowercase: true, // Converts email to lowercase
//     match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'] // Basic email validation
//   },
//   dp: { // dp for display picture or profile picture
//     type: String, // Store the URL or path to the image
//     default: 'https://example.com/default-dp.jpg' // A default image if none is provided
//   },
//   password: {
//     type: String,
//     minlength: 6 // Example: Minimum length for password
//   },
//   posts: [ // An array to store references to post IDs if you have a separate Post model
//     {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Post' // Assuming you'll have a Post model
//     }
//   ],

//   //added for download section on profile page............
//   downloads: [{ // <-- Add this field
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'post'
//   }],

//   fullname: {
//     type: String,
//     required: true,
//     trim: true
//   }
// }, {
//   timestamps: true // Adds createdAt and updatedAt timestamps automatically
// });

// userSchema.plugin(plm);

// // Create the User Model
// // module.exports  = mongoose.model('User', userSchema);//changed to next line....(while fixing download feature on profile page)
//  module.exports  = mongoose.model('user', userSchema);
// //module.exports  = mongoose.model('User', userSchema);








const mongoose = require('mongoose');
const plm = require("passport-local-mongoose");

// It's better to have one mongoose.connect in your main app file, not here.
// mongoose.connect("mongodb://127.0.0.1:27017/LookNew"); 

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  // ... existing fields ...
  tagline: {
    type: String,
    default: ""
  },
  description: {
    type: String,
    default: ""
  },
  socials: {
    instagram: { type: String, default: "" },
    twitter: { type: String, default: "" },
    facebook: { type: String, default: "" }
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  dp: {
    type: String,
    default: 'https://example.com/default-dp.jpg'
  },
  password: {
    type: String,
    minlength: 6
  },
  currentStreak: {
    type: Number,
    default: 0
  },
  lastPostDate: {
    type: Date,
    default: null
  },
  posts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post' // ✅ CORRECTED: Was 'Post'
  }],
  downloads: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post'
  }],
  // 👇 ADD THESE TWO NEW ARRAYS...follow_unfollow_feature 👇
  followers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user' // This creates a relationship link back to the user model itself
    }
  ],
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user'
    }
  ],
  // 👆 END OF NEW ARRAYS 👆
  fullname: {
    type: String,
    required: true,
    trim: true
  }
}, {
  timestamps: true
},
);

userSchema.plugin(plm);

module.exports = mongoose.model('user', userSchema);