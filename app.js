const express = require('express');
const app = express();
const port = 3001;
const bodyParser = require('body-parser'); // Tambahkan ini untuk memproses data form

// Load dotenv to read environment variables
require('dotenv').config();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Middleware untuk parsing application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files
app.use(express.static('public'));

// Routes
const dashboardRouter = require('./routes/dashboard');
app.use('/', dashboardRouter); // Use the router for the root path

// MQTT connection details endpoint
app.get('/mqttConnDetails', (req, res) => {
  res.send(
    JSON.stringify({
      mqttServer: process.env.MQTT_BROKER,
      mqttTopic: process.env.MQTT_TOPIC,
    })
  );
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
