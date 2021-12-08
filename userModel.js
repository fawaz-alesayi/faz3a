const mongoose = require('mongoose');

const Schema = mongoose.Schema;
 
const User = new Schema({
  name: { type: String, required: true},
  date: {type: Date, default: Date.now()},
  loginToken: {type: String},
  socketId: {type: String}
});

module.exports = mongoose.model('users', User);