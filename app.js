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

// // Use CORS middleware
app.use(cors());

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

// Subscribe for node state changed events
// app.get('/api/devicesEventsControls/:deviceId', (req, res) => {
//   const { deviceId } = req.params;
//   try {
//     res.setHeader('Content-Type', 'text/event-stream');
//     res.setHeader('Cache-Control', 'no-cache');
//     res.setHeader('Connection', 'keep-alive');

//     // Add the new client to the clients array
//     const client = { deviceId, res };
//     clients.push(client);

//     console.log(`Client connected for device ID: ${deviceId}`);

//     // Send a ping to keep the connection alive
//     const keepAliveInterval = setInterval(() => {
//       res.write(': keep-alive\n\n');
//     }, 20000);

//     // Handle client disconnect
//     req.on('close', () => {
//       console.log(`Client disconnected for device ID: ${deviceId}`);
//       clearInterval(keepAliveInterval);
//       clients = clients.filter(c => c.res !== res);
//     });
//   } catch (error) {
//     console.error('Error in SSE endpoint:', error);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });

// // Function to send events to all connected clients
// function sendEvent(data) {
//   clients.forEach((client) => {
//     try {
//       console.log(`Sending event to client with device ID: ${client.deviceId}`);
//       client.res.write(`event: control-state-change\ndata: ${JSON.stringify(data)}\n\n`);
//     } catch (error) {
//       console.error('Error sending event:', error);
//     }
//   });
// }

// // Example: Triggering an event (this should be called where appropriate in your code)
// function exampleStateChangeEvent(deviceId, state) {
//   const event = { type: 'control-state-change', deviceId, state };
//   sendEvent(event);
// }

// // Ensure you call `exampleStateChangeEvent` in your control open/close endpoints
// app.post('/api/data/in-gate/controlopen', async (req, res) => {
//   try {
//     const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
//     const response = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/inlet-gaate/commands`, { value: 'OPEN' }, { headers: { Accept: 'application/json' } });

//     // Trigger the event
//     exampleStateChangeEvent(deviceId, 'OPENED');

//     res.json({ Gate: response.data });
//   } catch (error) {
//     console.error('Error in controlopen endpoint:', error);
//     res.status(500).json({ error: 'Failed to fetch data' });
//   }
// });

// app.post('/api/data/in-gate/controlclose', async (req, res) => {
//   try {
//     const deviceId = req.session.selectedDevice || config.DEVICE_ID_1;
//     const response = await axios.post(`${config.LINK}/v1/devices/${deviceId}/controls/inlet-gaate/commands`, { value: 'CLOSE' }, { headers: { Accept: 'application/json' } });

//     // Trigger the event
//     exampleStateChangeEvent(deviceId, 'CLOSED');

//     res.json({ Gate: response.data });
//   } catch (error) {
//     console.error('Error in controlclose endpoint:', error);
//     res.status(500).json({ error: 'Failed to fetch data' });
//   }
// });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
