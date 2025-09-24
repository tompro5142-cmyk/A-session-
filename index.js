const express = require('express');
const app = express();
__path = process.cwd()
const bodyParser = require("body-parser");
const PORT = process.env.PORT || 8000;
const code = require('./pair');
require('events').EventEmitter.defaultMaxListeners = 500;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
    res.sendFile(__path + '/pair.html');
});

app.use('/code', code);
app.use('/pair', (req, res) => {
    res.sendFile(__path + '/pair.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`
Don't Forget To Give Star

 Server running on http://localhost:${PORT}`)
});

module.exports = app;