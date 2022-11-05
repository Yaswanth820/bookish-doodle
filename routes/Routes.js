const router = require('express').Router();
const User = require('../models/User');
const { Post } = require('../models/Post');
const { createToken, verifyToken } = require('../utils/Auth');


/************************* User Routes *************************/

// @route   POST /api/register
router.post('/register', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
    });

    try {
        const savedUser = await user.save();
        res.json(savedUser);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route  POST api/authenticate
router.post('/authenticate', async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ error: 'Email or password is wrong' });

    if (user.password !== req.body.password) return res.status(404).json({ error: 'Email or password is wrong' });
    const token = createToken(user);
    res.status(200).header('auth-token', token).json({ message: 'Logged in successfully', token: token });
});

// @route   POST /api/follow/{id}
router.post('/follow/:id', verifyToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ error: 'Current user not found' });

    if (req.params.id === req.user._id) return res.status(400).json({ error: 'You cannot follow or unfollow yourself' });

    if (currentUser.following.includes(req.params.id)) return res.status(400).json({ error: 'Already following' });

    currentUser.following.push(req.params.id);
    user.followers.push(req.user._id);

    try {
        await currentUser.save();
        await user.save();
        res.json({ message: `You are now following ${user.name}` });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   POST /api/unfollow/{id}
router.post('/unfollow/:id', verifyToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    if (req.params.id === req.user._id) return res.status(400).json({ error: 'You cannot follow/unfollow yourself' });

    if (!currentUser.following.includes(req.params.id)) return res.status(400).json({ error: 'Not following' });

    currentUser.following = currentUser.following.filter(id => id !== req.params.id);
    user.followers = user.followers.filter(id => id !== req.user._id);

    try {
        await currentUser.save();
        await user.save();
        res.json({ message: `Unfollowed ${user.name} successfully` });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   GET /api/users (get respective user profile)
router.get('/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const results = {
        name: user.name,
        followerCount: user.followers.length,
        followingCount: user.following.length,
    }
    res.json(results);
});

/************************** Post routes *****************************/

// @route   POST /api/post
router.post('/posts', verifyToken, async (req, res) => {
    const post = new Post({
        userId: req.user._id,
        title: req.body.title,
        desc: req.body.desc,
    });

    try {
        const savedPost = await post.save();
        res.json({ _id: savedPost._id, title: savedPost.title, desc: savedPost.desc, createdAt: savedPost.createdAt });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   DELETE /api/posts/{id}
router.delete('/posts/:id', verifyToken, async (req, res) => {
    const post = await Post.findById(req.params.id);

    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.userId !== req.user._id) {
        return res.status(401).json({ error: 'You are not authorized to access this post' });
    }

    try {
        await post.delete();
        res.json({ message: 'Post deleted successfully' });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   GET /api/all_posts
router.get('/all_posts', verifyToken, async (req, res) => {
    const posts = await Post.find({ userId: req.user._id }).sort({ createdAt: 'desc' });
    const results = posts.map(post => {
        return {
            id: post._id,
            title: post.title,
            desc: post.desc,
            createdAt: post.createdAt,
            comments: post.comments.map(comment => {
                return {
                    userId: comment.userId,
                    comment: comment.desc,
                }
            }),
            likes: post.likes.length,
        }
    });
    res.json(results);
});

// @route   GET /api/post/{id}
router.get('/posts/:id', async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'No post found' });

    const user = await User.findById(post.userId);

    res.json({
        title: post.title,
        desc: post.desc,
        likes: post.likes.length,
        comments: post.comments.length,
        postedBy: user.name,
    });
});

// @route   POST /api/like/{id}
router.post('/like/:id', verifyToken, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.likes.includes(req.user._id)) return res.status(400).json({ error: 'Already liked' });

    post.likes.push(req.user._id);

    try {
        await post.save();
        res.json({ message: 'Liked successfully' });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   POST /api/unlike/{id}
router.post('/unlike/:id', verifyToken, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (!post.likes.includes(req.user._id)) return res.status(404).json({ error: 'Not liked' });

    post.likes = post.likes.filter(id => id !== req.user._id);

    try {
        await post.save();
        res.json({ message: 'Unliked successfully' });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   POST /api/comments
router.post('/comment/:id', verifyToken, async (req, res) => {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const comment = {
        userId: req.user._id,
        desc: req.body.desc,
    };

    post.comments.push(comment);

    try {
        await post.save();
        res.json({ comment_id: post.comments[post.comments.length - 1]._id });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

module.exports = router;