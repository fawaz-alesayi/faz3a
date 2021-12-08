const mongoose = require('mongoose');

const Schema = mongoose.Schema;
const ObjectId = Schema.ObjectId;
 
const Post = new Schema({
  user: {
    _id: {type: ObjectId, require: true},
    name: String,
  },
  body: String,
  date: { type: Date, default: Date.now },
  location: String
});

module.exports = mongoose.model('posts', Post);