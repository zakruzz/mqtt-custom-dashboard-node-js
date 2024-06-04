const express = require('express');
const router = express.Router();

// Render login page
router.get('/', (req, res) => {
  res.render('pages/login');
});

// Handle login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    // If login is successful, redirect to the dashboard
    res.redirect('/dashboard');
  } else {
    // If login fails, redirect back to login page
    res.redirect('/');
  }
});

router.get('/logout', (req, res) => {
  // Perform logout actions, e.g., clear session or cookie
  res.redirect('/');
});

// Home page - Dashboard
router.get('/dashboard', (req, res) => {
  res.render('pages/dashboard', {
    name: process.env.NAME,
    dashboardTitle: process.env.DASHBOARD_TITLE,
  });
});

// Pintu 1 page
router.get('/pintu1', (req, res) => {
  res.render('pages/pintu1', {
    name: process.env.NAME,
    dashboardTitle: process.env.PINTU1_TITLE,
  });
});

// Pintu 1 page
router.get('/pintu2', (req, res) => {
  res.render('pages/pintu2', {
    name: process.env.NAME,
    dashboardTitle: process.env.PINTU2_TITLE,
  });
});
module.exports = router;
