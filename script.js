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

/* ============================================
   TIMER — full implementation
   ============================================ */

/* --------------------------------------------
   TIMER STATE
   -------------------------------------------- */
const timerState = {
  active: false,        // timer mode on/off
  running: false,       // countdown ticking
  totalSeconds: 0,      // seconds set by user
  remaining: 0,         // seconds left
  interval: null,       // setInterval handle
  // Set values per unit
  setHours: 0,
  setMinutes: 0,
  setSeconds: 0,
};


/* --------------------------------------------
   TIMER DOM REFS
   -------------------------------------------- */
const timerToggle      = document.getElementById('timerToggle');
const labelTimerOff    = document.getElementById('labelTimerOff');
const labelTimerOn     = document.getElementById('labelTimerOn');
const timerDisplay     = document.getElementById('timerDisplay');
const timerDigits      = document.getElementById('timerDigits');
const timerControls    = document.getElementById('timerControls');
const timerStartBtn    = document.getElementById('timerStartBtn');
const timerStartIcon   = document.getElementById('timerStartIcon');
const timerStartLabel  = document.getElementById('timerStartLabel');
const timerResetBtn    = document.getElementById('timerResetBtn');
const clockDisplay     = document.getElementById('clockDisplay');
const miniClockWrapper = document.getElementById('miniClockWrapper');
const miniClockEl      = document.getElementById('miniClock');
const miniAmpmEl       = document.getElementById('miniAmpm');

const unitHours   = document.getElementById('timerHours');
const unitMinutes = document.getElementById('timerMinutes');
const unitSeconds = document.getElementById('timerSeconds');
const secSep      = document.getElementById('timerSecSep');

const digitEls = {
  hours:   unitHours.querySelector('.timer-digit'),
  minutes: unitMinutes.querySelector('.timer-digit'),
  seconds: unitSeconds.querySelector('.timer-digit'),
};


/* --------------------------------------------
   MINI CLOCK — renders HH:MM in top left
   -------------------------------------------- */
function renderMiniClock() {
  const now = new Date();
  let hours = now.getHours();
  const mm  = String(now.getMinutes()).padStart(2, '0');

  if (state.use12Hour) {
    const period = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12 || 12;
    const hh = String(hours).padStart(2, '0');
    miniClockEl.innerHTML = `${hh}<span class="sep">:</span>${mm}`;
    miniAmpmEl.textContent = period;
    miniAmpmEl.classList.add('visible');
  } else {
    const hh = String(hours).padStart(2, '0');
    miniClockEl.innerHTML = `${hh}<span class="sep">:</span>${mm}`;
    miniAmpmEl.classList.remove('visible');
  }
}

let miniClockInterval = null;

function startMiniClock() {
  renderMiniClock();
  miniClockInterval = setInterval(renderMiniClock, 1000);
}

function stopMiniClock() {
  clearInterval(miniClockInterval);
  miniClockInterval = null;
}


/* --------------------------------------------
   TIMER DISPLAY HELPERS
   -------------------------------------------- */
function pad(n) {
  return String(n).padStart(2, '0');
}

function updateTimerDisplay(h, m, s) {
  digitEls.hours.textContent   = pad(h);
  digitEls.minutes.textContent = pad(m);
  digitEls.seconds.textContent = pad(s);
}

// Collapse units that are zero during countdown
function applyCountdownCollapse(h, m, s) {
  if (h > 0) {
    // Show all three
    unitHours.classList.remove('hidden-unit');
    unitMinutes.classList.remove('hidden-unit');
    unitSeconds.classList.remove('hidden-unit');
    secSep.classList.remove('hidden-sep');
    timerDigits.classList.add('has-hours');
    timerDigits.classList.remove('has-minutes');
    // Show both seps
    document.querySelectorAll('.timer-sep').forEach(s => s.classList.remove('hidden-sep'));
  } else if (m > 0) {
    // Hide hours
    unitHours.classList.add('hidden-unit');
    unitSeconds.classList.remove('hidden-unit');
    unitMinutes.classList.remove('hidden-unit');
    timerDigits.classList.remove('has-hours');
    timerDigits.classList.add('has-minutes');
    // Hide first sep (between hours and minutes), show second
    const seps = document.querySelectorAll('.timer-sep');
    seps[0].classList.add('hidden-sep');
    seps[1].classList.remove('hidden-sep');
  } else {
    // Only seconds remain
    unitHours.classList.add('hidden-unit');
    unitMinutes.classList.add('hidden-unit');
    timerDigits.classList.remove('has-hours');
    timerDigits.classList.remove('has-minutes');
    unitSeconds.classList.remove('hidden-unit');
    document.querySelectorAll('.timer-sep').forEach(s => s.classList.add('hidden-sep'));
  }
}

// In setting mode — always show all three units
function resetCollapseForSetting() {
  unitHours.classList.remove('hidden-unit');
  unitMinutes.classList.remove('hidden-unit');
  unitSeconds.classList.remove('hidden-unit');
  document.querySelectorAll('.timer-sep').forEach(s => s.classList.remove('hidden-sep'));
  timerDigits.classList.remove('has-hours', 'has-minutes');
}

function getTotalSeconds() {
  return timerState.setHours * 3600
       + timerState.setMinutes * 60
       + timerState.setSeconds;
}

function updateStartBtn() {
  const total = getTotalSeconds();
  timerStartBtn.disabled = (total === 0 && !timerState.running);
}


/* --------------------------------------------
   CHIME — Web Audio API
   -------------------------------------------- */
function playChime() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Three gentle sine tones in sequence
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  let time = ctx.currentTime;

  notes.forEach((freq, i) => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);

    // Gentle attack and decay
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.22, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.55);

    osc.start(time);
    osc.stop(time + 0.6);

    time += 0.28; // overlap slightly for warmth
  });
}


/* --------------------------------------------
   COUNTDOWN LOGIC
   -------------------------------------------- */
function tick() {
  if (timerState.remaining <= 0) {
    clearInterval(timerState.interval);
    timerState.interval = null;
    timerState.running = false;

    // Show 00 (all collapsed)
    applyCountdownCollapse(0, 0, 0);
    updateTimerDisplay(0, 0, 0);

    // Play chime
    playChime();

    // Reset to setting mode after brief pause
    setTimeout(() => {
      timerState.setHours   = 0;
      timerState.setMinutes = 0;
      timerState.setSeconds = 0;
      timerState.remaining  = 0;
      updateTimerDisplay(0, 0, 0);
      resetCollapseForSetting();
      setSettableMode(true);
      updateStartBtn();
      setStartBtnState('start');
    }, 1500);

    return;
  }

  timerState.remaining--;
  const h = Math.floor(timerState.remaining / 3600);
  const m = Math.floor((timerState.remaining % 3600) / 60);
  const s = timerState.remaining % 60;

  updateTimerDisplay(h, m, s);
  applyCountdownCollapse(h, m, s);
}

function setStartBtnState(mode) {
  if (mode === 'start') {
    timerStartIcon.className = 'fa-solid fa-play';
    timerStartLabel.textContent = 'Start';
  } else {
    timerStartIcon.className = 'fa-solid fa-pause';
    timerStartLabel.textContent = 'Pause';
  }
}

// Mark units as settable (draggable) or not
function setSettableMode(on) {
  [unitHours, unitMinutes, unitSeconds].forEach(u => {
    if (on) u.classList.add('settable');
    else    u.classList.remove('settable');
  });
}


/* --------------------------------------------
   TIMER CONTROLS — start/pause/reset
   -------------------------------------------- */
timerStartBtn.addEventListener('click', () => {
  if (!timerState.running) {
    // START
    if (timerState.remaining === 0) {
      // Fresh start — lock in set values
      timerState.remaining = getTotalSeconds();
      // Determine initial collapse level
      const h = timerState.setHours;
      const m = timerState.setMinutes;
      const s = timerState.setSeconds;
      applyCountdownCollapse(h, m, s);
    }

    timerState.running = true;
    setSettableMode(false);
    setStartBtnState('pause');
    timerState.interval = setInterval(tick, 1000);

  } else {
    // PAUSE
    timerState.running = false;
    clearInterval(timerState.interval);
    timerState.interval = null;
    setStartBtnState('start');
  }
});

timerResetBtn.addEventListener('click', () => {
  clearInterval(timerState.interval);
  timerState.interval = null;
  timerState.running   = false;
  timerState.remaining = 0;
  timerState.setHours   = 0;
  timerState.setMinutes = 0;
  timerState.setSeconds = 0;

  updateTimerDisplay(0, 0, 0);
  resetCollapseForSetting();
  setSettableMode(true);
  setStartBtnState('start');
  updateStartBtn();
});


/* --------------------------------------------
   SCROLL / DRAG INPUT on timer units
   -------------------------------------------- */
function changeUnit(unit, delta) {
  // Only allow changes when not running
  if (timerState.running) return;

  if (unit === 'hours') {
    timerState.setHours = (timerState.setHours - delta + 24) % 24;
    digitEls.hours.textContent = pad(timerState.setHours);
  } else if (unit === 'minutes') {
    timerState.setMinutes = (timerState.setMinutes - delta + 60) % 60;
    digitEls.minutes.textContent = pad(timerState.setMinutes);
  } else if (unit === 'seconds') {
    timerState.setSeconds = (timerState.setSeconds - delta + 60) % 60;
    digitEls.seconds.textContent = pad(timerState.setSeconds);
  }

  // Reset remaining so a fresh start uses new values
  timerState.remaining = 0;
  updateStartBtn();
}

// Mouse wheel
[unitHours, unitMinutes, unitSeconds].forEach(unitEl => {
  unitEl.addEventListener('wheel', (e) => {
    if (!timerState.active || timerState.running) return;
    e.preventDefault();
    const unit  = unitEl.querySelector('.timer-digit').dataset.unit;
    const delta = e.deltaY > 0 ? 1 : -1; // scroll down = decrease
    changeUnit(unit, delta);
  }, { passive: false });
});

// Touch drag (mobile) — drag up = increase, drag down = decrease
let touchStartY   = 0;
let touchUnit     = null;
let touchAccum    = 0;
const DRAG_THRESH = 18; // px per step

[unitHours, unitMinutes, unitSeconds].forEach(unitEl => {
  unitEl.addEventListener('touchstart', (e) => {
    if (!timerState.active || timerState.running) return;
    touchStartY = e.touches[0].clientY;
    touchUnit   = unitEl.querySelector('.timer-digit').dataset.unit;
    touchAccum  = 0;
  }, { passive: true });

  unitEl.addEventListener('touchmove', (e) => {
    if (!timerState.active || timerState.running || !touchUnit) return;
    e.preventDefault();
    const dy = touchStartY - e.touches[0].clientY; // positive = dragged up
    touchAccum += dy;
    touchStartY = e.touches[0].clientY;

    while (touchAccum >= DRAG_THRESH) {
      changeUnit(touchUnit, -1); // drag up = increase
      touchAccum -= DRAG_THRESH;
    }
    while (touchAccum <= -DRAG_THRESH) {
      changeUnit(touchUnit, 1);  // drag down = decrease
      touchAccum += DRAG_THRESH;
    }
  }, { passive: false });

  unitEl.addEventListener('touchend', () => {
    touchUnit  = null;
    touchAccum = 0;
  });
});


/* --------------------------------------------
   TIMER MODE ON / OFF
   -------------------------------------------- */
function enterTimerMode() {
  timerState.active = true;
  timerControls.classList.add('timer-active');

  // Animate clock display out
  clockDisplay.classList.add('hidden');

  // Show mini clock in top left
  startMiniClock();
  requestAnimationFrame(() => {
    miniClockWrapper.classList.add('visible');
  });

  // Show timer display — two-step to trigger CSS transition
  timerDisplay.classList.add('animating');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      timerDisplay.classList.add('visible');
    });
  });

  // Ensure setting mode
  setSettableMode(true);
  resetCollapseForSetting();
  updateStartBtn();
}

function exitTimerMode() {
  timerState.active = false;

  // Stop any running countdown
  clearInterval(timerState.interval);
  timerState.interval  = null;
  timerState.running   = false;
  timerState.remaining = 0;
  timerState.setHours   = 0;
  timerState.setMinutes = 0;
  timerState.setSeconds = 0;
  updateTimerDisplay(0, 0, 0);
  resetCollapseForSetting();
  setStartBtnState('start');

  timerControls.classList.remove('timer-active');

  // Animate timer display out
  timerDisplay.classList.remove('visible');
  setTimeout(() => timerDisplay.classList.remove('animating'), 450);

  // Animate mini clock out
  miniClockWrapper.classList.remove('visible');
  setTimeout(stopMiniClock, 500);

  // Animate clock display back in
  setTimeout(() => {
    clockDisplay.classList.remove('hidden');
  }, 200);
}

timerToggle.addEventListener('change', () => {
  if (timerToggle.checked) {
    labelTimerOff.classList.remove('active');
    labelTimerOn.classList.add('active');
    enterTimerMode();
  } else {
    labelTimerOff.classList.add('active');
    labelTimerOn.classList.remove('active');
    exitTimerMode();
  }
});

// Init timer labels
labelTimerOff.classList.add('active');