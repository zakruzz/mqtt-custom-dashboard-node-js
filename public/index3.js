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
var inLevelHistoryDiv = document.getElementById('pintu1-history');

const historyCharts = [inLevelHistoryDiv];

// History Data
var inLevelTrace = {
  x: [],
  y: [],
  name: 'water level 2',
  mode: 'lines+markers',
  type: 'line',
};

var inLevelLayout = {
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
  Plotly.newPlot(inLevelHistoryDiv, [inLevelTrace], inLevelLayout, config);

  fetchSensorData();

  // Run it initially
  handleDeviceChange(mediaQuery);
});

function fetchSensorData() {
  axios
    .get('/api/data')
    .then((response1) => {

      const { inLevel } = response1.data;

      updateSensorReadings(inLevel.series);
    })
    .catch((error) => {
      console.error('Error fetching sensor data:', error);
    });
}

// Pintu 2
let newoutLevelXArray = [];
let newoutLevelYArray = [];

// The maximum number of data points displayed on our scatter/line graph
let MAX_GRAPH_POINTS = 12;
let ctr = 0;

// Callback function that will retrieve our latest sensor readings and redraw our Gauge with the latest readings
function updateSensorReadings(inLevelSeries) {

  if (inLevelSeries) {
    const pintu1 = inLevelSeries.map((data) => Number(data.value).toFixed(2));
    const timestamps = inLevelSeries.map((data) => {
      // Konversi timestamp dari detik ke milidetik jika diperlukan
      const timestampInMilliseconds = data.timestamp; // Jika data.timestamp sudah dalam milidetik, tidak perlu mengalikannya dengan 1000
      const date = new Date(timestampInMilliseconds);
      const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      return date.toLocaleString('id-ID', options); // Ganti 'id-ID' dengan locale yang diinginkan
    });

    updateBoxes(pintu1[pintu1.length - 1]);

    // Update Pintu 1 Line Chart
    updateCharts('pintu1-history', timestamps, pintu1);
  } else {
    console.error('Series data is undefined');
  }
}

function updateBoxes(pintu1) {
  let pintu1Div = document.getElementById('pintu1');
  let pintu1Status = document.getElementById('status-inlet');

  if (pintu1Status) {
    pintu1Div.innerHTML = pintu1 + 'M';
    if (pintu1 <= 200) {
      pintu1Status.innerText = 'Aman';
      pintu1Status.style.color = 'rgb(99, 209, 35)'; // Green
    } else if (pintu1 <= 400) {
      pintu1Status.innerText = 'Siaga 1';
      pintu1Status.style.color = '#ffcc00';
    } else if (pintu1 <= 600) {
      pintu1Status.innerText = 'Siaga 2';
      pintu1Status.style.color = '#ff6600';
    } else {
      pintu1Status.innerText = 'Bahaya';
      pintu1Status.style.color = '#ff0000';
    }
  } else {
    console.error('Inlet gate status element not found');
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

// Ensure fetchSensorData is called after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
  fetchSensorData();
  fetchTableData();
});

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

// Panggil fungsi ini ketika halaman selesai dimuat
window.addEventListener('load', (event) => {
  fetchConnectionStatus();
  // fetchGateStatus();
});

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

// Initial display
displayTable(currentPage);

function fetchTableData() {
  axios
    .get('/api/data')
    .then((response) => {
      // Adjust according to your API response structure
      if (response.data && response.data.inLevel && Array.isArray(response.data.inLevel.series)) {
        data = response.data.inLevel.series.map((item, index) => ({
          id: index + 1,
          name: response.data.inLevel.source, // Assuming 'source' is the name you want to display
          value: item.value, // Adjust based on the actual structure of items in 'series'
          date: new Date(item.timestamp).toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        }));
        displayTable(currentPage); // Display the first page of data
      } else {
        console.error('tableData not found in response');
        data = []; // Set data to an empty array as fallback
        displayTable(currentPage);
      }
    })
    .catch((error) => {
      console.error('Error fetching table data:', error);
    });
}

// Fungsi untuk mengambil status koneksi
function fetchConnectionStatus() {
  const statusElement = document.getElementById('connection-status');

  axios
    .get('/api/data/connection')
    .then((response) => {
      if (response.status === 200) {
        statusElement.innerText = 'connected';
        statusElement.style.color = 'green';
      } else {
        statusElement.innerText = 'disconnected';
        statusElement.style.color = 'red';
      }
    })
    .catch((error) => {
      statusElement.innerText = 'disconnected';
      statusElement.style.color = 'red';
    });
}

// Call initializeSSE when the page loads
window.addEventListener('load', (event) => {
  initializeSSE();
  fetchConnectionStatus();
});

// Function to initialize the SSE connection
function initializeSSE() {
  const eventSource = new EventSource('/events');

  eventSource.onmessage = function (event) {
    const data = JSON.parse(event.data);
    if (data.type === 'GATE_STATUS') {
      updateGateStatus(data.gate, data.status);
    }
  };

  eventSource.onerror = function (event) {
    console.error('SSE error:', event);
  };
}

// Function to update the gate status in the DOM
function updateGateStatus(gate, status) {
  const statusElement = document.getElementById('gate-status');
  if (gate === 'in-gate') {
    statusElement.innerText = status;
  }
}

document.getElementById('pintu1-up').addEventListener('click', function () {
  axios
    .post('/api/data/in-gate/controlopen')
    .then((response) => {
      console.log('Gate opened:', response.data);
    })
    .catch((error) => {
      console.error('Error opening gate:', error);
    });
});

document.getElementById('pintu1-down').addEventListener('click', function () {
  axios
    .post('/api/data/in-gate/controlclose')
    .then((response) => {
      console.log('Gate closed:', response.data);
    })
    .catch((error) => {
      console.error('Error closing gate:', error);
    });
});

document.querySelectorAll('.dropdown-item').forEach((item) => {
  item.addEventListener('click', function () {
    const deviceId = this.getAttribute('data-device');
    console.log(`Selected Device ID: ${deviceId}`); // Log the selected device ID for debugging
    axios
      .post('/api/select-device', { deviceId })
      .then((response) => {
        console.log(response.data);
        location.reload();
      })
      .catch((error) => {
        console.error('Error selecting device:', error);
      });
  });
});