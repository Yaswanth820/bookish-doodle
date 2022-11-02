const router = require('express').Router();
const User = require('../models/User');
const { createToken, verifyToken } = require('../utils/JWT');

// @route   POST /api/register
router.post('/register', async (req, res) => {
    const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        followers: [],
        following: [],
        posts: []
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
    if (!user) return res.status(400).json({ error: 'Email or password is wrong' });

    if (user.password !== req.body.password) return res.status(400).json({ error: 'Email or password is wrong' });
    const token = createToken(user);
    res.header('auth-token', token).json({ message: 'Logged in successfully', token: token });
});

// @route   POST /api/follow/{id}
router.post('/follow/:id', verifyToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const currentUser = await User.findById(req.user.user._id);
    // console.log(req.user.user._id);
    if (!currentUser) return res.status(400).json({ error: 'me not found' });

    if (currentUser.following.includes(req.params.id)) return res.status(400).json({ error: 'Already following' });

    currentUser.following.push(req.params.id);
    user.followers.push(req.user.user._id);

    try {
        const savedUser = await currentUser.save();
        const savedUser2 = await user.save();
        res.json(savedUser);
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   POST /api/unfollow/{id}
router.post('/unfollow/:id', verifyToken, async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(400).json({ error: 'User not found' });

    const currentUser = await User.findById(req.user.user._id);
    if (!currentUser) return res.status(400).json({ error: 'User not found' });

    if (!currentUser.following.includes(req.params.id)) return res.status(400).json({ error: 'Not following' });

    currentUser.following = currentUser.following.filter(id => id !== req.params.id);
    user.followers = user.followers.filter(id => id !== req.user.user._id);

    try {
        const savedUser = await currentUser.save();
        const savedUser2 = await user.save();
        res.json({ message: `Unfollowed ${user.name} successfully` });
    }
    catch (err) {
        res.status(400).send(err);
    }
});

// @route   GET /api/users (get respective user profile)
router.get('/user', verifyToken, async (req, res) => {
    const user = await User.findById(req.user.user._id);
    if (!user) return res.status(400).json({ error: 'User not found' });
    const results = {
        name: user.name,
        followerCount: user.followers.length,
        followingCount: user.following.length,
    }
    res.json(results);
});
module.exports = router;