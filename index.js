const express = require('express');
const app = express();

const PORT = process.env.PORT || 8080;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/social-media-app', console.log('Connected to MongoDB'));

const userRoutes = require('./routes/User');

// Middlewares
app.use(express.json());
app.use('/api', userRoutes);

app.get('/', (req, res) => {
    res.send('Hello World');
});

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));