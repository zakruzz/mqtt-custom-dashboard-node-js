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
var outLevelHistoryDiv = document.getElementById('pintu2-history');

const historyCharts = [outLevelHistoryDiv];

// History Data
var outLevelTrace = {
  x: [],
  y: [],
  name: 'water level 2',
  mode: 'lines+markers',
  type: 'line',
};

var outLevelLayout = {
  autosize: true,
  title: {
    text: 'Outlet Gate',
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
  Plotly.newPlot(outLevelHistoryDiv, [outLevelTrace], outLevelLayout, config);

  // Setup SSE for measurements
  setupSSEMeasurements();

  // Setup SSE for device status (if needed)
  setupSSEConnMan2();

  // Setup SSE for control status (if needed)
  setupSSEControlMandalika2();

  // Run it initially
  handleDeviceChange(mediaQuery);

  loadGateStatus();
});

function setupSSEMeasurements() {
  const eventSource = new EventSource(`/api/measurementsEvents/mandalika2`);

  eventSource.addEventListener('measurement-data', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received measurement data for mandalika2:', data);

    updateSensorReadings(data.series);
    updateTable(data.series);
  });

  eventSource.onerror = (error) => {
    console.error('Error with SSE for measurements mandalika2:', error);
  };
}

// Pintu 2
let newoutLevelXArray = [];
let newoutLevelYArray = [];

// The maximum number of data points displayed on our scatter/line graph
let MAX_GRAPH_POINTS = 12;
let ctr = 0;

function updateSensorReadings(outLevelSeries) {
  if (outLevelSeries) {
    const pintu2 = outLevelSeries.map((data) => Number(data.value).toFixed(2));
    const timestamps = outLevelSeries.map((data) => {
      const timestampInMilliseconds = data.timestamp;
      const date = new Date(timestampInMilliseconds);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      return date.toLocaleString('id-ID', options);
    });

    updateBoxes(pintu2[pintu2.length - 1]);
    updateCharts('pintu2-history', timestamps, pintu2);
  }
}

function updateBoxes(pintu2) {
  let pintu2Div = document.getElementById('pintu2');
  let pintu2Status = document.getElementById('status-outlet');

  if (pintu2Status) {
    pintu2Div.innerHTML = pintu2 + 'M';
    if (pintu2 <= 200) {
      pintu2Status.innerText = 'Aman';
      pintu2Status.style.color = 'rgb(99, 209, 35)'; // Green
    } else if (pintu2 <= 400) {
      pintu2Status.innerText = 'Siaga 1';
      pintu2Status.style.color = '#ffcc00';
    } else if (pintu2 <= 600) {
      pintu2Status.innerText = 'Siaga 2';
      pintu2Status.style.color = '#ff6600';
    } else {
      pintu2Status.innerText = 'Bahaya';
      pintu2Status.style.color = '#ff0000';
    }
  } else {
    console.error('Outlet gate status element not found');
  }
}

// Function to update charts
function updateCharts(lineChartDivId, xArray, yArray) {
  const lineChartDiv = document.getElementById(lineChartDivId);
  if (!lineChartDiv) {
    return;
  }

  const data_update = { x: [xArray], y: [yArray] };
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
}

const mediaQuery = window.matchMedia('(max-width: 600px)');

mediaQuery.addEventListener('change', function (e) {
  handleDeviceChange(e);
});

function handleDeviceChange(e) {
  if (e.matches) {
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
// Table
let data = []; // Initialize an empty array to hold your data

let currentPage = 1;
const rowsPerPage = 10;

function displayTable(page) {
  const tbody = document.querySelector('#dataTable tbody');
  tbody.innerHTML = '';
  const start = (page - 1) * rowsPerPage;
  const end = page * rowsPerPage;
  const paginatedData = data.slice(start, end);

  for (const row of paginatedData) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${row.id}</td><td>${row.name}</td><td>${row.value}</td><td>${row.date}</td>`;
    tbody.appendChild(tr);
  }

  document.getElementById('pageDisplay').textContent = page;
}

document.getElementById('prevPage').addEventListener('click', () => {
  if (currentPage > 1) {
    currentPage--;
    displayTable(currentPage);
  }
});

document.getElementById('nextPage').addEventListener('click', () => {
  if (currentPage * rowsPerPage < data.length) {
    currentPage++;
    displayTable(currentPage);
  }
});

// Function to update the table with new data
function updateTable(outLevelSeries) {
  data = outLevelSeries.map((item, index) => ({
    id: index + 1,
    name: 'mandalika2', // Use an appropriate name or source
    value: item.value,
    date: new Date(item.timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }));

  displayTable(currentPage);
}

//connection
function pollDeviceStatusMandalika2() {
  setInterval(() => {
    axios
      .get(`/api/devicesStatus/mandalika2`)
      .then((response) => {
        const data = response.data;
        console.log('Polling response:', data);

        const statusElement = document.getElementById('connection-status2');
        if (data.currentState === 'CONNECTED') {
          statusElement.innerText = 'connected';
          statusElement.style.color = 'green';
        } else if (data.currentState === 'DISCONNECTED') {
          statusElement.innerText = 'disconnected';
          statusElement.style.color = 'red';
        } else {
          statusElement.innerText = 'unknown';
          statusElement.style.color = 'grey';
        }
      })
      .catch((error) => {
        console.error('Error polling device status:', error);
        const statusElement = document.getElementById('connection-status2');
        statusElement.innerText = 'disconnected';
        statusElement.style.color = 'red';
      });
  }, 10000); // Setiap 30 detik
}

function setupSSEConnMan2() {
  if (window.eventSource) {
    window.eventSource.close();
  }

  window.eventSource = new EventSource(`/api/devicesEvents/mandalika2`);

  window.eventSource.addEventListener('device-status-change', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received SSE data:', data);

    const statusElement = document.getElementById('connection-status2');
    if (data.currentState) {
      if (data.currentState === 'CONNECTED') {
        statusElement.innerText = 'connected';
        statusElement.style.color = 'green';
      } else if (data.currentState === 'DISCONNECTED') {
        statusElement.innerText = 'disconnected';
        statusElement.style.color = 'red';
      } else {
        statusElement.innerText = 'unknown';
        statusElement.style.color = 'grey';
      }
    } else {
      statusElement.innerText = 'unknown';
      statusElement.style.color = 'grey';
    }
  });

  window.eventSource.onerror = (error) => {
    console.error('Error with SSE:', error);
  };

  // Mulai polling status perangkat
  pollDeviceStatusMandalika2();
}
//control
function pollControlMandalika2Status() {
  axios
    .get(`/api/controlStatus/mandalika2`)
    .then((response) => {
      const data = response.data;
      console.log('Polling control status response:', data); // Log the polling response data
      const statusElement = document.getElementById('gate-status');
      const status = data.currentState || 'UNKNOWN';
      updateGateStatus(status);
    })
    .catch((error) => {
      console.error('Error polling control status:', error);
      updateGateStatus('UNKNOWN');
    });
}

function setupSSEControlMandalika2() {
  if (window.controlEventSource) {
    window.controlEventSource.close();
  }

  console.log('Setting up SSE for mandalika2'); // Log SSE setup

  window.controlEventSource = new EventSource(`/api/devicesEventsControlsMandalika2`);

  window.controlEventSource.addEventListener('control-status-change', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received SSE control-status-change data:', data); // Log the SSE data
    const gateStatusElement = document.getElementById('gate-status');
    if (gateStatusElement) {
      const newState = data.currentState || 'UNKNOWN';
      updateGateStatus(newState);
    } else {
      console.error('Element with ID "gate-status" not found.');
    }
  });

  window.controlEventSource.onerror = (error) => {
    console.error('Error with control SSE:', error);
    updateGateStatus('UNKNOWN');
  };

  pollControlMandalika2Status();
}

document.getElementById('pintu2-up').addEventListener('click', function () {
  console.log('Opening gate'); // Log gate open action
  axios
    .post('/api/data/in-gate/controlopen')
    .then((response) => {
      console.log('Gate opened:', response.data); // Log the response data
      setupSSEControlMandalika2();
      updateGateStatus('OPENED');
    })
    .catch((error) => {
      console.error('Error opening gate:', error);
      updateGateStatus('UNKNOWN');
    });
});

document.getElementById('pintu2-down').addEventListener('click', function () {
  console.log('Closing gate'); // Log gate close action
  axios
    .post('/api/data/in-gate/controlclose')
    .then((response) => {
      console.log('Gate closed:', response.data); // Log the response data
      setupSSEControlMandalika2();
      updateGateStatus('CLOSED');
    })
    .catch((error) => {
      console.error('Error closing gate:', error);
      updateGateStatus('UNKNOWN');
    });
});
function updateGateStatus(status) {
  const statusElement = document.getElementById('gate-status');
  statusElement.innerText = status;
  statusElement.style.color = getStatusColor(status);
  localStorage.setItem('gateStatus', status);
  console.log('Gate status updated:', status); // Log the updated status
}

function getStatusColor(status) {
  switch (status) {
    case 'OPENED':
      return 'green';
    case 'CLOSED':
      return 'red';
    case 'UNKNOWN':
    default:
      return 'grey';
  }
}

function loadGateStatus() {
  const status = localStorage.getItem('gateStatus') || 'UNKNOWN';
  const statusElement = document.getElementById('gate-status');
  statusElement.innerText = status;
  statusElement.style.color = getStatusColor(status);
  console.log('Gate status loaded:', status); // Log the loaded status
}

window.addEventListener('load', (event) => {
  loadGateStatus();
});
