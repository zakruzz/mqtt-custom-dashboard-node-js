const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
// const fs = require('fs');
const port = 3001;

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// // Load configuration
// function loadConfig() {
//   try {
//     const configData = fs.readFileSync('./config.json', 'utf-8');
//     return JSON.parse(configData);
//   } catch (err) {
//     console.error('Error reading config.json:', err);
//     return {};
//   }
// }

// const config = loadConfig();

//Use CORS middleware
app.use(cors());

// Middleware untuk mengizinkan CORS
// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
//   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');
// });

// Session middleware
app.use(
  session({
    secret: 'admin12345', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

app.use(bodyParser.json());
app.use((req, res, next) => {
  next();
});

// Routes
const dashboardRouter = require('./routes/dashboard');
app.use('/', dashboardRouter); // Use the router for the root path

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
