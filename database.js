const mongoose = require('mongoose');

module.exports.setupDB = () => {
    // mongodb+srv://user:user123@cluster1.gle5k.mongodb.net/DriverDB
    // mongodb://mongo:27017/social-media-app
    mongoose.connect('mongodb+srv://user:user123@cluster1.gle5k.mongodb.net/social-media-app');
    const db = mongoose.connection;
    db.once('open', () => {
        console.log('Connected to MongoDB');
    })
    db.on('error', (err) => {
        console.log('Error connecting to MongoDB: ', err);
    })
    return db;
}