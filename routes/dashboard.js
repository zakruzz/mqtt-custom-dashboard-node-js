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
    config: config,
  });
});

router.get('/api/data', isAuthenticated, async (req, res) => {
  try {
    const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
    const response1 = await axios.get(`${config.LINK}/v1/devices/${deviceId}/data/in-level`, {
      headers: { Accept: 'application/json' },
    });
    const response2 = await axios.get(`${config.LINK}/v1/devices/${deviceId}/data/out-level`, {
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

// Endpoint to retrieve data from external REST API
router.get('/api/data/connection', isAuthenticated, async (req, res) => {
  try {
    const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
    const response1 = await axios.get(`${config.LINK}/v1/devices/${deviceId}`, {
      headers: { Accept: 'application/json' },
    });

    res.json({
      Status: response1.status,
    });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

const clients = [];

router.get('/events', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add the new client to the clients array
  clients.push(res);

  // Handle client disconnect
  req.on('close', () => {
    clients.splice(clients.indexOf(res), 1);
  });
});

// Function to send events to all connected clients
function sendEvent(data) {
  clients.forEach((client) => {
    client.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// Update your /api/data/controlopen and /api/data/controlclose endpoints to use sendEvent

router.post('/api/data/in-gate/controlopen', isAuthenticated, async (req, res) => {
  try {
    const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
    const response1 = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/in-gate`, { command: 'OPEN' }, { headers: { Accept: 'application/json' } });

    // Send event to all clients
    sendEvent({ type: 'GATE_STATUS', gate: 'in-gate', status: 'OPENED' });

    res.json({ Gate: response1.data });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/api/data/in-gate/controlclose', isAuthenticated, async (req, res) => {
  try {
    const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
    const response1 = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/in-gate`, { command: 'CLOSE' }, { headers: { Accept: 'application/json' } });

    // Send event to all clients
    sendEvent({ type: 'GATE_STATUS', gate: 'in-gate', status: 'CLOSED' });

    res.json({ Gate: response1.data });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/api/data/out-gate/controlopen', isAuthenticated, async (req, res) => {
  try {
    const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
    const response1 = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/out-gate`, { command: 'OPEN' }, { headers: { Accept: 'application/json' } });

    // Send event to all clients
    sendEvent({ type: 'GATE_STATUS', gate: 'out-gate', status: 'OPENED' });

    res.json({ Gate: response1.data });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

router.post('/api/data/out-gate/controlclose', isAuthenticated, async (req, res) => {
  try {
    const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
    const response1 = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/out-gate`, { command: 'CLOSE' }, { headers: { Accept: 'application/json' } });

    // Send event to all clients
    sendEvent({ type: 'GATE_STATUS', gate: 'out-gate', status: 'CLOSED' });

    res.json({ Gate: response1.data });
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
    config: config,
  });
});

// Pintu 2 page
router.get('/pintu2', isAuthenticated, (req, res) => {
  res.render('pages/pintu2', {
    name: config.NAME,
    dashboardTitle: config.PINTU2_TITLE,
    config: config,
  });
});

router.post('/api/select-device', isAuthenticated, (req, res) => {
  const { deviceId } = req.body;
  //console.log(`Device ID received from frontend: ${deviceId}`); // Log the received device ID from frontend
  if (deviceId) {
    req.session.selectedDevice = deviceId;
    //console.log(`Device ID stored in session: ${deviceId}`); // Log the stored device ID in session
    res.json({ message: 'Device selected successfully' });
  } else {
    console.error('No Device ID received'); // Log an error if no device ID is received
    res.status(400).json({ error: 'No Device ID received' });
  }
});

module.exports = router;
