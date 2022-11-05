const express = require('express');

module.exports.getApp = () => {
    const app = express();
    const routes = require('./routes/Routes');

    // Middlewares
    app.use(express.json());
    app.use('/api', routes);

    // Test Route
    app.get('/', (req, res) => {
        res.send('Hello World');
    });

    return app;
}
