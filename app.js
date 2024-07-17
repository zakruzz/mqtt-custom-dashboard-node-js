const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const port = 3001;

// Set the view engine to ejs
app.set('view engine', 'ejs');

// Serve static files
app.use(express.static('public'));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({ extended: true }));

// Use CORS middleware
app.use(cors());

app.use(cookieParser());

// Session middleware
app.use(
  session({
    secret: 'admin12345', // Replace with a secure key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Middleware CSRF
app.use(csurf({ cookie: true }));

// Middleware untuk menambahkan token CSRF ke setiap respon
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use(bodyParser.json());
app.use((req, res, next) => {
  next();
});

// Routes
const dashboardRouter = require('./routes/dashboard');
app.use('/', dashboardRouter); // Use the router for the root path

// Error handling untuk CSRF
app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    res.status(403);
    res.send('Form tampered with');
  } else {
    next(err);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
