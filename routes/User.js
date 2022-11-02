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
    const user = await User.findOne({email: req.body.email});
    if (!user) return res.status(400).json({ error: 'Email or password is wrong' });

    if (user.password !== req.body.password) return res.status(400).json({ error: 'Email or password is wrong' });
    const token = createToken(user);
    res.header('auth-token', token).json({ message: 'Logged in successfully', token: token });
});


module.exports = router;