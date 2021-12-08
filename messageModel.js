const mongoose = require('mongoose');

const Schema = mongoose.Schema;
 
const Message = new Schema({
  from: { type: Schema.Types.ObjectId, ref: 'user', require: true},
  to: { type: Schema.Types.ObjectId, ref: 'user', require: true},
  body: String,
  date: {type: Date, default: Date.now()}
});

module.exports = mongoose.model('messages', Message);