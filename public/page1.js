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
var outLevelHistoryDiv = document.getElementById('pintu2-history');

const historyCharts = [inLevelHistoryDiv, outLevelHistoryDiv];

// History Data
var inLevelTrace = {
  x: [],
  y: [],
  name: 'water level 1',
  mode: 'lines+markers',
  type: 'line',
};
var outLevelTrace = {
  x: [],
  y: [],
  name: 'water level 2',
  mode: 'lines+markers',
  type: 'line',
};

const inLevelLayout = {
  autosize: true,
  title: { text: 'Inlet Gate' },
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
    autorange: 'reversed', // Menampilkan data terbaru di sebelah kanan
  },
  yaxis: {
    color: chartAxisColor,
    linecolor: chartAxisColor,
    gridwidth: '2',
    autorange: true,
  },
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
    autorange: 'reversed',
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
window.addEventListener('load', async (event) => {
  Plotly.newPlot(inLevelHistoryDiv, [inLevelTrace], inLevelLayout, config);
  Plotly.newPlot(outLevelHistoryDiv, [outLevelTrace], outLevelLayout, config);

  // Initial data fetch
  await fetchInitialData('mandalika1', 'waterlevel');
  await fetchInitialStatus('mandalika1');

  await fetchInitialData('mandalika2', 'waterlevel');
  await fetchInitialStatus('mandalika2');

  // Setup SSE connections for device status
  setupSSEDeviceStatus('mandalika1');
  setupSSEDeviceStatus('mandalika2');

  // Setup SSE connections for measurements
  setupSSEMeasurements('mandalika1');
  setupSSEMeasurements('mandalika2');

  // Run it initially
  handleDeviceChange(mediaQuery);
});

// Pintu 1
let newinLevelXArray = [];
let newinLevelYArray = [];
// Pintu 2
let newoutLevelXArray = [];
let newoutLevelYArray = [];

// The maximum number of data points displayed on our scatter/line graph
let MAX_GRAPH_POINTS = 12;
let ctr = 0;

function updateSensorReadings(inLevelSeries, outLevelSeries) {
  let latestInLevelValue = null;
  let latestOutLevelValue = null;

  // Memproses data untuk Inlet Gate
  if (inLevelSeries && inLevelSeries.length >= 0) {
    console.log('Raw inLevelSeries:', inLevelSeries);

    // Sortir data berdasarkan timestamp (terbaru ke terlama)
    inLevelSeries.sort((a, b) => b.timestamp - a.timestamp);

    // Mendapatkan data terbaru
    const latestData = inLevelSeries[0];
    latestInLevelValue = latestData.value;

    console.log('Latest inLevel Data:', latestData);

    // Memproses data untuk grafik
    const pintu1 = inLevelSeries.map((data) => Number(data.value).toFixed(2));
    const timestamps = inLevelSeries.map((data) => {
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

    console.log('Processed pintu1 values:', pintu1);
    console.log('Processed timestamps:', timestamps);

    // Memperbarui grafik
    updateCharts('pintu1-history', timestamps, pintu1);
  }

  // Memproses data untuk Outlet Gate
  if (outLevelSeries && outLevelSeries.length >= 0) {
    console.log('Raw outLevelSeries:', outLevelSeries);

    // Sortir data berdasarkan timestamp (terbaru ke terlama)
    outLevelSeries.sort((a, b) => b.timestamp - a.timestamp);

    // Mendapatkan data terbaru
    const latestData = outLevelSeries[0];
    latestOutLevelValue = latestData.value;

    console.log('Latest outLevel Data:', latestData);

    // Memproses data untuk grafik
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

    console.log('Processed pintu2 values:', pintu2);
    console.log('Processed timestamps:', timestamps);

    // Memperbarui grafik
    updateCharts('pintu2-history', timestamps, pintu2);
  }

  // Memperbarui kotak tampilan dengan nilai terbaru dari kedua pintu
  updateBoxes(latestInLevelValue, latestOutLevelValue);
}

function updateBoxes(pintu1, pintu2) {
  let pintu1Div = document.getElementById('pintu1');
  let pintu2Div = document.getElementById('pintu2');
  let pintu1Status = document.getElementById('status-inlet');
  let pintu2Status = document.getElementById('status-outlet');

  if (pintu1 !== null) {
    pintu1Div.innerHTML = pintu1 + ' M'; // Menggunakan 'M' sebagai satuan
    if (pintu1Status) {
      if (pintu1 <= 200) {
        pintu1Status.innerText = 'Aman';
        pintu1Status.style.color = 'rgb(99, 209, 35)'; // Warna hijau
      } else if (pintu1 <= 400) {
        pintu1Status.innerText = 'Siaga 1';
        pintu1Status.style.color = '#ffcc00'; // Warna kuning
      } else if (pintu1 <= 600) {
        pintu1Status.innerText = 'Siaga 2';
        pintu1Status.style.color = '#ff6600'; // Warna oranye
      } else {
        pintu1Status.innerText = 'Bahaya';
        pintu1Status.style.color = '#ff0000'; // Warna merah
      }
    }
  }

  if (pintu2 !== null) {
    pintu2Div.innerHTML = pintu2 + ' M'; // Menggunakan 'M' sebagai satuan
    if (pintu2Status) {
      if (pintu2 <= 200) {
        pintu2Status.innerText = 'Aman';
        pintu2Status.style.color = 'rgb(99, 209, 35)'; // Warna hijau
      } else if (pintu2 <= 400) {
        pintu2Status.innerText = 'Siaga 1';
        pintu2Status.style.color = '#ffcc00'; // Warna kuning
      } else if (pintu2 <= 600) {
        pintu2Status.innerText = 'Siaga 2';
        pintu2Status.style.color = '#ff6600'; // Warna oranye
      } else {
        pintu2Status.innerText = 'Bahaya';
        pintu2Status.style.color = '#ff0000'; // Warna merah
      }
    }
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
    // console.log('Inside Mobile');
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

async function fetchInitialData(deviceId, source) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/measurements/${source}/data`);
    const data = response.data;
    if (deviceId === 'mandalika1') {
      updateSensorReadings(data.series, null);
    } else if (deviceId === 'mandalika2') {
      updateSensorReadings(null, data.series);
    }
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }
}

async function fetchInitialStatus(deviceId) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/status`);
    const data = response.data;
    const statusElement = document.getElementById(`connection-status${deviceId === 'mandalika1' ? '1' : '2'}`);
    if (data.currentState === 'CONNECTED') {
      statusElement.innerText = 'CONNECTED';
      statusElement.style.color = 'green';
    } else if (data.currentState === 'DISCONNECTED') {
      statusElement.innerText = 'DISCONNECTED';
      statusElement.style.color = 'red';
    } else {
      statusElement.innerText = 'UNKNOWN';
      statusElement.style.color = 'grey';
    }
  } catch (error) {
    console.error('Error fetching initial status:', error);
  }
}

function setupSSEMeasurements(deviceId) {
  const eventSource = new EventSource(`/api/measurementsEvents/${deviceId}`);

  eventSource.addEventListener('measurement-data', (event) => {
    const data = JSON.parse(event.data);
    if (deviceId === 'mandalika1') {
      updateSensorReadings(data.series, null);
    } else if (deviceId === 'mandalika2') {
      updateSensorReadings(null, data.series);
    }
    updateTable(data.series);
  });

  eventSource.onerror = (error) => {
    console.error(`Error with SSE for measurements ${deviceId}:`, error);
  };
}

function setupSSEDeviceStatus(deviceId) {
  const eventSource = new EventSource(`/api/devicesEvents/${deviceId}`);
  eventSource.addEventListener('device-status-change', (event) => {
    const data = JSON.parse(event.data);
    const statusElement = document.getElementById(`connection-status${deviceId === 'mandalika1' ? '1' : '2'}`);
    if (data.currentState) {
      if (data.currentState === 'CONNECTED') {
        statusElement.innerText = 'CONNECTED';
        statusElement.style.color = 'green';
      } else if (data.currentState === 'DISCONNECTED') {
        statusElement.innerText = 'DISCONNECTED';
        statusElement.style.color = 'red';
      } else {
        statusElement.innerText = 'UNKNOWN';
        statusElement.style.color = 'grey';
      }
    } else {
      statusElement.innerText = 'UNKNOWN';
      statusElement.style.color = 'grey';
    }
  });

  eventSource.onerror = (error) => {
    console.error('Error with SSE for device status:', error);
  };
}
