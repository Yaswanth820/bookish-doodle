const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    title: {
        type: String,
    },
    desc: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: {
        type: Array,
        default: []
    },
    comments: {
        type: Array,
        default: []
    }
});

module.exports = mongoose.model('Post', PostSchema);