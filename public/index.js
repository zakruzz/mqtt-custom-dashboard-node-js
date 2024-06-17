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

  // Setup SSE connections for device status
  setupSSEConnMan1();
  setupSSEConnMan2();

  // Setup SSE connections for measurements
  setupSSEMeasurementsMan1();
  setupSSEMeasurementsMan2();

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

// Callback function that will retrieve our latest sensor readings and redraw our Gauge with the latest readings
// Callback function that will retrieve our latest sensor readings and redraw our Gauge with the latest readings
function updateSensorReadings(inLevelSeries, outLevelSeries) {
  if (inLevelSeries) {
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

    updateBoxes(pintu1[pintu1.length - 1], null);
    updateCharts('pintu1-history', timestamps, pintu1);
  }

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

    updateBoxes(null, pintu2[pintu2.length - 1]);
    updateCharts('pintu2-history', timestamps, pintu2);
  }
}

function updateBoxes(pintu1, pintu2) {
  let pintu1Div = document.getElementById('pintu1');
  let pintu2Div = document.getElementById('pintu2');
  let pintu1Status = document.getElementById('status-inlet');
  let pintu2Status = document.getElementById('status-outlet');

  if (pintu1 !== null) {
    pintu1Div.innerHTML = pintu1 + 'M';
    if (pintu1Status) {
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
    }
  }

  if (pintu2 !== null) {
    pintu2Div.innerHTML = pintu2 + 'M';
    if (pintu2Status) {
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

function setupSSEMeasurementsMan1() {
  const eventSource = new EventSource(`/api/measurementsEvents/mandalika1`);

  eventSource.addEventListener('measurement-data', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received measurement data for mandalika1:', data);

    updateSensorReadings(data.series, null); // Assuming data structure has a property 'series' for the measurements
  });

  eventSource.onerror = (error) => {
    console.error('Error with SSE for measurements mandalika1:', error);
  };
}

function setupSSEMeasurementsMan2() {
  const eventSource = new EventSource(`/api/measurementsEvents/mandalika2`);

  eventSource.addEventListener('measurement-data', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received measurement data for mandalika2:', data);

    updateSensorReadings(null, data.series); // Assuming data structure has a property 'series' for the measurements
  });

  eventSource.onerror = (error) => {
    console.error('Error with SSE for measurements mandalika2:', error);
  };
}

function pollDeviceStatusMandalika1() {
  setInterval(() => {
    axios
      .get(`/api/devicesStatus/mandalika1`)
      .then((response) => {
        const data = response.data;
        console.log('Polling response:', data);

        const statusElement = document.getElementById('connection-status1');
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
      })
      .catch((error) => {
        console.error('Error polling device status:', error);
        const statusElement = document.getElementById('connection-status1');
        statusElement.innerText = 'DISCONNECTED';
        statusElement.style.color = 'red';
      });
  }, 10000); // Setiap 30 detik
}

function pollDeviceStatusMandalika2() {
  setInterval(() => {
    axios
      .get(`/api/devicesStatus/mandalika2`)
      .then((response) => {
        const data = response.data;
        console.log('Polling response:', data);

        const statusElement = document.getElementById('connection-status2');
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
      })
      .catch((error) => {
        console.error('Error polling device status:', error);
        const statusElement = document.getElementById('connection-status2');
        statusElement.innerText = 'DISCONNECTED';
        statusElement.style.color = 'red';
      });
  }, 10000); // Setiap 30 detik
}

function setupSSEConnMan1() {
  if (window.eventSource) {
    window.eventSource.close();
  }

  window.eventSource = new EventSource(`/api/devicesEvents/mandalika1`);

  window.eventSource.addEventListener('device-status-change', (event) => {
    const data = JSON.parse(event.data);
    console.log('Received SSE data:', data);

    const statusElement = document.getElementById('connection-status1');
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
  pollDeviceStatusMandalika1();
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
