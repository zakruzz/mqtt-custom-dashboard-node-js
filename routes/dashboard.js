const express = require('express');
const router = express.Router();
const axios = require('axios');
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

// SSE route for mandalika1 measurements
router.get('/api/measurementsEvents/mandalika1', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = { res, deviceId: 'mandalika1' };
  measurementClients.push(client);

  // Send a ping to keep the connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    measurementClients = measurementClients.filter((c) => c.res !== res);
  });
});

// SSE route for mandalika2 measurements
router.get('/api/measurementsEvents/mandalika2', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = { res, deviceId: 'mandalika2' };
  measurementClients.push(client);

  // Send a ping to keep the connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    measurementClients = measurementClients.filter((c) => c.res !== res);
  });
});

let measurementClients = [];

// Function to send measurement events to all connected clients
function sendMeasurementEvent(deviceId, data) {
  measurementClients.forEach((client) => {
    if (client.deviceId === deviceId) {
      client.res.write(`event: measurement-data\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
}

// Fetch and send measurement data periodically for mandalika1
setInterval(async () => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika1/measurements/waterlevel/data`, {
      headers: { Accept: 'application/json' },
    });
    sendMeasurementEvent('mandalika1', response.data);
  } catch (error) {
    console.error('Error fetching measurement data for mandalika1:', error);
  }
}, 10000); // Adjust the interval as needed

// Fetch and send measurement data periodically for mandalika2
setInterval(async () => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika2/measurements/waterlevel/data`, {
      headers: { Accept: 'application/json' },
    });
    sendMeasurementEvent('mandalika2', response.data);
  } catch (error) {
    console.error('Error fetching measurement data for mandalika2:', error);
  }
}, 10000); // Adjust the interval as needed

//CONNECTION//
// Retrieve all registered nodes
router.get('/api/devices', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices?page=0&size=20`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

//STATUS//

//mandalika1
// Retrieve single registered node
router.get('/api/devicesSingleMandalika1', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika1`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Subscribe for node state changed events
// Mandalika1: Subscribe for node state changed events
router.get('/api/devicesEvents/mandalika1', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add the new client to the clients array
  const client = { res, deviceId: 'mandalika1' };
  clients.push(client);

  // Send a ping to keep the connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter((c) => c.res !== res);
  });
});

// Retrieve current status of device or node
router.get('/api/devicesStatus/mandalika1', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika1/status`, {
      headers: { Accept: 'application/json' },
    });
    console.log('Device status response:', response.data); // Tambahkan ini untuk debug
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

// Retrieve current status of device or node
router.get('/api/devicesStatus/mandalika1', isAuthenticated, async (req, res) => {
  try {
    // Misalnya, kita menganggap respons 200 sebagai indikator koneksi berhasil
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika1/status`, {
      headers: { Accept: 'application/json' },
    });
    res.json({ currentState: 'CONNECTED' });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.json({ currentState: 'DISCONNECTED' });
  }
});

// Subscribe for node state changed events
router.get('/api/devicesEvents/mandalika1', isAuthenticated, (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add the new client to the clients array
    const client = { res };
    clients.push(client);

    // Send a ping to keep the connection alive
    const keepAliveInterval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 20000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      clients = clients.filter((c) => c.res !== res);
    });
  } catch (error) {
    console.error('Error in SSE endpoint:', error); // Log the error details
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

let clients = [];

// Function to send events to all connected clients
function sendEventConnectmandalika1(data) {
  clients.forEach((client) => {
    if (client.mandalika1 === data.mandalika1) {
      client.res.write(`event: device-status-change\ndata: ${JSON.stringify(data)}\n\n`);
      console.log(`Event sent to device ID: mandalika1 with data: ${JSON.stringify(data)}`); // Tambahkan log ini
    }
  });
}

//mandalika 2
// Retrieve single registered node
router.get('/api/devicesSingleMandalika2', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika2`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
});

// Mandalika2: Subscribe for node state changed events
router.get('/api/devicesEvents/mandalika2', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Add the new client to the clients array
  const client = { res, deviceId: 'mandalika2' };
  clients.push(client);

  // Send a ping to keep the connection alive
  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  // Handle client disconnect
  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter((c) => c.res !== res);
  });
});

// Retrieve current status of device or node
router.get('/api/devicesStatus/mandalika2', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika2/status`, {
      headers: { Accept: 'application/json' },
    });
    console.log('Device status response:', response.data); // Tambahkan ini untuk debug
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

// Retrieve current status of device or node
router.get('/api/devicesStatus/mandalika2', isAuthenticated, async (req, res) => {
  try {
    // Misalnya, kita menganggap respons 200 sebagai indikator koneksi berhasil
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika2/status`, {
      headers: { Accept: 'application/json' },
    });
    res.json({ currentState: 'CONNECTED' });
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.json({ currentState: 'DISCONNECTED' });
  }
});

// Subscribe for node state changed events
router.get('/api/devicesEvents/mandalika2', isAuthenticated, (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Add the new client to the clients array
    const client = { res };
    clients.push(client);

    // Send a ping to keep the connection alive
    const keepAliveInterval = setInterval(() => {
      res.write(': keep-alive\n\n');
    }, 20000);

    // Handle client disconnect
    req.on('close', () => {
      clearInterval(keepAliveInterval);
      clients = clients.filter((c) => c.res !== res);
    });
  } catch (error) {
    console.error('Error in SSE endpoint:', error); // Log the error details
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Function to send events to all connected clients
function sendEventConnectmandalika2(data) {
  clients.forEach((client) => {
    if (client.mandalika2 === data.mandalika2) {
      client.res.write(`event: device-status-change\ndata: ${JSON.stringify(data)}\n\n`);
      console.log(`Event sent to device ID: mandalika2 with data: ${JSON.stringify(data)}`); // Tambahkan log ini
    }
  });
}

//CONTROLL//

//MANDALIKA1//
// Retrieve the current control status of mandalika1
router.get('/api/controlStatus/mandalika1', isAuthenticated, async (req, res) => {
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika1/controls/watergate/status`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching control status:', error);
    res.status(500).json({ error: 'Failed to fetch control status' });
  }
});

//MANDALIKA2//
router.get('/api/controlStatus/mandalika2', isAuthenticated, async (req, res) => {
  try {
    // Misalnya, kita menganggap respons 200 sebagai indikator koneksi berhasil
    const response = await axios.get(`${config.LINK}/v1/devices/mandalika2/controls/watergate/status`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.json({ currentState: 'FAILED' });
  }
});

//DEVICE CHANGE STATUS//
// MANDALIKA 1 //
function exampleStateChangeEventMandalika1(deviceId, state) {
  const event = { type: 'device-status-change', deviceId, currentState: state };
  sendEventConnectmandalika1(event);
}

// MANDALIKA 2 //
function exampleStateChangeEventMandalika2(deviceId, state) {
  const event = { type: 'device-status-change', deviceId, currentState: state };
  sendEventConnectmandalika2(event);
}

// Subscribe for device state change events
router.get('/api/devicesEventsControlsMandalika1', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = { res };
  clients.push(client);

  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter((c) => c.res !== res);
  });
});

// Function to send events to all connected clients
function sendEventControlMandalika1(data) {
  clients.forEach((client) => {
    if (client.mandalika1 === data.mandalika1) {
      client.res.write(`event: control-status-change\ndata: ${JSON.stringify(data)}\n\n`);
      console.log(`Event sent to device ID: mandalika1 with data: ${JSON.stringify(data)}`); // Tambahkan log ini
    }
  });
}

// Example: Triggering an event (this should be called where appropriate in your code)
function StateControlMandalika1ChangeEvent(state) {
  const event = { type: 'control-status-change', currentState: state };
  sendEventControlMandalika1(event);
}
// Update your /api/data/controlopen and /api/data/controlclose endpoints to use sendEvent

// Membuka pintu inlet
router.post('/api/data/in-gate/controlopen', isAuthenticated, async (req, res) => {
  try {
    const response1 = await axios.post(`${config.LINK}/v1/devices/mandalika1/controls/watergate/commands`, { value: 'OPEN' }, { headers: { Accept: 'application/json' } });

    // Trigger the event
    StateControlMandalika1ChangeEvent('OPENED');

    res.json({ Gate: response1.data });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Menutup pintu inlet
router.post('/api/data/in-gate/controlclose', isAuthenticated, async (req, res) => {
  try {
    const response1 = await axios.post(`${config.LINK}/v1/devices/mandalika1/controls/watergate/commands`, { value: 'CLOSE' }, { headers: { Accept: 'application/json' } });

    // Trigger the event
    StateControlMandalika1ChangeEvent('CLOSED');

    res.json({ Gate: response1.data });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Subscribe for device state change events for mandalika2
router.get('/api/devicesEventsControlsMandalika2', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const client = { res };
  clients.push(client);

  const keepAliveInterval = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 20000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    clients = clients.filter((c) => c.res !== res);
  });
});

// Function to send events to all connected clients
function sendEventControlMandalika2(data) {
  clients.forEach((client) => {
    if (client.mandalika2 === data.mandalika2) {
      client.res.write(`event: control-status-change\ndata: ${JSON.stringify(data)}\n\n`);
      console.log(`Event sent to device ID: mandalika2 with data: ${JSON.stringify(data)}`); // Tambahkan log ini
    }
  });
}

// Example: Triggering an event (this should be called where appropriate in your code)
function StateControlMandalika2ChangeEvent(state) {
  const event = { type: 'control-status-change', deviceId: 'mandalika2', currentState: state };
  sendEventControlMandalika2(event);
}
// Update your /api/data/controlopen and /api/data/controlclose endpoints to use sendEvent

// Membuka pintu inlet
router.post('/api/data/out-gate/controlopen', isAuthenticated, async (req, res) => {
  try {
    const response1 = await axios.post(`${config.LINK}/v1/devices/mandalika2/controls/watergate/commands`, { value: 'OPEN' }, { headers: { Accept: 'application/json' } });

    // Trigger the event
    StateControlMandalika2ChangeEvent('OPENED');

    res.json({ Gate: response1.data });
  } catch (error) {
    console.error('Error fetching data from external API:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Menutup pintu inlet
router.post('/api/data/out-gate/controlclose', isAuthenticated, async (req, res) => {
  try {
    const response1 = await axios.post(`${config.LINK}/v1/devices/mandalika2/controls/watergate/commands`, { value: 'CLOSE' }, { headers: { Accept: 'application/json' } });

    // Trigger the event
    StateControlMandalika2ChangeEvent('CLOSED');

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

module.exports = router;
