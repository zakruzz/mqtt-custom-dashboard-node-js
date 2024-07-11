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
  await fetchInitialDataSetpoint('mandalika2', 'waterlevel');

  loadFormData();

  setupSSEMeasurements('mandalika2');
  setupSSEDeviceStatus('mandalika2');
  setupSSEControlStatus('mandalika2');

  handleDeviceChange(mediaQuery);
});

let watchRules = []; // Definisikan watchRules di luar fungsi fetchInitialDataSetpoint

async function fetchInitialDataSetpoint(device, source) {
  try {
    const response = await axios.get(`/v1/watches/${device}/measurements/${source}`);
    const data = response.data;
    watchRules = data.watchRules;
  } catch (error) {
    console.error('Error fetching initial data:', error);
  }
}

function loadFormData() {
  const apiData = JSON.parse(localStorage.getItem('formDataMandalika2'));

  if (apiData) {
    const evalWindow = apiData.evalWindow;
    document.getElementById('startInterval').value = evalWindow.startInterval;
    document.getElementById('end-time').value = evalWindow.windowDuration;
    document.getElementById('timeUnit').value = evalWindow.timeUnit;

    apiData.statusParameters.forEach((statusParameter, index) => {
      addStatusParameter();
      const currentIndex = index + 1;

      document.querySelector(`#status-name-${currentIndex}`).value = statusParameter.ruleLabel;
      document.querySelector(`#range-start-${currentIndex}`).value = statusParameter.evalBoundary.lower;
      document.querySelector(`#range-end-${currentIndex}`).value = statusParameter.evalBoundary.upper;
      document.querySelector(`#eval-priority-${currentIndex}`).value = statusParameter.evalPriority;

      statusParameter.responseAction.commandSpecs.forEach((commandSpec, cmdIndex) => {
        if (cmdIndex > 0) {
          addExecutionParameter({ target: document.querySelector(`#status-name-${currentIndex}`).parentElement });
        }
        document.querySelector(`#execution-command-${currentIndex}-${cmdIndex + 1}`).value = commandSpec.value;
        document.querySelector(`#execution-priority-${currentIndex}-${cmdIndex + 1}`).value = commandSpec.priority; // Load executePriority here
      });
    });
  }
}

function saveFormData() {
  const evalWindow = {
    startInterval: parseInt(document.getElementById('startInterval').value, 10),
    windowDuration: parseInt(document.getElementById('end-time').value, 10),
    timeUnit: document.getElementById('timeUnit').value,
  };

  const statusParameters = [];
  document.querySelectorAll('.status-parameter').forEach((statusParameter, index) => {
    const ruleLabel = statusParameter.querySelector(`#status-name-${index + 1}`).value;
    const evalBoundary = {
      lower: parseFloat(statusParameter.querySelector(`#range-start-${index + 1}`).value),
      upper: parseFloat(statusParameter.querySelector(`#range-end-${index + 1}`).value),
    };
    const evalPriority = parseInt(statusParameter.querySelector(`#eval-priority-${index + 1}`).value, 10);

    if (ruleLabel && !isNaN(evalBoundary.lower) && !isNaN(evalBoundary.upper) && !isNaN(evalPriority)) {
      const commandSpecs = [];
      const executionParameters = statusParameter.querySelectorAll('.execution-parameter-wrapper');
      executionParameters.forEach((executionParameter, cmdIndex) => {
        const commandValue = executionParameter.querySelector(`#execution-command-${index + 1}-${cmdIndex + 1}`).value;
        const executePriority = parseInt(executionParameter.querySelector(`#execution-priority-${index + 1}-${cmdIndex + 1}`).value, 10);

        if (commandValue && !isNaN(executePriority)) {
          commandSpecs.push({
            value: commandValue,
            priority: executePriority, // Save executePriority here
          });
        }
      });

      statusParameters.push({
        ruleLabel: ruleLabel,
        evalBoundary: evalBoundary,
        evalPriority: evalPriority,
        responseAction: {
          commandSpecs: commandSpecs,
          actionType: 'DISPATCH_CONTROL_COMMANDS',
        },
      });
    }
  });

  const formData = {
    evalWindow: evalWindow,
    statusParameters: statusParameters,
  };

  localStorage.setItem('formDataMandalika2', JSON.stringify(formData));
}

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
  if (outLevelSeries && outLevelSeries.length >= 0) {
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

    updateBoxes(Number(latestData.value)); // Ensure the value is a number
    updateCharts('pintu2-history', timestamps, pintu2);
  } else {
    console.error('inLevelSeries is empty or undefined');
  }
}

function getStatusFromValue(latestValue, watchRules) {
  for (const rule of watchRules) {
    if (latestValue >= rule.evalBoundary.lower && latestValue <= rule.evalBoundary.upper) {
      return {
        statusText: rule.ruleLabel,
        color: getColorFromLabel(rule.ruleLabel),
      };
    }
  }
  return null;
}

function getColorFromLabel(ruleLabel) {
  switch (ruleLabel) {
    case 'Aman':
      return 'rgb(99, 209, 35)'; // Green
    case 'Siaga 1':
      return '#ffcc00'; // Yellow
    case 'Siaga 2':
      return '#ff6600'; // Orange
    case 'Bahaya':
      return '#ff0000'; // Red
    default:
      return '#000000'; // Black as default
  }
}

function updateBoxes(latestValue) {
  let pintu2Div = document.getElementById('pintu2');
  let pintu2Status = document.getElementById('status-outlet');

  if (pintu2Div && pintu2Status) {
    pintu2Div.innerHTML = latestValue + 'M';
    const status = getStatusFromValue(latestValue, watchRules);

    if (status) {
      pintu2Div.innerHTML = latestValue + 'M';
      pintu2Status.innerText = status.statusText;
      pintu2Status.style.color = status.color;
    } else {
      console.error('No matching status found for the given value:', latestValue);
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

document.getElementById('Set-Point-Accept').addEventListener('click', () => {
  const evalWindow = {
    startInterval: parseInt(document.getElementById('startInterval').value, 10),
    windowDuration: parseInt(document.getElementById('end-time').value, 10),
    timeUnit: document.getElementById('timeUnit').value,
  };

  const watchRules = [];
  const statusParameters = document.querySelectorAll('.status-parameter');

  statusParameters.forEach((statusParameter, index) => {
    const ruleLabel = statusParameter.querySelector(`#status-name-${index + 1}`).value;
    const evalBoundary = {
      lower: parseFloat(statusParameter.querySelector(`#range-start-${index + 1}`).value),
      upper: parseFloat(statusParameter.querySelector(`#range-end-${index + 1}`).value),
    };

    const evalPriority = parseInt(statusParameter.querySelector(`#eval-priority-${index + 1}`).value, 10);

    const commandSpecs = [];
    const executionParameters = statusParameter.querySelectorAll('.execution-parameter-wrapper');
    executionParameters.forEach((executionParameter, cmdIndex) => {
      const commandValue = executionParameter.querySelector(`#execution-command-${index + 1}-${cmdIndex + 1}`).value;
      const executePriority = parseInt(executionParameter.querySelector(`#execution-priority-${index + 1}-${cmdIndex + 1}`).value, 10);

      let skipWhile;
      switch (commandValue) {
        case 'START':
          skipWhile = 'STARTED';
          break;
        case 'STOP':
          skipWhile = 'STOPPED';
          break;
        case 'OPEN':
          skipWhile = 'OPENED';
          break;
        case 'CLOSE':
          skipWhile = 'CLOSED';
          break;
        default:
          skipWhile = '';
      }

      commandSpecs.push({
        targetIdentifier: {
          device: 'mandalika2',
          target: 'watergate',
        },
        commandValue: {
          value: commandValue,
        },
        skipWhile: skipWhile,
        executePriority: executePriority,
      });
    });

    watchRules.push({
      ruleLabel: ruleLabel,
      evalBoundary: evalBoundary,
      evalPriority: evalPriority,
      responseAction: {
        commandSpecs: commandSpecs,
        actionType: 'DISPATCH_CONTROL_COMMANDS',
      },
    });
  });

  const data = {
    evalWindow: evalWindow,
    watchRules: watchRules,
  };

  fetch('/v1/watches/mandalika2/measurements/waterlevel', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      if (response.status === 409) {
        return response.text().then((text) => {
          throw new Error(text || 'Conflict');
        });
      }
      return response.json();
    })
    .then((data) => {
      // Simpan data ke localStorage setelah berhasil submit
      localStorage.setItem('apiDataMandalika2', JSON.stringify({ evalWindow, watchRules }));
      saveFormData();
      // Refresh the page
      location.reload();
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

document.getElementById('Set-Point-Update').addEventListener('click', () => {
  const evalWindow = {
    startInterval: parseInt(document.getElementById('startInterval').value, 10),
    windowDuration: parseInt(document.getElementById('end-time').value, 10),
    timeUnit: document.getElementById('timeUnit').value,
  };

  const watchRules = [];
  const statusParameters = document.querySelectorAll('.status-parameter');

  statusParameters.forEach((statusParameter, index) => {
    const ruleLabel = statusParameter.querySelector(`#status-name-${index + 1}`).value;
    const evalBoundary = {
      lower: parseFloat(statusParameter.querySelector(`#range-start-${index + 1}`).value),
      upper: parseFloat(statusParameter.querySelector(`#range-end-${index + 1}`).value),
    };

    const evalPriority = parseInt(statusParameter.querySelector(`#eval-priority-${index + 1}`).value, 10);

    const commandSpecs = [];
    const executionParameters = statusParameter.querySelectorAll('.execution-parameter-wrapper');
    executionParameters.forEach((executionParameter, cmdIndex) => {
      const commandValue = executionParameter.querySelector(`#execution-command-${index + 1}-${cmdIndex + 1}`).value;
      const executePriority = parseInt(executionParameter.querySelector(`#execution-priority-${index + 1}-${cmdIndex + 1}`).value, 10);

      let skipWhile;
      switch (commandValue) {
        case 'START':
          skipWhile = 'STARTED';
          break;
        case 'STOP':
          skipWhile = 'STOPPED';
          break;
        case 'OPEN':
          skipWhile = 'OPENED';
          break;
        case 'CLOSE':
          skipWhile = 'CLOSED';
          break;
        default:
          skipWhile = '';
      }

      commandSpecs.push({
        targetIdentifier: {
          device: 'mandalika2',
          target: 'watergate',
        },
        commandValue: {
          value: commandValue,
        },
        skipWhile: skipWhile,
        executePriority: executePriority,
      });
    });

    watchRules.push({
      ruleLabel: ruleLabel,
      evalBoundary: evalBoundary,
      evalPriority: evalPriority,
      responseAction: {
        commandSpecs: commandSpecs,
        actionType: 'DISPATCH_CONTROL_COMMANDS',
      },
    });
  });

  const data = {
    evalWindow: evalWindow,
    watchRules: watchRules,
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
      // Simpan data ke localStorage setelah berhasil submit
      localStorage.setItem('apiDataMandalika2', JSON.stringify({ evalWindow, watchRules }));
      saveFormData();
      // Refresh the page
      location.reload();
      alert('Setpoint telah diperbarui');
    })
    .catch((error) => {
      alert('Ups! Mungkin Ada Kesalahan Kodingan!');
      console.error('Error sending data to the API:', error);
    });
});

document.getElementById('Set-Point-Delete').addEventListener('click', () => {
  fetch('/v1/watches/mandalika2/measurements/waterlevel', {
    method: 'DELETE',
    headers: {
      Accept: '*/*',
    },
  })
    .then((response) => {
      if (response.ok) {
        alert('Setpoint Berhasil direset! Silahkan Atur Ulang Kembali Setpoint!');

        // Clear all form elements
        const formElements = document.querySelectorAll('input, select, textarea');
        formElements.forEach((element) => {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = false;
          } else {
            element.value = '';
          }
        });

        // Remove all status parameters except the first one
        const statusParameters = document.querySelectorAll('.status-parameter');
        statusParameters.forEach((parameter, index) => {
          if (index !== 0) {
            parameter.remove();
          }
        });

        // Reset the first status parameter's fields
        const firstStatusParameter = document.querySelector('.status-parameter');
        if (firstStatusParameter) {
          firstStatusParameter.querySelectorAll('input, select, textarea').forEach((element) => {
            if (element.type === 'checkbox' || element.type === 'radio') {
              element.checked = false;
            } else {
              element.value = '';
            }
          });

          // Remove additional execution parameters
          const executionParameters = firstStatusParameter.querySelectorAll('.execution-parameter-wrapper');
          executionParameters.forEach((param, index) => {
            if (index !== 0) {
              param.remove();
            }
          });

          // Reset the first execution parameter's select field
          const firstExecutionParameter = firstStatusParameter.querySelector('.execution-parameter select');
          if (firstExecutionParameter) {
            firstExecutionParameter.value = '';
          }
        }

        // Clear localStorage
        localStorage.removeItem('apiDataMandalika2');
        localStorage.removeItem('formDataMandalika2');

        console.log('LocalStorage after reset:', localStorage); // Check localStorage

        // Refresh the page
        location.reload();
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

  setInterval(startSSEManualSensor, 5000);
  setInterval(startSSEManualDevice, 1000);
}

// Mulai interval pertama kali
startInterval();

// Fungsi untuk menambah parameter pengeksekusian
function addExecutionParameter(event) {
  const executionParameters = event.target.closest('.status-parameter').querySelector('.execution-parameters');
  const currentStatusIndex = event.target.closest('.status-parameter').dataset.index;
  const executionIndex = executionParameters.querySelectorAll('.execution-parameter-wrapper').length + 1;

  const executionTemplate = `
    <div class="execution-parameter-wrapper" data-index="${executionIndex}">
      <div class="execution-parameter" data-index="${executionIndex}">
        <select id="execution-command-${currentStatusIndex}-${executionIndex}" class="form-control" required>
          <option value="" disabled selected>PILIH PERINTAH</option>
          <option value="OPEN">BUKA</option>
          <option value="CLOSE">TUTUP</option>
          <option value="START">MULAI</option>
          <option value="STOP">BERHENTI</option>
        </select>
      </div>
      <div class="execution-priority" data-index="${executionIndex}">
        <label for="execution-priority-${currentStatusIndex}-${executionIndex}">Prioritas Pengeksekusian</label>
        <input type="number" id="execution-priority-${currentStatusIndex}-${executionIndex}" class="form-control" required />
        <small class="form-text text-muted">Untuk mengatur nomor prioritas pengeksekusian perintah, SEMAKIN BESAR ANGKANYA MAKA AKAN DIEKSEKUSI TERLEBIH DAHULU PERINTAHNYA</small>
      </div>
      <div class="execution-buttons">
        <button class="control-btn-add-execution" title="Tambah Perintah Pengeksekusian">Tambah</button>
        <button class="control-btn-delete-execution" title="Hapus Perintah Pengeksekusian">Kurang</button>
      </div>
    </div>
  `;

  const newExecutionParameter = document.createElement('div');
  newExecutionParameter.innerHTML = executionTemplate;

  // Tambahkan event listener pada tombol baru
  newExecutionParameter.querySelector('.control-btn-add-execution').addEventListener('click', addExecutionParameter);
  newExecutionParameter.querySelector('.control-btn-delete-execution').addEventListener('click', function () {
    newExecutionParameter.remove();
    saveFormData();
  });

  executionParameters.appendChild(newExecutionParameter);

  // Simpan data form setelah parameter pengeksekusian ditambahkan
  saveFormData();
}

function addStatusParameter() {
  const statusParameters = document.getElementById('status-parameters');
  const currentIndex = statusParameters.childElementCount + 1;

  const template = `
     <div class="status-parameter" data-index="${currentIndex}">
      <!-- Nama Status Parameter -->
      <div class="form-group">
        <label for="status-name-${currentIndex}">Nama Status Parameter ${currentIndex}</label>
        <input type="text" id="status-name-${currentIndex}" class="form-control" required />
        <small class="form-text text-muted">Untuk mengatur nama dari Status yang nanti ditampilkan, contoh : Aman/Siaga 1/Siaga 2/Bahaya</small>
      </div>

      <!-- Setpoint Range -->
      <div class="form-group">
        <label for="range-start-${currentIndex}">Setpoint Range</label>
        <div class="row">
          <div class="col">
            <input type="number" id="range-start-${currentIndex}" class="form-control" required />
          </div>
          <div class="col text-center">
            <strong>-</strong>
          </div>
          <div class="col">
            <input type="number" id="range-end-${currentIndex}" class="form-control" required />
          </div>
        </div>
      </div>

      <!-- Prioritas Pengevaluasi -->
      <div class="form-group">
        <label for="eval-priority-${currentIndex}">Prioritas Pengevaluasi</label>
        <input type="number" id="eval-priority-${currentIndex}" class="form-control" required />
        <small class="form-text text-muted">Untuk mengatur nomor prioritas pengevaluasian rule, SEMAKIN BESAR ANGKANYA MAKA AKAN DIEKSEKUSI TERLEBIH DAHULU RULE-NYA</small>
      </div>

      <!-- Perintah Pengeksekusian -->
      <div class="form-group">
        <label for="execution-command-${currentIndex}">Perintah Pengeksekusian</label>
        <div class="execution-parameters">
          <div class="execution-parameter-wrapper" data-index="1">
            <div class="execution-parameter" data-index="1">
              <select id="execution-command-${currentIndex}-1" class="form-control" required>
                <option value="" disabled selected>PILIH PERINTAH</option>
                <option value="OPEN">BUKA</option>
                <option value="CLOSE">TUTUP</option>
                <option value="START">MULAI</option>
                <option value="STOP">BERHENTI</option>
              </select>
            </div>
            <div class="execution-priority" data-index="1">
              <label for="execution-priority-${currentIndex}-1">Prioritas Pengeksekusian</label>
              <input type="number" id="execution-priority-${currentIndex}-1" class="form-control" required />
              <small class="form-text text-muted">Untuk mengatur nomor prioritas pengeksekusian perintah, SEMAKIN BESAR ANGKANYA MAKA AKAN DIEKSEKUSI TERLEBIH DAHULU PERINTAHNYA</small>
            </div>
          </div>
          <div class="execution-buttons">
            <button class="control-btn-add-execution" title="Tambah Perintah Pengeksekusian">Tambah</button>
            <button class="control-btn-delete-execution" title="Hapus Perintah Pengeksekusian">Kurang</button>
          </div>
        </div>
        <small class="form-text text-muted">Untuk mengatur perintah pengeksekusian dari status yang akan dibuat</small>
      </div>

      <!-- Tombol Hapus Status -->
      <button class="control-btn-delete-status">Hapus Status</button>
    </div>
  `;

  const newStatusParameter = document.createElement('div');
  newStatusParameter.innerHTML = template;
  statusParameters.appendChild(newStatusParameter);

  // Add event listeners to the new add and delete buttons
  newStatusParameter.querySelector('.control-btn-add-execution').addEventListener('click', addExecutionParameter);
  newStatusParameter.querySelector('.control-btn-delete-execution').addEventListener('click', function () {
    this.closest('.execution-parameter-wrapper').remove();
    saveFormData();
  });
  newStatusParameter.querySelector('.control-btn-delete-status').addEventListener('click', function () {
    newStatusParameter.remove();
  });
}

// Add event listener to the existing add-status button
document.getElementById('add-status').addEventListener('click', () => {
  addStatusParameter();
  saveFormData();
});

// Add event listeners to existing add-execution buttons
document.querySelectorAll('.control-btn-add-execution').forEach((button) => {
  button.addEventListener('click', addExecutionParameter);
});

// Add event listeners to existing delete buttons
document.querySelectorAll('.control-btn-delete-execution').forEach((button) => {
  button.addEventListener('click', function () {
    this.closest('.execution-parameter-wrapper').remove();
    saveFormData();
  });
});

// Add event listeners to existing delete buttons
document.querySelectorAll('.control-btn-delete-status').forEach((button) => {
  button.addEventListener('click', function () {
    button.parentElement.remove();
    saveFormData();
  });
});
