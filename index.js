const { setupDB } = require('./database');
const { getApp } = require('./app')
require('dotenv').config();

const PORT = process.env.PORT || 8080;

setupDB();
const app = getApp();

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));