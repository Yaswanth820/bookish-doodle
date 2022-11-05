const mongoose = require('mongoose');

module.exports.setupDB = () => {
    mongoose.connect('mongodb://localhost:27017/social-media-app');
    const db = mongoose.connection;
    db.once('open', () => {
        console.log('Connected to MongoDB');
    })
    db.on('error', (err) => {
        console.log('Error connecting to MongoDB: ', err);
    })
    return db;
}