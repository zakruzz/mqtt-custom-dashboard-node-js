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

var inLevelLayout = {
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
  margin: { t: 40, b: 40, l: 30, r: 30, pad: 10 },
  plot_bgcolor: chartBGColor,
  paper_bgcolor: chartBGColor,
  xaxis: {
    color: chartAxisColor,
    linecolor: chartAxisColor,
    gridwidth: '2',
    autorange: true,
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
  Plotly.newPlot(outLevelHistoryDiv, [outLevelTrace], outLevelLayout, config);

  fetchSensorData();

  // Run it initially
  handleDeviceChange(mediaQuery);
});

function fetchSensorData() {
  axios
    .get('/api/data')
    .then((response) => {
      // console.log('Response:', response.data); // Debug: Inspect the response structure

      const { inLevel, outLevel } = response.data;
      //console.log('inLevel:', inLevel);
      //console.log('outLevel:', outLevel);

      updateSensorReadings(inLevel.series, outLevel.series);
    })
    .catch((error) => {
      console.error('Error fetching sensor data:', error);
    });
}

// Pintu 1
let newinLevelXArray = [];
let newinLevelYArray = [];
// Pintu 2
let newoutLevelXArray = [];
let newoutLevelYArray = [];

// The maximum number of data points displayed on our scatter/line graph
let MAX_GRAPH_POINTS = 12;
let ctr = 0;

// Callback function that will retrieve our latest sensor readings and redraw our Gauge with the latest readings
function updateSensorReadings(inLevelSeries, outLevelSeries) {
  // console.log('inLevelSeries:', inLevelSeries); // Debug: Inspect inLevelSeries
  // console.log('outLevelSeries:', outLevelSeries); // Debug: Inspect outLevelSeries

  if (inLevelSeries && outLevelSeries) {
    const pintu1 = inLevelSeries.map((data) => Number(data.value).toFixed(2));
    const pintu2 = outLevelSeries.map((data) => Number(data.value).toFixed(2));
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

    //console.log('pintu1:', pintu1); // Debug: Inspect pintu1
    //console.log('pintu2:', pintu2); // Debug: Inspect pintu2
    //console.log('timestamps:', timestamps); // Debug: Inspect timestamps

    updateBoxes(pintu1[pintu1.length - 1], pintu2[pintu2.length - 1]);

    // Update Pintu 1 Line Chart
    updateCharts('pintu1-history', timestamps, pintu1);
    // Update Pintu 2 Line Chart
    updateCharts('pintu2-history', timestamps, pintu2);
  } else {
    console.error('Series data is undefined');
  }
}

function updateBoxes(pintu1, pintu2) {
  let pintu1Div = document.getElementById('pintu1');
  let pintu2Div = document.getElementById('pintu2');

  pintu1Div.innerHTML = pintu1 + 'M';
  pintu2Div.innerHTML = pintu2 + 'M';
}

// Function to update charts
function updateCharts(lineChartDivId, xArray, yArray) {
  const lineChartDiv = document.getElementById(lineChartDivId);
  if (!lineChartDiv) {
    //console.error(`Element with ID ${lineChartDivId} not found`);
    return;
  }

  const data_update = { x: [xArray], y: [yArray] };
  Plotly.update(lineChartDiv, data_update);
}

// Ensure fetchSensorData is called after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', (event) => {
  fetchSensorData();
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

// Panggil fungsi ini ketika halaman selesai dimuat
window.addEventListener('load', (event) => {
  fetchConnectionStatus();
});

// Fungsi untuk mengambil status koneksi
function fetchConnectionStatus() {
  const statusElement = document.getElementById('connection-status');

  axios
    .get('http://localhost:9999/v1/devices/mandalika', {
      headers: {
        Accept: 'application/json',
      },
    })
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

// Panggil fungsi ini ketika halaman selesai dimuat
window.addEventListener('load', (event) => {
  fetchConnectionStatus();
});
