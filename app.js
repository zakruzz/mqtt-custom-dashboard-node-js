const express = require('express');
const session = require('express-session');
// const fs = require('fs');
const app = express();
const port = 3001;

// function loadConfig() {
//   try {
//     const configData = fs.readFileSync('config.json', 'utf-8');
//     return JSON.parse(configData);
//   } catch (err) {
//     console.error('Error reading config.json:', err);
//     return {};
//   }
// }

// const config = loadConfig();

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(
  session({
    secret: 'admin12345', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Routes
const dashboardRouter = require('./routes/dashboard');
app.use('/', dashboardRouter); // Use the router for the root path

// MQTT connection details endpoint
// app.get('/mqttConnDetails', (req, res) => {
//   res.send(
//     JSON.stringify({
//       mqttServer: config.MQTT_BROKER,
//       mqttTopic: config.MQTT_TOPIC,
//     })
//   );
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
