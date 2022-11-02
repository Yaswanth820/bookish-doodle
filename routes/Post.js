const router = require('express').Router();
const Post = require('../models/Post');
const { verifyToken } = require('../utils/JWT');

router.post('/posts', verifyToken, async (req, res) => {
    const post = new Post({
        userId: req.user.user._id,
        title: req.body.title,
        desc: req.body.desc,
    });

    try {
        const savedPost = await post.save();
        res.json(savedPost);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

module.exports = router;