const router = require('express').Router();
const User = require('../models/User');

// @route   POST api/users/register
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




module.exports = router;