/* ============================================
   CLAY CLOCK — script.js
   ============================================ */

/* --------------------------------------------
   1. STATE
   -------------------------------------------- */
const state = {
  showSeconds: false,
  use12Hour: false,
  darkMode: false,
  panelOpen: false,
};


/* --------------------------------------------
   2. DOM REFERENCES
   -------------------------------------------- */
const clockEl       = document.getElementById('clock');
const ampmEl        = document.getElementById('ampm');
const gearBtn       = document.getElementById('gearBtn');
const fullscreenBtn  = document.getElementById('fullscreenBtn');
const fullscreenIcon = document.getElementById('fullscreenIcon');
const settingsPanel = document.getElementById('settingsPanel');
const formatToggle  = document.getElementById('formatToggle');
const hourToggle    = document.getElementById('hourToggle');
const themeToggle   = document.getElementById('themeToggle');
const labelHHMM     = document.getElementById('labelHHMM');
const labelHHMMSS   = document.getElementById('labelHHMMSS');
const label24H      = document.getElementById('label24H');
const label12H      = document.getElementById('label12H');
const labelLight    = document.getElementById('labelLight');
const labelDark     = document.getElementById('labelDark');


/* --------------------------------------------
   3. CLOCK — render & tick
   -------------------------------------------- */
function getTimeString() {
  const now = new Date();

  let hours = now.getHours();
  const mm  = String(now.getMinutes()).padStart(2, '0');
  const ss  = String(now.getSeconds()).padStart(2, '0');

  if (state.use12Hour) {
    // Determine am/pm then convert to 12H with leading zero
    const period = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12; // 0 → 12 for midnight
    const hh = String(hours).padStart(2, '0');

    // Update the ampm element text live
    ampmEl.textContent = period;

    if (state.showSeconds) {
      return `${hh}<span class="sep">:</span>${mm}<span class="sep">:</span>${ss}`;
    }
    return `${hh}<span class="sep">:</span>${mm}`;

  } else {
    const hh = String(hours).padStart(2, '0');

    if (state.showSeconds) {
      return `${hh}<span class="sep">:</span>${mm}<span class="sep">:</span>${ss}`;
    }
    return `${hh}<span class="sep">:</span>${mm}`;
  }
}

function renderClock() {
  clockEl.innerHTML = getTimeString();
}

function startClock() {
  renderClock();

  // Sync tick to the exact start of the next second
  const now = new Date();
  const msUntilNextSecond = 1000 - now.getMilliseconds();

  setTimeout(() => {
    renderClock();
    // After sync, tick every second precisely
    setInterval(renderClock, 1000);
  }, msUntilNextSecond);
}


/* --------------------------------------------
   4. CONTROLS VISIBILITY
   -------------------------------------------- */
let hideTimer = null;
const HIDE_DELAY = 3000; // ms of inactivity before hiding

function showControls() {
  document.body.classList.add('controls-visible');
  clearTimeout(hideTimer);
  hideTimer = setTimeout(hideControls, HIDE_DELAY);
}

function hideControls() {
  // Don't hide if the settings panel is open
  if (state.panelOpen) return;
  document.body.classList.remove('controls-visible');
}

document.addEventListener('mousemove', showControls);
document.addEventListener('touchstart', showControls, { passive: true });

// Show on load briefly so user knows the gear is there
showControls();

/* --------------------------------------------
   FULLSCREEN TOGGLE
   -------------------------------------------- */
function updateFullscreenIcon() {
  if (document.fullscreenElement) {
    fullscreenIcon.classList.replace('fa-expand', 'fa-compress');
  } else {
    fullscreenIcon.classList.replace('fa-compress', 'fa-expand');
  }
}

fullscreenBtn.addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});

// Sync icon if user exits fullscreen via Escape key
document.addEventListener('fullscreenchange', updateFullscreenIcon);

/* --------------------------------------------
   5. SETTINGS PANEL — open / close
   -------------------------------------------- */
function openPanel() {
  state.panelOpen = true;
  settingsPanel.classList.remove('closing');
  settingsPanel.classList.add('open');
  settingsPanel.setAttribute('aria-hidden', 'false');

  gearBtn.classList.remove('closing');
  gearBtn.classList.add('open');

  // Keep controls visible while panel is open
  clearTimeout(hideTimer);
}

function closePanel() {
  state.panelOpen = false;
  settingsPanel.classList.remove('open');
  settingsPanel.classList.add('closing');
  settingsPanel.setAttribute('aria-hidden', 'true');

  gearBtn.classList.remove('open');
  gearBtn.classList.add('closing');

  // Remove closing class after animation finishes
  setTimeout(() => {
    settingsPanel.classList.remove('closing');
    gearBtn.classList.remove('closing');
  }, 380);

  // Restart the hide timer now that panel is closed
  hideTimer = setTimeout(hideControls, HIDE_DELAY);
}

function togglePanel() {
  if (state.panelOpen) {
    closePanel();
  } else {
    openPanel();
  }
}

gearBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePanel();
});

// Close panel when clicking outside
document.addEventListener('click', (e) => {
  if (
    state.panelOpen &&
    !settingsPanel.contains(e.target) &&
    !gearBtn.contains(e.target)
  ) {
    closePanel();
  }
});

// Close panel on Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.panelOpen) {
    closePanel();
  }
});


/* --------------------------------------------
   6. FORMAT TOGGLE — HH:MM ↔ HH:MM:SS
   -------------------------------------------- */
function updateFormatLabels() {
  if (state.showSeconds) {
    labelHHMM.classList.remove('active');
    labelHHMMSS.classList.add('active');
  } else {
    labelHHMM.classList.add('active');
    labelHHMMSS.classList.remove('active');
  }
}

formatToggle.addEventListener('change', () => {
  state.showSeconds = formatToggle.checked;
  clockEl.classList.toggle('show-seconds', state.showSeconds);
  updateFormatLabels();
  renderClock(); // instant update, no waiting for next tick
});


/* --------------------------------------------
   7. HOUR FORMAT TOGGLE — 24H ↔ 12H
   -------------------------------------------- */
function updateHourLabels() {
  if (state.use12Hour) {
    label24H.classList.remove('active');
    label12H.classList.add('active');
    ampmEl.classList.add('visible');
  } else {
    label24H.classList.add('active');
    label12H.classList.remove('active');
    ampmEl.classList.remove('visible');
  }
}

hourToggle.addEventListener('change', () => {
  state.use12Hour = hourToggle.checked;
  updateHourLabels();
  renderClock();
});


/* --------------------------------------------
   8. THEME TOGGLE — Light ↔ Dark
   -------------------------------------------- */
function applyTheme(dark) {
  document.documentElement.setAttribute(
    'data-theme',
    dark ? 'dark' : 'light'
  );
}

function updateThemeLabels() {
  if (state.darkMode) {
    labelLight.classList.remove('active');
    labelDark.classList.add('active');
  } else {
    labelLight.classList.add('active');
    labelDark.classList.remove('active');
  }
}

function detectSystemTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  state.darkMode = prefersDark;
  themeToggle.checked = prefersDark;
  applyTheme(prefersDark);
  updateThemeLabels();
}

themeToggle.addEventListener('change', () => {
  state.darkMode = themeToggle.checked;
  applyTheme(state.darkMode);
  updateThemeLabels();
});

// React to OS-level theme changes in real time
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  state.darkMode = e.matches;
  themeToggle.checked = e.matches;
  applyTheme(e.matches);
  updateThemeLabels();
});


/* --------------------------------------------
   8. INIT
   -------------------------------------------- */
function init() {
  detectSystemTheme();     // auto-detect OS theme
  updateFormatLabels();    // set HH:MM as active label
  startClock();            // start ticking
}

init();