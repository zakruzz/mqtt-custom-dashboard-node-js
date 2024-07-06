const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const crypto = require('crypto');
const querystring = require('querystring');
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
    res.redirect('/login');
  }
}

function generateRandomString(length) {
  return crypto.randomBytes(length).toString('hex');
}

function generateCodeChallengeAndVerifier() {
  const codeVerifier = generateRandomString(32);
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return { codeVerifier, codeChallenge };
}

router.get('/', (req, res) => {
  const { codeVerifier, codeChallenge } = generateCodeChallengeAndVerifier();
  req.session.codeVerifier = codeVerifier;

  const params = {
    response_type: 'code',
    client_id: config.client_id,
    redirect_uri: config.redirect_uri.local,
    scope: 'openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  const authUrl = `${config.auth_server}/oauth2/authorize?${querystring.stringify(params)}`;
  res.redirect(authUrl);
});

router.get('/login', (req, res) => {
  const { codeVerifier, codeChallenge } = generateCodeChallengeAndVerifier();
  req.session.codeVerifier = codeVerifier;

  const params = {
    response_type: 'code',
    client_id: config.client_id,
    redirect_uri: config.redirect_uri.local,
    scope: 'openid profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  };

  const authUrl = `${config.auth_server}/oauth2/authorize?${querystring.stringify(params)}`;
  res.redirect(authUrl);
});

router.get('/authorized', async (req, res) => {
  const code = req.query.code;
  const codeVerifier = req.session.codeVerifier;

  try {
    const tokenResponse = await axios.post(
      `${config.auth_server}/oauth2/token`,
      querystring.stringify({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: config.redirect_uri.local,
        client_id: config.client_id,
        code_verifier: codeVerifier,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const { access_token, id_token } = tokenResponse.data;
    req.session.user = { accessToken: access_token, idToken: id_token };
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.redirect('/');
  }
});

router.get('/logout', async (req, res) => {
  if (req.session && req.session.user && req.session.user.idToken) {
    const idToken = req.session.user.idToken;
    const endSessionUrl = `${config.auth_server}/connect/logout?${querystring.stringify({
      id_token_hint: idToken,
      post_logout_redirect_uri: config.logout_redirect_uri.local,
    })}`;

    req.session.destroy((err) => {
      if (err) {
        return res.redirect('/dashboard');
      }
      res.clearCookie('connect.sid');
      res.redirect(endSessionUrl);
    });
  } else {
    res.redirect('/login');
  }
});

router.get('/loggedout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
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
  const accessToken = req.session.user.accessToken;
  const deviceId = req.params.deviceId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');

  const eventSource = new EventSource(`${config.LINK}/v1/devices/${deviceId}/measurements/waterlevel/events`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

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

// let measurementClients = [];

// //triger event measurement

// function sendMeasurementEvent(deviceId, data) {
//   measurementClients.forEach((client) => {
//     if (client.deviceId === deviceId) {
//       client.res.write(`event: measurement-data\ndata: ${JSON.stringify(data)}\n\n`);
//     }
//   });
// }

router.get('/api/devices/:deviceId/measurements/:source/data', isAuthenticated, async (req, res) => {
  const accessToken = req.session.user.accessToken; // Ambil access token dari sesi
  const { deviceId, source } = req.params;
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/${deviceId}/measurements/${source}/data`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching initial data:', error);
    res.status(500).json({ error: 'Failed to fetch initial data' });
  }
});

router.get('/api/devices/:deviceId/status', isAuthenticated, async (req, res) => {
  const { deviceId } = req.params;
  const accessToken = req.session.user.accessToken;
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/${deviceId}/status`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching device status:', error);
    res.status(500).json({ error: 'Failed to fetch device status' });
  }
});

router.get('/api/devicesEvents/:deviceId', isAuthenticated, (req, res) => {
  const accessToken = req.session.user.accessToken;
  const deviceId = req.params.deviceId;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Cache-Control', 'no-cache');

  const eventSource = new EventSource(`${config.LINK}/v1/devices/${deviceId}/events`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

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

// let clients = [];

// //trigger event device

// function sendEvent(deviceId, data) {
//   clients.forEach((client) => {
//     if (client.deviceId === deviceId) {
//       client.res.write(`event: device-status-change\ndata: ${JSON.stringify(data)}\n\n`);
//     }
//   });
// }

router.get('/api/devices/:deviceId/controls/watergate/status', isAuthenticated, async (req, res) => {
  const { deviceId } = req.params;
  const accessToken = req.session.user.accessToken; // Ambil access token dari sesi
  try {
    const response = await axios.get(`${config.LINK}/v1/devices/${deviceId}/controls/watergate/status`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching initial control status:', error);
    res.status(500).json({ error: 'Failed to fetch initial control status' });
  }
});

let controlClients = [];

router.get('/api/devices/:deviceId/controls/watergate/events', isAuthenticated, (req, res) => {
  const accessToken = req.session.user.accessToken;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Authorization', 'Bearer' + accessToken);

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
  const accessToken = req.session.user.accessToken;
  try {
    const response = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/watergate/commands`, { value: action.toUpperCase() }, { headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` } });
    sendControlEvent(deviceId, { currentState: action.toUpperCase() });
    res.json(response.data);
  } catch (error) {
    console.error(`Error performing ${action} action:`, error);
    res.status(500).json({ error: `Failed to perform ${action} action` });
  }
});

router.post('/v1/watches/:device/measurements/:source', isAuthenticated, async (req, res) => {
  const { device, source } = req.params;
  const accessToken = req.session.user.accessToken;
  const data = req.body;

  try {
    const response = await axios.post(`${config.LINK}/v1/watches/${device}/measurements/${source}`, data, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error sending data to the API:', error);
    res.status(500).json({ error: 'Failed to send data to the API' });
  }
});

router.get('/v1/watches/:device/measurements/:source', isAuthenticated, async (req, res) => {
  const accessToken = req.session.user.accessToken; // Ambil access token dari sesi
  const { device, source } = req.params;
  try {
    const response = await axios.get(`${config.LINK}/v1/watches/${device}/measurements/${source}`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching initial data:', error);
    res.status(500).json({ error: 'Failed to fetch initial data' });
  }
});

router.put('/v1/watches/:device/measurements/:source', isAuthenticated, async (req, res) => {
  const { device, source } = req.params;
  const data = req.body;
  const accessToken = req.session.user.accessToken;

  try {
    const response = await axios.put(`${config.LINK}/v1/watches/${device}/measurements/${source}`, data, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error updating data to the API:', error);
    res.status(500).json({ error: 'Failed to update data to the API' });
  }
});

router.delete('/v1/watches/:device/measurements/:source', isAuthenticated, async (req, res) => {
  const { device, source } = req.params;
  const accessToken = req.session.user.accessToken;
  try {
    const response = await axios.delete(`${config.LINK}/v1/watches/${device}/measurements/${source}`, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
    });
    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error deleting data from the API:', error);
    res.status(500).json({ error: 'Failed to delete data from the API' });
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
