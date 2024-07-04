const sideMenu = document.querySelector('aside');
const menuBtn = document.querySelector('#menu-btn');
const closeBtn = document.querySelector('#close-btn');
const themeToggler = document.querySelector('.theme-toggler');

let chartBGColor = getComputedStyle(document.body).getPropertyValue('--chart-background');
let chartFontColor = getComputedStyle(document.body).getPropertyValue('--chart-font-color');
let chartAxisColor = getComputedStyle(document.body).getPropertyValue('--chart-axis-color');

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

const outLevelHistoryDiv = document.getElementById('pintu2-history');
const historyCharts = [outLevelHistoryDiv];

const outLevelTrace = {
  x: [],
  y: [],
  name: 'water level 2',
  mode: 'lines+markers',
  type: 'line',
};

const outLevelLayout = {
  autosize: true,
  title: { text: 'Outlet Gate' },
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

const config = { responsive: true, displayModeBar: false };

window.addEventListener('load', async () => {
  Plotly.newPlot(outLevelHistoryDiv, [outLevelTrace], outLevelLayout, config);

  await fetchInitialData('mandalika2', 'waterlevel');
  await fetchInitialStatus('mandalika2');
  await fetchInitialControlStatus('mandalika2');

  setupSSEMeasurements('mandalika2');
  setupSSEDeviceStatus('mandalika2');
  setupSSEControlStatus('mandalika2');

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

async function fetchInitialStatus(deviceId) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/status`);
    const data = response.data;
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
  } catch (error) {
    console.error('Error fetching initial status:', error);
  }
}

async function fetchInitialControlStatus(deviceId) {
  try {
    const response = await axios.get(`/api/devices/${deviceId}/controls/watergate/status`);
    const data = response.data;
    const statusElement = document.getElementById('gate-status2');
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
    const statusElement = document.getElementById('connection-status2');
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
    const statusElement = document.getElementById('gate-status2');
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

document.getElementById('pintu2-up').addEventListener('click', () => {
  fetch('/api/data/mandalika2/control/open', {
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

document.getElementById('pintu2-down').addEventListener('click', () => {
  fetch('/api/data/mandalika2/control/close', {
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
  fetch('/api/data/mandalika2/control/start', {
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
  fetch('/api/data/mandalika2/control/stop', {
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

function updateSensorReadings(outLevelSeries) {
  if (outLevelSeries && outLevelSeries.length > 0) {
    // Mengurutkan data berdasarkan timestamp terbaru
    outLevelSeries.sort((a, b) => b.timestamp - a.timestamp);

    // Ambil elemen terbaru setelah pengurutan
    const latestData = outLevelSeries[0];
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
    updateBoxes(latestData.value);
    updateCharts('pintu2-history', timestamps, pintu2);
  } else {
    console.error('inLevelSeries is empty or undefined');
  }
}

function updateBoxes(latestValue) {
  let pintu2Div = document.getElementById('pintu2');
  let pintu2Status = document.getElementById('status-outlet');

  if (pintu2Div && pintu2Status) {
    pintu2Div.innerHTML = latestValue + 'M';
    if (latestValue <= 200) {
      pintu2Status.innerText = 'Aman';
      pintu2Status.style.color = 'rgb(99, 209, 35)'; // Green
    } else if (latestValue <= 400) {
      pintu2Status.innerText = 'Siaga 1';
      pintu2Status.style.color = '#ffcc00';
    } else if (latestValue <= 600) {
      pintu2Status.innerText = 'Siaga 2';
      pintu2Status.style.color = '#ff6600';
    } else {
      pintu2Status.innerText = 'Bahaya';
      pintu2Status.style.color = '#ff0000';
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

function updateTable(outLevelSeries) {
  data = outLevelSeries.map((item, index) => ({
    id: index + 1,
    name: 'mandalika2',
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

// Tambahan di awal untuk menyimpan nilai lower dan upper dari setiap slider
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
  var sliders = [
    { id: 'Set-Point-Maximal', values: [5, 9] },
    { id: 'Set-Point-Minimal', values: [1, 4] },
    { id: 'Set-Point-Mid', values: [1, 4] },
    { id: 'Set-Point-Aman', values: [2, 8] },
    { id: 'Set-Point-Siaga-1', values: [1, 9] },
    { id: 'Set-Point-Siaga-2', values: [3, 7] },
    { id: 'Set-Point-Bahaya', values: [4, 6] },
  ];

  sliders.forEach(function (slider) {
    var sliderElement = document.getElementById(slider.id);
    noUiSlider.create(sliderElement, {
      start: slider.values,
      connect: true,
      range: {
        min: 0,
        max: 10,
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

    sliderElement.noUiSlider.on('update', function (values, handle) {
      document.getElementById(slider.id + '-value').innerHTML = values.join(' - ');
      updateSliderData(slider.id, values); // Update slidersData dengan nilai baru
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
        evalPriority: 1,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika2',
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
                device: 'mandalika2',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 1,
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
                device: 'mandalika2',
                target: 'watergate',
              },
              commandValue: {
                value: 'STOP',
              },
              skipWhile: 'STOPPED',
              executePriority: 1,
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
                device: 'mandalika2',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 1,
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
                device: 'mandalika2',
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
        ruleLabel: 'SIAGA 2',
        evalBoundary: slidersData['Set-Point-Siaga-2'],
        evalPriority: 6,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika2',
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
        ruleLabel: 'BAHAYA',
        evalBoundary: slidersData['Set-Point-Bahaya'],
        evalPriority: 7,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika2',
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
    ],
  };

  fetch('/v1/watches/mandalika2/measurements/waterlevel', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert('Data successfully sent to the API');
    })
    .catch((error) => {
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
                device: 'mandalika2',
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
                device: 'mandalika2',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 1,
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
                device: 'mandalika2',
                target: 'watergate',
              },
              commandValue: {
                value: 'STOP',
              },
              skipWhile: 'STOPPED',
              executePriority: 1,
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
                device: 'mandalika2',
                target: 'watergate',
              },
              commandValue: {
                value: 'CLOSE',
              },
              skipWhile: 'CLOSED',
              executePriority: 1,
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
                device: 'mandalika2',
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
        ruleLabel: 'SIAGA 2',
        evalBoundary: slidersData['Set-Point-Siaga-2'],
        evalPriority: 6,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika2',
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
        ruleLabel: 'BAHAYA',
        evalBoundary: slidersData['Set-Point-Bahaya'],
        evalPriority: 7,
        responseAction: {
          commandSpecs: [
            {
              targetIdentifier: {
                device: 'mandalika2',
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
    ],
  };

  fetch('/v1/watches/mandalika2/measurements/waterlevel', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => response.json())
    .then((data) => {
      alert('Data successfully sent to the API');
    })
    .catch((error) => {
      console.error('Error sending data to the API:', error);
    });
});

// Tambahkan event listener untuk tombol reset
document.getElementById('Set-Point-Delete').addEventListener('click', () => {
  fetch('/v1/watches/mandalika2/measurements/waterlevel', {
    method: 'DELETE',
    headers: {
      Accept: '*/*',
    },
  })
    .then((response) => {
      if (response.ok) {
        alert('Setpoint successfully reset');
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
