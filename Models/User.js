const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    name: {
        type: String,
    },
    email: {
        type: String,
    },
    password: {
        type: String,
    },
    followers: {
        type: Array,
    },
    following: {
        type: Array,
    },
    posts: {
        type: Array,
    }
});

module.exports = User = mongoose.model('users', UserSchema);