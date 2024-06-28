const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const EventSource = require('eventsource');

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

function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  } else {
    res.redirect('/');
  }
}

router.get('/', (req, res) => {
  res.render('pages/login');
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === 'admin') {
    req.session.user = { username };
    res.redirect('/dashboard');
  } else {
    res.redirect('/');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/dashboard');
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
});

router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('pages/dashboard', {
    name: config.NAME,
    dashboardTitle: config.DASHBOARD_TITLE,
    config: config,
  });
});

router.get('/api/measurementsEvents/:deviceId', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  //res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const deviceId = req.params.deviceId;
  const eventSource = new EventSource(`${config.LINK}/v1/devices/${deviceId}/measurements/waterlevel/events`);

  eventSource.onmessage = (event) => {
    res.write(`data: ${event.data}\n\n`);
  };

  eventSource.onerror = (error) => {
    console.error('Error with SSE MEASUREMENTS:', error);
    res.end();
  };
  req.on('close', () => {
    eventSource.close();
  });
});

let measurementClients = [];

function sendMeasurementEvent(deviceId, data) {
  measurementClients.forEach((client) => {
    if (client.deviceId === deviceId) {
      client.res.write(`event: measurement-data\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
}

router.get('/api/devices/:deviceId/measurements/:source/data', isAuthenticated, async (req, res) => {
  const { deviceId, source } = req.params;
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/${deviceId}/measurements/${source}/data`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching initial data:', error);
    res.status(500).json({ error: 'Failed to fetch initial data' });
  }
});

router.get('/api/devices/:deviceId/status', isAuthenticated, async (req, res) => {
  const { deviceId } = req.params;
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/${deviceId}/status`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

router.get('/api/devicesEvents/:deviceId', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  //res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const deviceId = req.params.deviceId;
  const eventSource = new EventSource(`${config.LINK}/v1/devices/${deviceId}/events`);

  eventSource.onmessage = (event) => {
    res.write(`data: ${event.data}\n\n`);
  };

  eventSource.onerror = (error) => {
    console.error('Error with SSE DEVICES:', error);
    res.end();
  };

  req.on('close', () => {
    eventSource.close();
  });
});

let clients = [];

function sendEvent(deviceId, data) {
  clients.forEach((client) => {
    if (client.deviceId === deviceId) {
      client.res.write(`event: device-status-change\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
}

router.get('/api/devices/:deviceId/controls/watergate/status', isAuthenticated, async (req, res) => {
  const { deviceId } = req.params;
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/${deviceId}/controls/watergate/status`, {
      headers: { Accept: 'application/json' },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching initial control status:', error);
    res.status(500).json({ error: 'Failed to fetch initial control status' });
  }
});

// Declare the controlClients array
let controlClients = [];
// SSE route for control status
router.get('/api/devices/:deviceId/controls/watergate/events', isAuthenticated, (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  //res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const deviceId = req.params.deviceId;
  const eventSource = new EventSource(`${config.LINK}/v1/devices/${deviceId}/controls/watergate/events`);

  eventSource.onmessage = (event) => {
    res.write(`data: ${event.data}\n\n`);
  };

  eventSource.onerror = (error) => {
    console.error('Error with SSE:', error);
    res.end();
  };

  req.on('close', () => {
    eventSource.close();
  });
});

function sendControlEvent(deviceId, data) {
  controlClients.forEach((client) => {
    if (client.deviceId === deviceId) {
      client.res.write(`event: control-status-change\ndata: ${JSON.stringify(data)}\n\n`);
    }
  });
}

router.post('/api/data/:deviceId/control/:action', isAuthenticated, async (req, res) => {
  const { deviceId, action } = req.params;
  try {
    const response = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/watergate/commands`, { value: action.toUpperCase() }, { headers: { Accept: 'application/json' } });
    sendControlEvent(deviceId, { currentState: action.toUpperCase() });
    res.json(response.data);
  } catch (error) {
    console.error(`Error performing ${action} action:`, error);
    res.status(500).json({ error: `Failed to perform ${action} action` });
  }
});

router.get('/pintu1', isAuthenticated, (req, res) => {
  res.render('pages/pintu1', {
    name: config.NAME,
    dashboardTitle: config.PINTU1_TITLE,
    config: config,
  });
});

router.get('/pintu2', isAuthenticated, (req, res) => {
  res.render('pages/pintu2', {
    name: config.NAME,
    dashboardTitle: config.PINTU2_TITLE,
    config: config,
  });
});

module.exports = router;
