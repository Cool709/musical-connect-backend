const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ObjectId } = mongoose.Types;

// User Schema
const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  isTeacher: {
    type: String,
    default: 'false',
  },
  bio: {
    type: String,
    max: 500,
  },
  instrumentsPlayed: {
    type: String,
    max: 100,
  },
});

module.exports = mongoose.model('User', UserSchema);
