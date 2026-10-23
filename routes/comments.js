const mongoose = require('mongoose');

const commentSchema = mongoose.Schema({
  commentText: {
    type: String,
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user' // Who wrote it
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'post' // Which post it belongs to
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('comment', commentSchema);