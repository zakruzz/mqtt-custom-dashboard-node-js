// Import MQTT service
import { MQTTService } from './mqttService.js';

// Target specific HTML items
const sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu-btn');
const closeBtn = document.querySelector('#close-btn');
const themeToggler = document.querySelector('.theme-toggler');

// Holds the background color of all chart
var chartBGColor = getComputedStyle(document.body).getPropertyValue('--chart-background');
var chartFontColor = getComputedStyle(document.body).getPropertyValue('--chart-font-color');
var chartAxisColor = getComputedStyle(document.body).getPropertyValue('--chart-axis-color');

/*
  Event listeners for any HTML click
*/
menuBtn.addEventListener('click', () => {
  sideMenu.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
  sideMenu.style.display = 'none';
});

themeToggler.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme-variables');
  themeToggler.querySelector('span:nth-child(1)').classList.toggle('active');
  themeToggler.querySelector('span:nth-child(2)').classList.toggle('active');

  // Update Chart background
  chartBGColor = getComputedStyle(document.body).getPropertyValue('--chart-background');
  chartFontColor = getComputedStyle(document.body).getPropertyValue('--chart-font-color');
  chartAxisColor = getComputedStyle(document.body).getPropertyValue('--chart-axis-color');
  updateChartsBackground();
});

/*
  Plotly.js graph and chart setup code
*/
var waterlevel1HistoryDiv = document.getElementById('pintu1-history');

var waterlevel1GaugeDiv = document.getElementById('pintu1-gauge');

const historyCharts = waterlevel1HistoryDiv;

const gaugeCharts = waterlevel1GaugeDiv;

// History Data
var waterlevel1Trace = {
  x: [],
  y: [],
  name: 'Pintu 1',
  mode: 'lines+markers',
  type: 'line',
};

var waterlevel1Layout = {
  autosize: true,
  title: {
    text: 'Inlet Gate',
  },
  font: {
    size: 12,
    color: chartFontColor,
    family: 'poppins, san-serif',
  },
  colorway: ['#05AD86'],
  margin: { t: 40, b: 40, l: 30, r: 30, pad: 0 },
  plot_bgcolor: chartBGColor,
  paper_bgcolor: chartBGColor,
  xaxis: {
    color: chartAxisColor,
    linecolor: chartAxisColor,
    gridwidth: '2',
  },
  yaxis: {
    color: chartAxisColor,
    linecolor: chartAxisColor,
    gridwidth: '2',
    autorange: true,
  },
};

var config = { responsive: true, displayModeBar: false };

// Event listener when page is loaded
window.addEventListener('load', (event) => {
  Plotly.newPlot(waterlevel1HistoryDiv, [waterlevel1Trace], waterlevel1Layout, config);

  // Get MQTT Connection
  fetchMQTTConnection();

  // Run it initially
  handleDeviceChange(mediaQuery);
});

// Gauge Data
var waterlevel1Data = [
  {
    domain: { x: [0, 1], y: [0, 1] },
    value: 0,
    title: { text: 'Inlet Gate' },
    type: 'indicator',
    mode: 'gauge+number+delta',
    delta: { reference: 0 },
    gauge: {
      axis: { range: [null, 3000] },
      steps: [
        { range: [0, 20], color: 'lightgray' },
        { range: [20, 30], color: 'gray' },
      ],
      threshold: {
        line: { color: 'red', width: 4 },
        thickness: 0.75,
        value: 0,
      },
    },
  },
];

var layout = { width: 300, height: 250, margin: { t: 0, b: 0, l: 0, r: 0 } };

Plotly.newPlot(waterlevel1GaugeDiv, waterlevel1Data, layout);

// Pintu 1
let newwaterlevel1XArray = [];
let newwaterlevel1YArray = [];

// The maximum number of data points displayed on our scatter/line graph
let MAX_GRAPH_POINTS = 12;
let ctr = 0;

// Callback function that will retrieve our latest sensor readings and redraw our Gauge with the latest readings
function updateSensorReadings(jsonResponse) {
  console.log(typeof jsonResponse);
  console.log(jsonResponse);

  let pintu1 = Number(jsonResponse.waterlevel1).toFixed(2);

  updateBoxes(pintu1);

  updateGauge(pintu1);

  // Update Pintu 1 Line Chart
  updateCharts(waterlevel1HistoryDiv, newwaterlevel1XArray, newwaterlevel1YArray, pintu1);
}

function updateBoxes(pintu1) {
  let pintu1Div = document.getElementById('pintu1');

  pintu1Div.innerHTML = pintu1 + 'M';
}

function updateGauge(pintu1) {
  var pintu1_update = {
    value: pintu1,
  };

  Plotly.update(waterlevel1GaugeDiv, pintu1_update);
}

function updateCharts(lineChartDiv, xArray, yArray, sensorRead) {
  if (xArray.length >= MAX_GRAPH_POINTS) {
    xArray.shift();
  }
  if (yArray.length >= MAX_GRAPH_POINTS) {
    yArray.shift();
  }
  xArray.push(ctr++);
  yArray.push(sensorRead);

  var data_update = {
    x: [xArray],
    y: [yArray],
  };

  Plotly.update(lineChartDiv, data_update);
}

function updateChartsBackground() {
  // updates the background color of historical charts
  var updateHistory = {
    plot_bgcolor: chartBGColor,
    paper_bgcolor: chartBGColor,
    font: {
      color: chartFontColor,
    },
    xaxis: {
      color: chartAxisColor,
      linecolor: chartAxisColor,
    },
    yaxis: {
      color: chartAxisColor,
      linecolor: chartAxisColor,
    },
  };
  historyCharts.forEach((chart) => Plotly.relayout(chart, updateHistory));

  // updates the background color of gauge charts
  var gaugeHistory = {
    plot_bgcolor: chartBGColor,
    paper_bgcolor: chartBGColor,
    font: {
      color: chartFontColor,
    },
    xaxis: {
      color: chartAxisColor,
      linecolor: chartAxisColor,
    },
    yaxis: {
      color: chartAxisColor,
      linecolor: chartAxisColor,
    },
  };
  gaugeCharts.forEach((chart) => Plotly.relayout(chart, gaugeHistory));
}

const mediaQuery = window.matchMedia('(max-width: 600px)');

mediaQuery.addEventListener('change', function (e) {
  handleDeviceChange(e);
});

function handleDeviceChange(e) {
  if (e.matches) {
    console.log('Inside Mobile');
    var updateHistory = {
      width: 323,
      height: 250,
      'xaxis.autorange': true,
      'yaxis.autorange': true,
    };
    historyCharts.forEach((chart) => Plotly.relayout(chart, updateHistory));
  } else {
    var updateHistory = {
      width: 550,
      height: 260,
      'xaxis.autorange': true,
      'yaxis.autorange': true,
    };
    historyCharts.forEach((chart) => Plotly.relayout(chart, updateHistory));
  }
}

document.getElementById('pintu1-up').addEventListener('click', function () {
  // Logic to send "Up" command for Pintu 1
  console.log('Pintu 1 Up button clicked');
  // Add your MQTT or AJAX call here
});

document.getElementById('pintu1-down').addEventListener('click', function () {
  // Logic to send "Down" command for Pintu 1
  console.log('Pintu 1 Down button clicked');
  // Add your MQTT or AJAX call here
});

/*
  MQTT Message Handling Code
*/
const mqttStatus = document.querySelector('.status');

function onConnect(message) {
  mqttStatus.textContent = 'Connected';
}
function onMessage(topic, message) {
  var stringResponse = message.toString();
  var messageResponse = JSON.parse(stringResponse);
  updateSensorReadings(messageResponse);
}

function onError(error) {
  console.log(`Error encountered :: ${error}`);
  mqttStatus.textContent = 'Error';
}

function onClose() {
  console.log(`MQTT connection closed!`);
  mqttStatus.textContent = 'Closed';
}

function fetchMQTTConnection() {
  fetch('/mqttConnDetails', {
    method: 'GET',
    headers: {
      'Content-type': 'application/json; charset=UTF-8',
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      initializeMQTTConnection(data.mqttServer, data.mqttTopic);
    })
    .catch((error) => console.error('Error getting MQTT Connection :', error));
}
function initializeMQTTConnection(mqttServer, mqttTopic) {
  console.log(`Initializing connection to :: ${mqttServer}, topic :: ${mqttTopic}`);
  var fnCallbacks = { onConnect, onMessage, onError, onClose };

  var mqttService = new MQTTService(mqttServer, fnCallbacks);
  mqttService.connect();

  mqttService.subscribe(mqttTopic);
}
