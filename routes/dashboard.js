const express = require('express');
const router = express.Router();
const axios = require('axios'); // Menambahkan axios untuk memanggil API
const fs = require('fs');

function loadConfig() {
  try {
    const configData = fs.readFileSync('./config.json', 'utf-8');
    return JSON.parse(configData);
  } catch (err) {
    console.error('Error reading config.json:', err);
    return {};
  }
}

const config = loadConfig();

// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/');
  }
}

// Render login page
router.get('/', (req, res) => {
  res.render('pages/login');
});

// Handle login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    // If login is successful, set session user and redirect to the dashboard
    req.session.user = { username };
    res.redirect('/dashboard');
  } else {
    // If login fails, redirect back to login page
    res.redirect('/');
  }
});

router.get('/logout', (req, res) => {
  // Perform logout actions, e.g., clear session or cookie
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

// Home page - Dashboard
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('pages/dashboard', {
    name: config.NAME,
    dashboardTitle: config.DASHBOARD_TITLE,
  });
});

// Endpoint to retrieve data from external REST API
router.get('/api/data', isAuthenticated, async (req, res) => {
  try {
    const response1 = await axios.get('http://localhost:9999/v1/devices/mandalika/data/in-level', {
      headers: { Accept: 'application/json' },
    });
    const response2 = await axios.get('http://localhost:9999/v1/devices/mandalika/data/out-level', {
      headers: { Accept: 'application/json' },
    });

    res.json({
      inLevel: response1.data,
      outLevel: response2.data,
    });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Route untuk handle kontrol pintu
router.post('/api/data', isAuthenticated, async (req, res) => {
  const { command } = req.body;
  try {
    const response1 = await axios.post(
      `http://localhost:9999/v1/devices/mandalika/controls/in-gate`,
      {
        command: command,
      },
      {
        headers: { Accept: 'application/json' },
      }
    );

    res.json({
      inlevelGate: response1.data,
    });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Pintu 1 page
router.get('/pintu1', isAuthenticated, (req, res) => {
  res.render('pages/pintu1', {
    name: config.NAME,
    dashboardTitle: config.PINTU1_TITLE,
  });
});

// Pintu 2 page
router.get('/pintu2', isAuthenticated, (req, res) => {
  res.render('pages/pintu2', {
    name: config.NAME,
    dashboardTitle: config.PINTU2_TITLE,
  });
});

module.exports = router;
