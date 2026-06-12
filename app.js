/*
  focusboard MVP
  - task manager
  - focus timer
  - localStorage persistence
  - accessible interactions
*/

(() => {
  const STORAGE_KEY = 'focusboard:mvp-state';
  const FOCUS_DURATION_SECONDS = 25 * 60;

  const state = {
    tasks: [],
    timer: {
      remainingSeconds: FOCUS_DURATION_SECONDS,
      isRunning: false,
      startedAt: null,
      lastUpdatedAt: null
    }
  };

  const elements = {
    taskForm: document.getElementById('task-form'),
    taskInput: document.getElementById('task-input'),
    taskList: document.getElementById('task-list'),
    taskEmpty: document.getElementById('task-empty'),
    taskSummary: document.getElementById('task-summary'),
    progressPercent: document.getElementById('progress-percent'),
    progressFill: document.getElementById('progress-fill'),
    activeCount: document.getElementById('active-count'),
    headerProgressLabel: document.getElementById('header-progress-label'),
    heroTaskPreview: document.getElementById('hero-task-preview'),
    sessionLength: document.getElementById('session-length'),
    timerDisplay: document.getElementById('timer-display'),
    timerStatus: document.getElementById('timer-status'),
    startPauseBtn: document.getElementById('start-pause-btn'),
    resetBtn: document.getElementById('reset-btn'),
    timerRing: document.querySelector('.timer-ring')
  };

  let timerIntervalId = null;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.tasks)) {
        state.tasks = parsed.tasks.map((task) => ({
          id: String(task.id),
          text: String(task.text),
          completed: Boolean(task.completed)
        }));
      }

      if (parsed.timer) {
        state.timer.remainingSeconds = clampSeconds(parsed.timer.remainingSeconds);
        state.timer.isRunning = Boolean(parsed.timer.isRunning);
        state.timer.startedAt = parsed.timer.startedAt || null;
        state.timer.lastUpdatedAt = parsed.timer.lastUpdatedAt || null;
      }
    } catch (error) {
      console.warn('Could not restore focusboard state.', error);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function clampSeconds(value) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return FOCUS_DURATION_SECONDS;
    return Math.min(Math.max(Math.floor(numeric), 0), FOCUS_DURATION_SECONDS);
  }

  function reconcileTimerFromWallClock() {
    if (!state.timer.isRunning || !state.timer.lastUpdatedAt) return;

    const now = Date.now();
    const elapsedSeconds = Math.floor((now - state.timer.lastUpdatedAt) / 1000);
    if (elapsedSeconds <= 0) return;

    state.timer.remainingSeconds = Math.max(state.timer.remainingSeconds - elapsedSeconds, 0);
    state.timer.lastUpdatedAt = now;

    if (state.timer.remainingSeconds === 0) {
      state.timer.isRunning = false;
      state.timer.startedAt = null;
      stopTimerInterval();
    }
  }

  function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  function getProgress() {
    const total = state.tasks.length;
    const completed = state.tasks.filter((task) => task.completed).length;
    const active = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return { total, completed, active, percent };
  }

  function createTask(text) {
    return {
      id: String(Date.now() + Math.random()),
      text,
      completed: false
    };
  }

  function addTask(text) {
    const cleaned = text.trim();
    if (!cleaned) return;

    state.tasks.unshift(createTask(cleaned));
    saveState();
    renderTasks();
  }

  function toggleTask(taskId) {
    state.tasks = state.tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    saveState();
    renderTasks();
  }

  function deleteTask(taskId) {
    state.tasks = state.tasks.filter((task) => task.id !== taskId);
    saveState();
    renderTasks();
  }

  function renderHeroPreview(progress) {
    const previewTasks = state.tasks.slice(0, 3);

    if (previewTasks.length === 0) {
      elements.heroTaskPreview.innerHTML = `
        <div class="task preview-task"><span>add a task to begin</span><span class="dot"></span></div>
        <div class="task preview-task"><span>start one focus block</span><span class="dot"></span></div>
        <div class="task preview-task"><span>let progress stay visible</span><span class="dot"></span></div>
      `;
      return;
    }

    elements.heroTaskPreview.innerHTML = previewTasks
      .map(
        (task) => `
          <div class="task preview-task">
            <span>${escapeHtml(task.text)}${task.completed ? ' — done' : ''}</span>
            <span class="dot"></span>
          </div>
        `
      )
      .join('');

    elements.headerProgressLabel.textContent = `${progress.percent}% complete`;
  }

  function renderTasks() {
    const progress = getProgress();

    elements.taskSummary.textContent = `${progress.completed} of ${progress.total} complete`;
    elements.progressPercent.textContent = `${progress.percent}%`;
    elements.progressFill.style.width = `${progress.percent}%`;
    elements.activeCount.textContent = String(progress.active);
    elements.headerProgressLabel.textContent = `${progress.percent}% complete`;

    elements.taskEmpty.hidden = progress.total > 0;
    elements.taskList.hidden = progress.total === 0;

    if (progress.total === 0) {
      elements.taskList.innerHTML = '';
      renderHeroPreview(progress);
      return;
    }

    elements.taskList.innerHTML = state.tasks
      .map(
        (task) => `
          <li class="task-item ${task.completed ? 'is-complete' : ''}" data-task-id="${task.id}">
            <input
              class="task-checkbox"
              type="checkbox"
              aria-label="Mark ${escapeAttribute(task.text)} as complete"
              ${task.completed ? 'checked' : ''}
            />
            <span class="task-text">${escapeHtml(task.text)}</span>
            <button class="icon-btn" type="button" aria-label="Delete ${escapeAttribute(task.text)}">Delete</button>
          </li>
        `
      )
      .join('');

    renderHeroPreview(progress);
  }

  function renderTimer() {
    elements.timerDisplay.textContent = formatTime(state.timer.remainingSeconds);
    elements.timerStatus.textContent = state.timer.isRunning
      ? 'running'
      : state.timer.remainingSeconds === FOCUS_DURATION_SECONDS
        ? 'ready'
        : state.timer.remainingSeconds === 0
          ? 'complete'
          : 'paused';

    elements.startPauseBtn.textContent = state.timer.isRunning ? 'Pause' : 'Start';
    elements.timerRing.classList.toggle('is-running', state.timer.isRunning);
    document.title = `${formatTime(state.timer.remainingSeconds)} — focusboard`;
    saveState();
  }

  function tickTimer() {
    reconcileTimerFromWallClock();
    renderTimer();

    if (state.timer.remainingSeconds === 0) {
      stopTimerInterval();
    }
  }

  function startTimerInterval() {
    if (timerIntervalId) return;
    timerIntervalId = window.setInterval(tickTimer, 1000);
  }

  function stopTimerInterval() {
    if (!timerIntervalId) return;
    window.clearInterval(timerIntervalId);
    timerIntervalId = null;
  }

  function startTimer() {
    if (state.timer.remainingSeconds === 0) {
      state.timer.remainingSeconds = FOCUS_DURATION_SECONDS;
    }

    state.timer.isRunning = true;
    state.timer.startedAt = state.timer.startedAt || Date.now();
    state.timer.lastUpdatedAt = Date.now();
    startTimerInterval();
    renderTimer();
  }

  function pauseTimer() {
    reconcileTimerFromWallClock();
    state.timer.isRunning = false;
    state.timer.startedAt = null;
    stopTimerInterval();
    renderTimer();
  }

  function resetTimer() {
    state.timer.remainingSeconds = FOCUS_DURATION_SECONDS;
    state.timer.isRunning = false;
    state.timer.startedAt = null;
    state.timer.lastUpdatedAt = null;
    stopTimerInterval();
    renderTimer();
  }

  function toggleTimer() {
    if (state.timer.isRunning) {
      pauseTimer();
    } else {
      startTimer();
    }
  }

  function escapeHtml(text) {
    return text
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function escapeAttribute(text) {
    return escapeHtml(text);
  }

  function bindEvents() {
    elements.taskForm.addEventListener('submit', (event) => {
      event.preventDefault();
      addTask(elements.taskInput.value);
      elements.taskInput.value = '';
      elements.taskInput.focus();
    });

    elements.taskList.addEventListener('click', (event) => {
      const taskItem = event.target.closest('.task-item');
      if (!taskItem) return;

      const taskId = taskItem.dataset.taskId;
      if (!taskId) return;

      if (event.target.classList.contains('icon-btn')) {
        deleteTask(taskId);
        return;
      }

      if (event.target.classList.contains('task-checkbox')) {
        toggleTask(taskId);
      }
    });

    elements.startPauseBtn.addEventListener('click', toggleTimer);
    elements.resetBtn.addEventListener('click', resetTimer);

    window.addEventListener('beforeunload', saveState);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && state.timer.isRunning) {
        reconcileTimerFromWallClock();
        renderTimer();
      }
    });
  }

  function init() {
    loadState();
    reconcileTimerFromWallClock();
    elements.sessionLength.textContent = String(FOCUS_DURATION_SECONDS / 60);
    bindEvents();
    renderTasks();
    renderTimer();

    if (state.timer.isRunning) {
      startTimerInterval();
    }
  }

  init();
})();
