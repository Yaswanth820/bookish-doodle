const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CommentSchema = new Schema({
    userId: {
        type: String,
        required: true
    },
    desc: {
        type: String,
    }
});

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
        type: [CommentSchema],
        default: []
    }
});

const Post = mongoose.model('Post', PostSchema);
module.exports = { Post };