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
  responsive: true,
};

const config = { responsive: true, displayModeBar: false };

window.addEventListener('load', async () => {
  Plotly.newPlot(inLevelHistoryDiv, [inLevelTrace], inLevelLayout, config);

  await fetchInitialData('mandalika1', 'waterlevel');
  await fetchInitialStatus('mandalika1');
  await fetchInitialControlStatus('mandalika1');
  await fetchInitialDataSetpoint('mandalika1', 'waterlevel');

  setupSSEMeasurements('mandalika1');
  setupSSEDeviceStatus('mandalika1');
  setupSSEControlStatus('mandalika1');

  handleDeviceChange(mediaQuery);
});

let watchRules = []; // Define watchRules outside of the fetch function

async function fetchInitialDataSetpoint(device, source) {
  try {
    const response = await axios.get(`/v1/watches/${device}/measurements/${source}`);
    const data = response.data;
    watchRules = data.watchRules;
    populateForm(data.evalWindow, watchRules);
  } catch (error) {
    if (error.response && error.response.status === 404) {
      watchRules = [];
      clearForm();
    } else {
      console.error('Error fetching initial data:', error);
    }
  }
}

function populateForm(evalWindow, watchRules) {
  // Populate evalWindow fields
  document.getElementById('startInterval').value = evalWindow.startInterval;
  document.getElementById('windowDuration').value = evalWindow.windowDuration;
  document.getElementById('timeUnit').value = evalWindow.timeUnit;

  // Populate form fields with watchRules data
  const statusParametersContainer = document.getElementById('status-parameters');
  statusParametersContainer.innerHTML = ''; // Clear existing parameters
  watchRules.forEach((rule, index) => {
    addStatusParameter(rule, index + 1);
  });
}

function clearForm() {
  // Clear evalWindow fields
  document.getElementById('startInterval').value = '';
  document.getElementById('windowDuration').value = '';
  document.getElementById('timeUnit').selectedIndex = 0;

  // Clear all status parameters
  document.getElementById('status-parameters').innerHTML = '';
}

async function saveSetpointData(device, source, evalWindow, data) {
  try {
    const method = watchRules.length > 0 ? 'put' : 'post';
    await axios[method](`/v1/watches/${device}/measurements/${source}`, { evalWindow, watchRules: data });
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

async function deleteAllSetpoints(device, source) {
  try {
    await axios.delete(`/v1/watches/${device}/measurements/${source}`);
    clearForm();
    watchRules = [];
  } catch (error) {
    console.error('Error deleting data:', error);
  }
}

function addExecutionParameter(statusIndex, executionIndex, command = '', priority = '') {
  const executionParameterContainer = document.querySelector(`.status-parameter[data-index="${statusIndex}"] .execution-parameter-container`);
  const executionParameterHTML = `
    <div class="execution-parameter" data-index="${executionIndex}">
      <div class="row">
        <div class="col">
          <select id="execution-command-${statusIndex}-${executionIndex}" class="form-control" required>
            <option value="" disabled selected>PILIH PERINTAH</option>
            <option value="OPEN">BUKA</option>
            <option value="CLOSE">TUTUP</option>
            <option value="START">MULAI</option>
            <option value="STOP">BERHENTI</option>
          </select>
          <small class="form-text text-muted">Perintah ${executionIndex}</small>
        </div>
        <div class="col">
          <input type="number" id="execution-priority-${statusIndex}-${executionIndex}" class="form-control" required value="${priority}" />
          <small class="form-text text-muted">Prioritas ${executionIndex}</small>
        </div>
        <div class="col-auto">
          <button type="button" class="btn btn-danger hapus-execution" data-status-index="${statusIndex}" data-execution-index="${executionIndex}"><i class="material-icons">remove</i></button>
        </div>
      </div>
    </div>
  `;
  executionParameterContainer.insertAdjacentHTML('beforeend', executionParameterHTML);
  if (command) {
    document.getElementById(`execution-command-${statusIndex}-${executionIndex}`).value = command;
  }
}

function addStatusParameter(rule, index) {
  const statusParametersContainer = document.getElementById('status-parameters');
  const statusParameterHTML = `
    <div class="status-parameter" data-index="${index}">
      <div class="form-group">
        <label for="status-name-${index}">Label Status ${index}</label>
        <input type="text" id="status-name-${index}-1" class="form-control" required value="${rule ? rule.ruleLabel : ''}" />
        <small class="form-text text-muted">Untuk mengatur nama dari Status yang nanti ditampilkan, contoh : Aman/Siaga 1/Siaga 2/Bahaya</small>
      </div>
      <div class="form-group">
        <label for="range-start-${index}">Rentang Nilai Terukur</label>
        <div class="row">
          <div class="col">
            <input type="number" id="range-start-${index}-1" class="form-control" required value="${rule ? rule.evalBoundary.lower : ''}" />
          </div>
          <div class="col text-center">
            <strong>-</strong>
          </div>
          <div class="col">
            <input type="number" id="range-end-${index}-1" class="form-control" required value="${rule ? rule.evalBoundary.upper : ''}" />
          </div>
        </div>
      </div>
      <div class="form-group">
        <label for="eval-priority-${index}">Prioritas Evaluasi</label>
        <input type="number" id="eval-priority-${index}-1" class="form-control" required value="${rule ? rule.evalPriority : ''}" />
        <small class="form-text text-muted">Untuk mengatur nomor prioritas pengevaluasian rule, SEMAKIN BESAR ANGKANYA MAKA AKAN DIEKSEKUSI TERLEBIH DAHULU RULE-NYA</small>
      </div>
      <div class="form-group">
        <label for="execution-command-${index}">Perintah Eksekusi</label>
        <div class="execution-parameter-container"></div>
        <button type="button" class="btn btn-primary tambah-command" data-status-index="${index}"><i class="material-icons">add</i>Tambah Perintah</button>
      </div>
      <button type="button" class="btn btn-danger hapus-status" data-status-index="${index}"><i class="material-icons">remove</i> Hapus Rule</button>
    </div>
  `;
  statusParametersContainer.insertAdjacentHTML('beforeend', statusParameterHTML);

  if (rule) {
    rule.responseAction.commandSpecs.forEach((spec, paramIndex) => {
      addExecutionParameter(index, paramIndex + 1, spec.commandValue.value, spec.executePriority);
    });
  } else {
    addExecutionParameter(index, 1);
  }
}

document.addEventListener('DOMContentLoaded', function () {
  const toggleFormBtn = document.getElementById('toggle-form-btn');
  const setpointForm = document.getElementById('setpoint-form');

  toggleFormBtn.addEventListener('click', async function () {
    const device = 'mandalika1'; // Replace with actual device ID
    const source = 'waterlevel'; // Replace with actual source ID
    await fetchInitialDataSetpoint(device, source);
    setpointForm.classList.toggle('hidden');
    const isHidden = setpointForm.classList.contains('hidden');
    toggleFormBtn.setAttribute('data-tooltip', isHidden ? 'Perlihatkan Form Setting Setpoint' : 'Sembunyikan Form Setting Setpoint');
  });

  document.getElementById('Set-Point-Accept').addEventListener('click', async function () {
    const device = 'mandalika1'; // Replace with actual device ID
    const source = 'waterlevel'; // Replace with actual source ID

    // Gather evalWindow data
    const evalWindow = {
      startInterval: document.getElementById('startInterval').value,
      windowDuration: document.getElementById('windowDuration').value,
      timeUnit: document.getElementById('timeUnit').value,
    };

    // Gather form data into watchRules
    const newWatchRules = [];
    document.querySelectorAll('.status-parameter').forEach((element, index) => {
      const statusName = document.getElementById(`status-name-${index + 1}-1`).value;
      const lower = document.getElementById(`range-start-${index + 1}-1`).value;
      const upper = document.getElementById(`range-end-${index + 1}-1`).value;
      const evalPriority = document.getElementById(`eval-priority-${index + 1}-1`).value;
      const commandSpecs = [];

      element.querySelectorAll('.execution-parameter').forEach((paramElement, paramIndex) => {
        const command = document.getElementById(`execution-command-${index + 1}-${paramIndex + 1}`).value;
        const priority = document.getElementById(`execution-priority-${index + 1}-${paramIndex + 1}`).value;
        let skipWhile = '';
        switch (command) {
          case 'OPEN':
            skipWhile = 'OPENED';
            break;
          case 'CLOSE':
            skipWhile = 'CLOSED';
            break;
          case 'START':
            skipWhile = 'RUNNING';
            break;
          case 'STOP':
            skipWhile = 'STOPPED';
            break;
        }
        commandSpecs.push({
          targetIdentifier: {
            device: 'mandalika1', // Replace with actual device ID if necessary
            target: 'watergate', // Replace with actual target ID if necessary
          },
          commandValue: {
            value: command,
          },
          skipWhile: skipWhile,
          executePriority: parseInt(priority, 10),
        });
      });

      newWatchRules.push({
        ruleLabel: statusName,
        evalBoundary: { lower: Number(lower), upper: Number(upper) },
        evalPriority: parseInt(evalPriority, 10),
        responseAction: {
          actionType: 'DISPATCH_CONTROL_COMMANDS',
          commandSpecs: commandSpecs,
        },
      });
    });

    // Save or update setpoint data
    await saveSetpointData(device, source, evalWindow, newWatchRules);
    alert('Berhasil di Setting');
  });

  document.getElementById('Set-Point-Delete').addEventListener('click', async function () {
    const device = 'mandalika1'; // Replace with actual device ID
    const source = 'waterlevel'; // Replace with actual source ID
    await deleteAllSetpoints(device, source);
    alert('Berhasil di Reset Setting');
  });

  // Add event listeners for dynamically added buttons
  document.getElementById('status-parameters').addEventListener('click', function (event) {
    if (event.target.classList.contains('tambah-command')) {
      const statusIndex = event.target.getAttribute('data-status-index');
      const executionIndex = document.querySelectorAll(`.status-parameter[data-index="${statusIndex}"] .execution-parameter`).length + 1;
      addExecutionParameter(statusIndex, executionIndex);
    } else if (event.target.classList.contains('hapus-execution')) {
      const statusIndex = event.target.getAttribute('data-status-index');
      const executionIndex = event.target.getAttribute('data-execution-index');
      const executionParameter = document.querySelector(`.status-parameter[data-index="${statusIndex}"] .execution-parameter[data-index="${executionIndex}"]`);
      executionParameter.remove();
    } else if (event.target.classList.contains('hapus-status')) {
      const statusIndex = event.target.getAttribute('data-status-index');
      const statusParameter = document.querySelector(`.status-parameter[data-index="${statusIndex}"]`);
      statusParameter.remove();
    }
  });
});

document.getElementById('add-status').addEventListener('click', function () {
  const newIndex = document.querySelectorAll('.status-parameter').length + 1;
  addStatusParameter(null, newIndex);
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
      alert('Gate berhasil dibuka,' + data.succeed);
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
      alert('Gate berhasil ditutup,' + data.succeed);
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
      alert('Relay berhasil dijalankan,' + data.succeed);
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
      alert('Relay berhasil diberhentikan,' + data.succeed);
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
    const pintu1 = inLevelSeries.map((data) => Number(data.value));

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

    updateBoxes(Number(latestData.value)); // Ensure the value is a number
    updateCharts('pintu1-history', timestamps, pintu1);
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
    } else {
      return {
        statusText: 'Belum Tersedia',
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
  let pintu1Div = document.getElementById('pintu1');
  let pintu1Status = document.getElementById('status-inlet');

  if (pintu1Div && pintu1Status) {
    pintu1Div.innerHTML = latestValue + 'M';
    const status = getStatusFromValue(latestValue, watchRules);

    if (status != null) {
      pintu1Div.innerHTML = latestValue + 'M';
      pintu1Status.innerText = status.statusText;
      pintu1Status.style.color = status.color;
    } else {
      pintu1Status.innerText = 'Belum Tersedia';
      pintu1Status.style.color = '#000';
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
      width: 420,
      height: 250,
      'xaxis.autorange': true,
      'yaxis.autorange': true,
    };
    historyCharts.forEach((chart) => Plotly.relayout(chart, updateHistory));
  } else {
    var updateHistory = {
      width: 720,
      height: 400,
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
    value: Number(item.value),
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

async function startInterval() {
  // Fungsi untuk memulai SSE connections
  async function startSSEManualDevice() {
    try {
      await fetchInitialStatus('mandalika1');
    } catch (error) {
      console.error('Error saat menjalankan fungsi SSE:', error);
    }
  }

  async function startSSEManualSensor() {
    try {
      await fetchInitialData('mandalika1', 'waterlevel');
    } catch (error) {
      console.error('Error saat menjalankan fungsi SSE:', error);
    }
  }

  async function startSSEManualControl() {
    try {
      await fetchInitialControlStatus('mandalika1');
    } catch (error) {
      console.error('Error saat menjalankan fungsi SSE:', error);
    }
  }

  setInterval(startSSEManualSensor, 5000);
  setInterval(startSSEManualDevice, 1000);
  setInterval(startSSEManualControl, 1000);
}

// Mulai interval pertama kali
startInterval();
