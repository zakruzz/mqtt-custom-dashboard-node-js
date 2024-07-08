// Target specific HTML items
const sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu-btn');
const closeBtn = document.querySelector('#close-btn');
const themeToggler = document.querySelector('.theme-toggler');

// Holds the background color of all chart
var chartBGColor = getComputedStyle(document.body).getPropertyValue('--chart-background');
var chartFontColor = getComputedStyle(document.body).getPropertyValue('--chart-font-color');
var chartAxisColor = getComputedStyle(document.body).getPropertyValue('--chart-axis-color');

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

  chartBGColor = getComputedStyle(document.body).getPropertyValue('--chart-background');
  chartFontColor = getComputedStyle(document.body).getPropertyValue('--chart-font-color');
  chartAxisColor = getComputedStyle(document.body).getPropertyValue('--chart-axis-color');
  updateChartsBackground();
});

const inLevelHistoryDiv = document.getElementById('pintu1-history');
const historyCharts = [inLevelHistoryDiv];

const inLevelTrace = {
  x: [],
  y: [],
  name: 'water level 1',
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

const config = { responsive: true, displayModeBar: false };

window.addEventListener('load', async () => {
  Plotly.newPlot(inLevelHistoryDiv, [inLevelTrace], inLevelLayout, config);

  await fetchInitialData('mandalika1', 'waterlevel');
  await fetchInitialStatus('mandalika1');
  await fetchInitialControlStatus('mandalika1');
  await fetchInitialDataSlider('mandalika1', 'waterlevel');

  setupSSEMeasurements('mandalika1');
  setupSSEDeviceStatus('mandalika1');
  setupSSEControlStatus('mandalika1');

  handleDeviceChange(mediaQuery);
});

async function fetchInitialData(deviceId, source) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/measurements/${source}/data`);
    const data = response.data;
    updateSensorReadings(data.series);
    updateTable(data.series);
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }
}

// Function to fetch initial slider data from API
let watchRules = []; // Definisikan watchRules di luar fungsi fetchInitialDataSlider

async function fetchInitialDataSlider(device, source) {
  try {
    const response = await axios.get(`/v1/watches/${device}/measurements/${source}`);
    const data = response.data;
    console.log(data.watchRules);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Maximal');
    sliderAman.noUiSlider.set([data.watchRules[0].evalBoundary.lower, data.watchRules[0].evalBoundary.upper]);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Minimal');
    sliderAman.noUiSlider.set([data.watchRules[1].evalBoundary.lower, data.watchRules[1].evalBoundary.upper]);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Mid');
    sliderAman.noUiSlider.set([data.watchRules[2].evalBoundary.lower, data.watchRules[2].evalBoundary.upper]);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Aman');
    sliderAman.noUiSlider.set([data.watchRules[3].evalBoundary.lower, data.watchRules[3].evalBoundary.upper]);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Siaga-1');
    sliderAman.noUiSlider.set([data.watchRules[4].evalBoundary.lower, data.watchRules[4].evalBoundary.upper]);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Siaga-2');
    sliderAman.noUiSlider.set([data.watchRules[5].evalBoundary.lower, data.watchRules[5].evalBoundary.upper]);
    // Update slider 'Set-Point-Aman' with new values
    var sliderAman = document.getElementById('Set-Point-Bahaya');
    sliderAman.noUiSlider.set([data.watchRules[6].evalBoundary.lower, data.watchRules[6].evalBoundary.upper]);

    console.log('Updated slidersData and watchRules:', slidersData, watchRules);
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }
}

async function fetchInitialStatus(deviceId) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/status`);
    const data = response.data;
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
  } catch (error) {
    console.error('Error fetching initial status:', error);
  }
}

async function fetchInitialControlStatus(deviceId) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/controls/watergate/status`);
    const data = response.data;
    const statusElement = document.getElementById('gate-status');
    if (data.currentState === 'STARTED') {
      statusElement.innerText = 'STARTED';
      statusElement.style.color = 'green';
    } else if (data.currentState === 'STOPPED') {
      statusElement.innerText = 'STOPPED';
      statusElement.style.color = 'red';
    } else if (data.currentState === 'OPENED') {
      statusElement.innerText = 'OPENED';
      statusElement.style.color = 'green';
    } else if (data.currentState === 'CLOSED') {
      statusElement.innerText = 'CLOSED';
      statusElement.style.color = 'green';
    } else {
      statusElement.innerText = 'UNKNOWN';
      statusElement.style.color = 'grey';
    }
  } catch (error) {
    console.error('Error fetching initial control status:', error);
  }
}
function setupSSEMeasurements(deviceId) {
  const eventSource = new EventSource(`/api/measurementsEvents/${deviceId}`);

  eventSource.addEventListener('measurement-data', (event) => {
    const data = JSON.parse(event.data);
    updateSensorReadings(data.series);
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
    const statusElement = document.getElementById('connection-status1');
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

function setupSSEControlStatus(deviceId) {
  const eventSource = new EventSource(`/api/devices/${deviceId}/controls/watergate/events`);

  eventSource.onmessage = (event) => {
    const data = JSON.parse(event.data);
    const statusElement = document.getElementById('gate-status');
    if (data.currentState === 'STARTED') {
      statusElement.innerText = 'STARTED';
      statusElement.style.color = 'green';
    } else if (data.currentState === 'STOPPED') {
      statusElement.innerText = 'STOPPED';
      statusElement.style.color = 'red';
    } else if (data.currentState === 'OPENED') {
      statusElement.innerText = 'OPENED';
      statusElement.style.color = 'green';
    } else if (data.currentState === 'CLOSED') {
      statusElement.innerText = 'CLOSED';
      statusElement.style.color = 'green';
    } else {
      statusElement.innerText = 'UNKNOWN';
      statusElement.style.color = 'grey';
    }
  };

  eventSource.onerror = (error) => {
    console.error('Error with SSE for control status:', error);
  };
}

document.getElementById('pintu1-up').addEventListener('click', () => {
  fetch('/api/data/mandalika1/control/open', {
    method: 'POST',
    body: JSON.stringify({ value: 'OPEN' }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.succeed);
    })
    .catch((error) => {
      console.error('Error opening gate:', error);
    });
});

document.getElementById('pintu1-down').addEventListener('click', () => {
  fetch('/api/data/mandalika1/control/close', {
    method: 'POST',
    body: JSON.stringify({ value: 'CLOSE' }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.succeed);
    })
    .catch((error) => {
      console.error('Error closing gate:', error);
    });
});

document.getElementById('relay-on').addEventListener('click', () => {
  fetch('/api/data/mandalika1/control/start', {
    method: 'POST',
    body: JSON.stringify({ value: 'START' }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.succeed);
    })
    .catch((error) => {
      console.error('Error starting relay:', error);
    });
});

document.getElementById('relay-off').addEventListener('click', () => {
  fetch('/api/data/mandalika1/control/stop', {
    method: 'POST',
    body: JSON.stringify({ value: 'STOP' }),
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert(data.succeed);
    })
    .catch((error) => {
      console.error('Error stopping relay:', error);
    });
});

function updateSensorReadings(inLevelSeries) {
  if (inLevelSeries && inLevelSeries.length >= 0) {
    // Mengurutkan data berdasarkan timestamp terbaru
    inLevelSeries.sort((a, b) => b.timestamp - a.timestamp);

    // Ambil elemen terbaru setelah pengurutan
    const latestData = inLevelSeries[0];
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

    updateBoxes(latestData.value);
    updateCharts('pintu1-history', timestamps, pintu1);
  } else {
    console.error('inLevelSeries is empty or undefined');
  }
}

function updateBoxes(latestValue) {
  let pintu1Div = document.getElementById('pintu1');
  let pintu1Status = document.getElementById('status-inlet');

  if (pintu1Div && pintu1Status) {
    pintu1Div.innerHTML = latestValue + 'M';
    if (latestValue <= 200) {
      pintu1Status.innerText = 'Aman';
      pintu1Status.style.color = 'rgb(99, 209, 35)'; // Green
    } else if (latestValue <= 400) {
      pintu1Status.innerText = 'Siaga 1';
      pintu1Status.style.color = '#ffcc00';
    } else if (latestValue <= 600) {
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

function updateCharts(lineChartDivId, xArray, yArray) {
  const lineChartDiv = document.getElementById(lineChartDivId);
  if (!lineChartDiv) {
    return;
  }

  const data_update = { x: [xArray], y: [yArray] };
  Plotly.update(lineChartDiv, data_update);
}

function updateChartsBackground() {
  var updateHistory = {
    plot_bgcolor: chartBGColor,
    paper_bgcolor: chartBGColor,
    font: { color: chartFontColor },
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

mediaQuery.addEventListener('change', (e) => {
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

let data = [];

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

function updateTable(inLevelSeries) {
  data = inLevelSeries.map((item, index) => ({
    id: index + 1,
    name: 'mandalika1',
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

// Tambahan di awal untuk menyimpan referensi ke setiap slider
let sliders = {};
let slidersData = {
  'Set-Point-Maximal': { lower: null, upper: null },
  'Set-Point-Minimal': { lower: null, upper: null },
  'Set-Point-Mid': { lower: null, upper: null },
  'Set-Point-Aman': { lower: null, upper: null },
  'Set-Point-Siaga-1': { lower: null, upper: null },
  'Set-Point-Siaga-2': { lower: null, upper: null },
  'Set-Point-Bahaya': { lower: null, upper: null },
};

// Fungsi untuk mengupdate nilai lower dan upper pada slidersData
function updateSliderData(sliderId, values) {
  slidersData[sliderId].lower = values[0];
  slidersData[sliderId].upper = values[1];
}

document.addEventListener('DOMContentLoaded', function () {
  var sliderConfigs = [
    { id: 'Set-Point-Maximal', values: [0, 0] },
    { id: 'Set-Point-Minimal', values: [0, 0] },
    { id: 'Set-Point-Mid', values: [0, 0] },
    { id: 'Set-Point-Aman', values: [0, 0] },
    { id: 'Set-Point-Siaga-1', values: [0, 0] },
    { id: 'Set-Point-Siaga-2', values: [0, 0] },
    { id: 'Set-Point-Bahaya', values: [0, 0] },
  ];

  sliderConfigs.forEach(function (sliderConfig) {
    var sliderElement = document.getElementById(sliderConfig.id);
    noUiSlider.create(sliderElement, {
      start: sliderConfig.values,
      connect: true,
      range: {
        min: 0,
        max: 1000,
      },
      tooltips: [true, true],
      format: {
        to: function (value) {
          return parseInt(value);
        },
        from: function (value) {
          return parseInt(value);
        },
      },
    });

    // Simpan referensi ke slider dalam objek sliders
    sliders[sliderConfig.id] = sliderElement;

    sliderElement.noUiSlider.on('update', function (values, handle) {
      document.getElementById(sliderConfig.id + '-value').innerHTML = values.join(' - ');
      updateSliderData(sliderConfig.id, values); // Update slidersData dengan nilai baru
    });
  });
});

// Tambahkan event listener untuk tombol accept
document.getElementById('Set-Point-Accept').addEventListener('click', () => {
  const data = {
    evalWindow: {
      startInterval: 1,
      windowDuration: 5,
      timeUnit: 'MINUTES',
    },
    watchRules: [
      {
        ruleLabel: 'MAXIMAL',
        evalBoundary: slidersData['Set-Point-Maximal'],
        evalPriority: 7,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 7,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'MINIMAL',
        evalBoundary: slidersData['Set-Point-Minimal'],
        evalPriority: 2,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 2,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'MID',
        evalBoundary: slidersData['Set-Point-Mid'],
        evalPriority: 3,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'STOP',
              },
              skipWhile: 'STOPPED',
              executePriority: 3,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'NORMAL',
        evalBoundary: slidersData['Set-Point-Aman'],
        evalPriority: 4,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 4,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'SIAGA 1',
        evalBoundary: slidersData['Set-Point-Siaga-1'],
        evalPriority: 5,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 5,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'SIAGA 2',
        evalBoundary: slidersData['Set-Point-Siaga-2'],
        evalPriority: 6,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 6,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'BAHAYA',
        evalBoundary: slidersData['Set-Point-Bahaya'],
        evalPriority: 7,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 7,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
    ],
  };

  fetch('/v1/watches/mandalika1/measurements/waterlevel', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.status === 409) {
        // Throw an error to handle the 409 status
        return response.text().then((text) => {
          throw new Error(text || 'Conflict');
        });
      }
      return response.json();
    })
    .then((data) => {
      alert('Setpoint telah diatur');
    })
    .catch((error) => {
      if (error.message === 'Conflict') {
        alert('Ups! Mungkin Sebelumnya Anda Sudah Mengatur Setpoint! Silahkan Rubah Slider Kemudian Tekan Tombol Update Setpoint Untuk Memperbaruinya!');
      } else {
        alert('Ups! Mungkin Ada Kesalahan Kodingan atau Mungkin Sebelumnya Anda Sudah Mengatur Setpoint! Silahkan Rubah Slider Kemudian Tekan Tombol Update Setpoint Untuk Memperbaruinya!');
      }
      console.error('Error sending data to the API:', error);
    });
});

// Tambahkan event listener untuk tombol accept
document.getElementById('Set-Point-Update').addEventListener('click', () => {
  const data = {
    evalWindow: {
      startInterval: 1,
      windowDuration: 5,
      timeUnit: 'MINUTES',
    },
    watchRules: [
      {
        ruleLabel: 'MAXIMAL',
        evalBoundary: slidersData['Set-Point-Maximal'],
        evalPriority: 1,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 1,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'MINIMAL',
        evalBoundary: slidersData['Set-Point-Minimal'],
        evalPriority: 2,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 2,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'MID',
        evalBoundary: slidersData['Set-Point-Mid'],
        evalPriority: 3,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'STOP',
              },
              skipWhile: 'STOPPED',
              executePriority: 3,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'NORMAL',
        evalBoundary: slidersData['Set-Point-Aman'],
        evalPriority: 4,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 4,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'SIAGA 1',
        evalBoundary: slidersData['Set-Point-Siaga-1'],
        evalPriority: 5,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 5,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'SIAGA 2',
        evalBoundary: slidersData['Set-Point-Siaga-2'],
        evalPriority: 6,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 6,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
      {
        ruleLabel: 'BAHAYA',
        evalBoundary: slidersData['Set-Point-Bahaya'],
        evalPriority: 7,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika1',
                target: 'watergate',
              },
              commandValue: {
                value: 'OPEN',
              },
              skipWhile: 'OPENED',
              executePriority: 7,
            },
          ],
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      },
    ],
  };

  fetch('/v1/watches/mandalika1/measurements/waterlevel', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert('Setpoint telah diperbarui');
    })
    .catch((error) => {
      alert('Ups! Mungkin Ada Kesalahan Kodingan!');
      console.error('Error sending data to the API:', error);
    });
});

// Tambahkan event listener untuk tombol reset
document.getElementById('Set-Point-Delete').addEventListener('click', () => {
  fetch('/v1/watches/mandalika1/measurements/waterlevel', {
    method: 'DELETE',
    headers: {
      Accept: '*/*',
    },
  })
    .then((response) => {
      if (response.ok) {
        alert('Setpoint Berhasil direset! Silahkan Atur Ulang Kembali Setpoint!');

        // Set semua slider ke 0 setelah setpoint direset
        for (const sliderId in sliders) {
          if (sliders.hasOwnProperty(sliderId)) {
            console.log(`Resetting slider ${sliderId} to [0, 0]`);
            sliders[sliderId].noUiSlider.set([0, 0]);
            updateSliderData(sliderId, [0, 0]); // Update slidersData dengan nilai baru
          }
        }
      } else {
        return response.text().then((text) => {
          throw new Error(text);
        });
      }
    })
    .catch((error) => {
      console.error('Error resetting setpoint:', error);
      alert('Failed to reset setpoint');
    });
});

async function startInterval() {
  // Fungsi untuk memulai SSE connections
  async function startSSEManualDevice() {
    try {
      await fetchInitialStatus('mandalika2');
    } catch (error) {
      console.error('Error saat menjalankan fungsi SSE:', error);
    }
  }

  async function startSSEManualSensor() {
    try {
      await fetchInitialData('mandalika2', 'waterlevel');
    } catch (error) {
      console.error('Error saat menjalankan fungsi SSE:', error);
    }
  }

  setInterval(startSSEManualSensor, 30000);
  setInterval(startSSEManualDevice, 1000);
}

// Mulai interval pertama kali
startInterval();
