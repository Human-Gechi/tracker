/**
 * Trackr Frontend Application
 * Interacts with FastAPI backend: /auth, /habits, /checkins
 */

// Application State
const state = {
  token: localStorage.getItem('trackr_token') || null,
  userEmail: localStorage.getItem('trackr_email') || null,
  activeTab: 'today',
  habits: [],
  todayItems: [],
  selectedHabitId: null,
  filter: 'all',
  searchQuery: '',
  // Today View Controls
  todayFilter: 'all', // 'all' | 'todo' | 'done'
  todaySearch: '',
  todayViewMode: 'list', // 'list' | 'grid'
};

// DOM Elements
const el = {
  app: document.getElementById('app'),
  brandLogoBtn: document.getElementById('brand-logo-btn'),
  mainNav: document.getElementById('main-nav'),
  tabs: document.querySelectorAll('.nav-tab'),
  viewPanels: document.querySelectorAll('.view-panel'),
  tabBtnLanding: document.getElementById('tab-btn-landing'),
  viewLanding: document.getElementById('view-landing'),

  // Auth Elements
  authLoggedIn: document.getElementById('auth-logged-in'),
  authLoggedOut: document.getElementById('auth-logged-out'),
  userDisplayEmail: document.getElementById('user-display-email'),
  btnLogout: document.getElementById('btn-logout'),
  btnOpenLogin: document.getElementById('btn-open-login'),
  btnOpenSignup: document.getElementById('btn-open-signup'),
  authModal: document.getElementById('auth-modal'),
  btnCloseAuthModal: document.getElementById('btn-close-auth-modal'),
  formAuth: document.getElementById('form-auth'),
  authInputEmail: document.getElementById('auth-input-email'),
  authInputPassword: document.getElementById('auth-input-password'),
  authErrorBanner: document.getElementById('auth-error-banner'),
  btnAuthSubmit: document.getElementById('btn-auth-submit'),
  authTabLogin: document.getElementById('auth-tab-login'),
  authTabSignup: document.getElementById('auth-tab-signup'),
  authModalTitle: document.getElementById('auth-modal-title'),
  passwordHint: document.getElementById('password-requirement-hint'),

  // Today View
  currentDateDisplay: document.getElementById('current-date-display'),
  todayHabitsList: document.getElementById('today-habits-list'),
  todayCountBadge: document.getElementById('today-count-badge'),
  progressRatio: document.getElementById('progress-ratio'),
  progressPercentText: document.getElementById('progress-percent-text'),
  progressBarFill: document.getElementById('progress-bar-fill'),
  btnQuickNewHabit: document.getElementById('btn-quick-new-habit'),
  todayFilterBtns: document.querySelectorAll('.today-filter-btn'),
  countTodayAll: document.getElementById('count-today-all'),
  countTodayTodo: document.getElementById('count-today-todo'),
  countTodayDone: document.getElementById('count-today-done'),
  todaySearchInput: document.getElementById('today-search-input'),
  btnModeList: document.getElementById('btn-mode-list'),
  btnModeGrid: document.getElementById('btn-mode-grid'),

  // Manage Habits View
  btnNewHabitManage: document.getElementById('btn-new-habit-manage'),
  habitSearchInput: document.getElementById('habit-search-input'),
  filterPills: document.querySelectorAll('.filter-btn'),
  allHabitsGrid: document.getElementById('all-habits-grid'),

  // Stats View
  statsHabitSelect: document.getElementById('stats-habit-select'),
  kpiCurrentStreak: document.getElementById('kpi-current-streak'),
  kpiLongestStreak: document.getElementById('kpi-longest-streak'),
  kpiCompletionRate: document.getElementById('kpi-completion-rate'),
  statsHabitTitle: document.getElementById('stats-habit-title'),
  statsHabitDesc: document.getElementById('stats-habit-desc'),
  statsActionButtons: document.getElementById('stats-action-buttons'),

  // Habit Modal
  habitModal: document.getElementById('habit-modal'),
  btnCloseHabitModal: document.getElementById('btn-close-habit-modal'),
  btnCancelHabitModal: document.getElementById('btn-cancel-habit-modal'),
  formHabit: document.getElementById('form-habit'),
  modalHabitId: document.getElementById('modal-habit-id'),
  modalHabitHeading: document.getElementById('modal-habit-heading'),
  habitInputName: document.getElementById('habit-input-name'),
  habitInputDesc: document.getElementById('habit-input-desc'),
  habitInputArchived: document.getElementById('habit-input-archived'),
  modalArchiveGroup: document.getElementById('modal-archive-group'),

  // Toast Container
  toastContainer: document.getElementById('toast-container'),
};

let authMode = 'login';

/* ==========================================================================
   API Helpers
   ========================================================================== */

const API_BASE = window.location.protocol.startsWith('http') ? '' : 'http://127.0.0.1:8000';

function getAuthHeaders(isJson = true) {
  const headers = {};
  if (isJson) headers['Content-Type'] = 'application/json';
  if (state.token) headers['Authorization'] = `Bearer ${state.token}`;
  return headers;
}

async function apiRequest(endpoint, options = {}) {
  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, options);
    
    if (response.status === 401) {
      logout();
      showToast('Session expired. Please sign in.', 'error');
      openAuthModal('login');
      throw new Error('Unauthorized');
    }

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.detail || (Array.isArray(data) ? data[0]?.msg : 'Request failed');
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    throw err;
  }
}

/* ==========================================================================
   Toast Notifications
   ========================================================================== */

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  let icon = '•';
  if (type === 'success') icon = '✓';
  if (type === 'error') icon = '✕';

  toast.innerHTML = `<span style="font-weight:700">${icon}</span><span>${escapeHtml(message)}</span>`;
  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    toast.style.transition = 'all 0.2s ease';
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ==========================================================================
   Date Formatting
   ========================================================================== */

function formatTodayDate() {
  const today = new Date();
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  return today.toLocaleDateString('en-US', options);
}

function getTodayIsoString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/* ==========================================================================
   Authentication & Home Page State
   ========================================================================== */

function checkAuthState() {
  const authTabs = document.querySelectorAll('.nav-tab.auth-only');

  if (state.token && state.userEmail) {
    el.authLoggedIn.classList.remove('hidden');
    el.authLoggedOut.classList.add('hidden');
    el.userDisplayEmail.textContent = state.userEmail;

    // Logged in: Hide Home tab, reveal private tabs
    if (el.tabBtnLanding) el.tabBtnLanding.classList.add('hidden');
    authTabs.forEach((tab) => tab.classList.remove('hidden'));
    
    if (state.activeTab === 'landing') {
      switchTab('today');
    }
    return true;
  } else {
    el.authLoggedIn.classList.add('hidden');
    el.authLoggedOut.classList.remove('hidden');

    // Logged out: Show ONLY Home tab, completely hide private tabs
    if (el.tabBtnLanding) el.tabBtnLanding.classList.remove('hidden');
    authTabs.forEach((tab) => tab.classList.add('hidden'));

    // Clear all private state from memory and DOM
    state.habits = [];
    state.todayItems = [];
    if (el.todayCountBadge) el.todayCountBadge.textContent = '0';
    if (el.todayHabitsList) el.todayHabitsList.innerHTML = '';
    if (el.allHabitsGrid) el.allHabitsGrid.innerHTML = '';

    switchTab('landing');
    return false;
  }
}

function openAuthModal(mode = 'login') {
  authMode = mode;
  el.authErrorBanner.classList.add('hidden');
  el.authErrorBanner.textContent = '';
  el.authInputPassword.value = '';

  if (mode === 'login') {
    el.authTabLogin.classList.add('active');
    el.authTabSignup.classList.remove('active');
    el.authModalTitle.textContent = 'Sign In to Trackr';
    el.btnAuthSubmit.textContent = 'Sign In';
    el.passwordHint.style.display = 'none';
  } else {
    el.authTabSignup.classList.add('active');
    el.authTabLogin.classList.remove('active');
    el.authModalTitle.textContent = 'Create Trackr Account';
    el.btnAuthSubmit.textContent = 'Create Account';
    el.passwordHint.style.display = 'block';
  }

  el.authModal.classList.remove('hidden');
  el.authInputEmail.focus();
}

function closeAuthModal() {
  el.authModal.classList.add('hidden');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  el.authErrorBanner.classList.add('hidden');
  const email = el.authInputEmail.value.trim();
  const password = el.authInputPassword.value;

  if (!email || !password) {
    el.authErrorBanner.textContent = 'Please provide both email and password.';
    el.authErrorBanner.classList.remove('hidden');
    return;
  }

  el.btnAuthSubmit.disabled = true;
  el.btnAuthSubmit.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';

  try {
    if (authMode === 'signup') {
      await apiRequest('/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      showToast('Account created. Signing in...', 'success');
    }

    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const tokenResponse = await apiRequest('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });

    state.token = tokenResponse.access_token;
    state.userEmail = email;
    localStorage.setItem('trackr_token', state.token);
    localStorage.setItem('trackr_email', state.userEmail);

    checkAuthState();
    closeAuthModal();
    switchTab('today');
    showToast(`Welcome, ${email}`, 'success');
    loadInitialData();
  } catch (err) {
    el.authErrorBanner.textContent = err.message || 'Authentication failed. Please verify credentials.';
    el.authErrorBanner.classList.remove('hidden');
  } finally {
    el.btnAuthSubmit.disabled = false;
    el.btnAuthSubmit.textContent = authMode === 'login' ? 'Sign In' : 'Create Account';
  }
}

function logout() {
  state.token = null;
  state.userEmail = null;
  state.habits = [];
  state.todayItems = [];
  state.selectedHabitId = null;
  localStorage.removeItem('trackr_token');
  localStorage.removeItem('trackr_email');
  checkAuthState();
  switchTab('landing');
  resetStatsView();
  showToast('Logged out.', 'info');
}

/* ==========================================================================
   Theme Management (Light & Dark Mode)
   ========================================================================== */

function initTheme() {
  const savedTheme = localStorage.getItem('trackr_theme');
  let theme = savedTheme;
  if (!theme) {
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  applyTheme(theme, false);
}

function applyTheme(theme, notify = true) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('trackr_theme', theme);
  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) {
    themeBtn.setAttribute('title', theme === 'dark' ? 'Switch to Light mode' : 'Switch to Dark mode');
  }
  if (notify) {
    showToast(`Switched to ${theme === 'dark' ? 'Dark' : 'Light'} Mode`, 'info');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next, true);
}

/* ==========================================================================
   Landing Page Demo Sandbox (Automatic Interval Cycling & Interaction)
   ========================================================================== */

const demoManager = {
  intervalId: null,
  step: 0,
  isPaused: false,
  isHovered: false,
  userTimeout: null,
  items: [
    { id: 1, baseStreak: 12, name: 'Morning 20m Movement', done: false },
    { id: 2, baseStreak: 7, name: 'Read 20 Pages', done: false },
    { id: 3, baseStreak: 4, name: 'Hydrate (2.5L Water)', done: false },
  ],
};

function initDemoAnimation() {
  const box = document.getElementById('landing-demo-box');
  const playPauseBtn = document.getElementById('demo-playpause-btn');

  if (playPauseBtn) {
    playPauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      demoManager.isPaused = !demoManager.isPaused;
      updatePlayPauseButtonUI();
    });
  }

  if (box) {
    box.addEventListener('mouseenter', () => {
      demoManager.isHovered = true;
    });
    box.addEventListener('mouseleave', () => {
      demoManager.isHovered = false;
    });
  }

  // Start auto-cycling interval every 2200ms
  if (demoManager.intervalId) clearInterval(demoManager.intervalId);
  demoManager.intervalId = setInterval(runDemoCycleStep, 2200);
}

function updatePlayPauseButtonUI() {
  const iconEl = document.getElementById('demo-playpause-icon');
  const textEl = document.getElementById('demo-playpause-text');
  const statusEl = document.getElementById('demo-status-label');

  if (demoManager.isPaused) {
    if (iconEl) iconEl.textContent = '▶';
    if (textEl) textEl.textContent = 'Play';
    if (statusEl) statusEl.textContent = 'Auto-animation paused';
  } else {
    if (iconEl) iconEl.textContent = '⏸';
    if (textEl) textEl.textContent = 'Pause';
    if (statusEl) statusEl.textContent = 'Auto-completing rituals...';
  }
}

function runDemoCycleStep() {
  // If user is authenticated, landing view isn't active
  if (state.token && state.activeTab !== 'landing') return;
  // If paused manually or hovered
  if (demoManager.isPaused || demoManager.isHovered) return;

  const statusEl = document.getElementById('demo-status-label');
  const currentStep = demoManager.step;

  if (currentStep < demoManager.items.length) {
    // Check next habit
    const item = demoManager.items[currentStep];
    setDemoHabitState(item.id, true, true);
    if (statusEl) {
      statusEl.textContent = `Completed ${item.name} (+1 streak!)`;
    }
    demoManager.step++;
  } else if (currentStep === demoManager.items.length) {
    // Brief completion celebration
    if (statusEl) {
      statusEl.textContent = 'All rituals completed! Resetting day... ⚡';
    }
    demoManager.step++;
  } else {
    // Reset all for the next day cycle
    demoManager.items.forEach((item) => {
      setDemoHabitState(item.id, false, false);
    });
    if (statusEl) {
      statusEl.textContent = 'A new day begins...';
    }
    demoManager.step = 0;
  }
}

function setDemoHabitState(id, isDone, shouldPop = false) {
  const item = demoManager.items.find((i) => i.id === id);
  if (!item) return;

  item.done = isDone;
  const row = document.getElementById(`demo-habit-${id}`);
  const streakEl = document.getElementById(`demo-streak-${id}`);

  if (row) {
    if (isDone) {
      row.classList.add('is-done');
    } else {
      row.classList.remove('is-done');
    }
  }

  if (streakEl) {
    const streakCount = item.baseStreak + (isDone ? 1 : 0);
    streakEl.textContent = `⚡ ${streakCount} days`;
    if (shouldPop) {
      streakEl.classList.remove('pop');
      void streakEl.offsetWidth; // Force CSS reflow for instant re-trigger
      streakEl.classList.add('pop');
    }
  }
}

function toggleDemoHabit(id) {
  const item = demoManager.items.find((i) => i.id === id);
  if (!item) return;

  const nextState = !item.done;
  setDemoHabitState(id, nextState, nextState);

  // Temporarily pause auto-cycle for 5 seconds on manual interaction
  demoManager.isHovered = true;
  clearTimeout(demoManager.userTimeout);
  const statusEl = document.getElementById('demo-status-label');
  if (statusEl) {
    statusEl.textContent = nextState
      ? `You completed "${item.name}"! Resuming auto-demo in 5s...`
      : `Unchecked "${item.name}". Resuming auto-demo in 5s...`;
  }

  demoManager.userTimeout = setTimeout(() => {
    demoManager.isHovered = false;
    const sEl = document.getElementById('demo-status-label');
    if (sEl && !demoManager.isPaused) sEl.textContent = 'Auto-completing rituals...';
  }, 5000);
}

/* ==========================================================================
   Data Fetching
   ========================================================================== */

async function loadInitialData() {
  if (!state.token) {
    return;
  }

  await Promise.all([fetchTodayHabits(), fetchAllHabits()]);
}

async function fetchTodayHabits() {
  try {
    const data = await apiRequest('/habits/today', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    state.todayItems = Array.isArray(data) ? data : [];
    renderTodayView();
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      showToast(`Could not load today's habits: ${err.message}`, 'error');
    }
  }
}

async function fetchAllHabits() {
  try {
    const data = await apiRequest('/habits/all-habits', {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    state.habits = Array.isArray(data) ? data : [];
    renderManageHabitsView();
    populateStatsSelector();
  } catch (err) {
    if (err.message !== 'Unauthorized') {
      showToast(`Could not load habits: ${err.message}`, 'error');
    }
  }
}

async function fetchHabitStats(habitId) {
  if (!habitId) {
    resetStatsView();
    return;
  }

  try {
    const stats = await apiRequest(`/habits/${habitId}/stats`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    const habit = state.habits.find((h) => h.id === Number(habitId));
    renderStatsView(stats, habit);
  } catch (err) {
    showToast(`Failed to load stats: ${err.message}`, 'error');
    resetStatsView();
  }
}

/* ==========================================================================
   Render Views
   ========================================================================== */

function renderTodayView() {
  if (!state.token) {
    return;
  }

  const allItems = state.todayItems;
  el.todayCountBadge.textContent = allItems.length;

  // Update counts on filter pills
  const totalCount = allItems.length;
  const completedCount = allItems.filter((i) => i.done_today).length;
  const todoCount = totalCount - completedCount;

  if (el.countTodayAll) el.countTodayAll.textContent = totalCount;
  if (el.countTodayTodo) el.countTodayTodo.textContent = todoCount;
  if (el.countTodayDone) el.countTodayDone.textContent = completedCount;

  updateProgressBar(completedCount, totalCount);

  if (totalCount === 0) {
    el.todayHabitsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">✨</div>
        <h3 class="empty-title">No Habits for Today</h3>
        <p class="empty-desc">Start your ritual by adding your first daily habit.</p>
        <button class="btn btn-primary" onclick="openHabitModal()">+ Add Your First Habit</button>
      </div>
    `;
    return;
  }

  // Apply Quick Filtering & Search
  let visibleItems = [...allItems];

  if (state.todayFilter === 'todo') {
    visibleItems = visibleItems.filter((i) => !i.done_today);
  } else if (state.todayFilter === 'done') {
    visibleItems = visibleItems.filter((i) => i.done_today);
  }

  if (state.todaySearch) {
    const q = state.todaySearch.toLowerCase();
    visibleItems = visibleItems.filter((i) => i.name.toLowerCase().includes(q));
  }

  // Toggle View Mode (List vs Compact Grid)
  if (state.todayViewMode === 'grid') {
    el.todayHabitsList.classList.add('compact-grid');
  } else {
    el.todayHabitsList.classList.remove('compact-grid');
  }

  if (visibleItems.length === 0) {
    el.todayHabitsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No Habits Matching Filter</h3>
        <p class="empty-desc">Try clearing your search or switching to "All" habits.</p>
      </div>
    `;
    return;
  }

  el.todayHabitsList.innerHTML = visibleItems
    .map((item) => {
      const isDone = item.done_today;
      const streak = item.current_streak || 0;
      return `
        <div class="habit-row ${isDone ? 'is-done' : ''}" data-id="${item.habit_id}">
          <div class="habit-row-left">
            <button class="check-trigger" onclick="toggleCheckin(${item.habit_id}, ${isDone})" title="${isDone ? 'Mark incomplete' : 'Complete today'}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
            <div class="habit-details" onclick="viewHabitStats(${item.habit_id})">
              <span class="habit-name">${escapeHtml(item.name)}</span>
              <span class="habit-desc">${isDone ? 'Completed today' : 'Tap checkbox to complete'}</span>
            </div>
          </div>
          <div class="habit-row-right">
            <span class="streak-counter ${streak === 0 ? 'zero' : ''}">
              ⚡ ${streak} ${streak === 1 ? 'day' : 'days'}
            </span>
          </div>
        </div>
      `;
    })
    .join('');
}

function updateProgressBar(completed, total) {
  el.progressRatio.textContent = `${completed} / ${total} Completed`;
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100);
  el.progressPercentText.textContent = `${pct}%`;
  el.progressBarFill.style.width = `${pct}%`;
}

function renderManageHabitsView() {
  if (!state.token) return;

  let filtered = [...state.habits];

  if (state.filter === 'active') {
    filtered = filtered.filter((h) => !h.is_archived);
  } else if (state.filter === 'archived') {
    filtered = filtered.filter((h) => h.is_archived);
  }

  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(
      (h) => h.name.toLowerCase().includes(q) || (h.description && h.description.toLowerCase().includes(q))
    );
  }

  if (filtered.length === 0) {
    el.allHabitsGrid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <div class="empty-icon">🔍</div>
        <h3 class="empty-title">No Habits Found</h3>
        <p class="empty-desc">${state.searchQuery ? 'No habits matching "' + escapeHtml(state.searchQuery) + '"' : 'You have no habits in this category.'}</p>
        <button class="btn btn-secondary" onclick="openHabitModal()">+ Create Habit</button>
      </div>
    `;
    return;
  }

  el.allHabitsGrid.innerHTML = filtered
    .map((habit) => {
      const isArchived = habit.is_archived;
      const createdDate = habit.created_at ? new Date(habit.created_at).toLocaleDateString() : '';
      return `
        <div class="manage-card ${isArchived ? 'archived' : ''}" data-id="${habit.id}">
          <div class="manage-card-top">
            <div class="manage-card-header">
              <h3 class="manage-card-title">${escapeHtml(habit.name)}</h3>
              <span class="status-tag ${isArchived ? 'archived' : 'active'}">
                ${isArchived ? 'Archived' : 'Active'}
              </span>
            </div>
            <p class="manage-card-desc">${habit.description ? escapeHtml(habit.description) : '<span style="color:var(--text-muted)">No description</span>'}</p>
            <div class="manage-card-meta">
              <span>Created ${createdDate}</span>
            </div>
          </div>
          <div class="manage-card-footer">
            <div class="manage-card-actions">
              <button class="btn btn-secondary btn-sm" onclick="viewHabitStats(${habit.id})">Stats</button>
              <button class="btn btn-secondary btn-sm" onclick="toggleArchiveHabit(${habit.id}, ${isArchived})">${isArchived ? 'Restore' : 'Archive'}</button>
              <button class="btn btn-secondary btn-sm" onclick="editHabit(${habit.id})">Edit</button>
              <button class="btn btn-danger btn-sm" onclick="deleteHabit(${habit.id})">Delete</button>
            </div>
          </div>
        </div>
      `;
    })
    .join('');
}

function populateStatsSelector() {
  const select = el.statsHabitSelect;
  const currentVal = select.value;
  select.innerHTML = '<option value="">Select a habit...</option>';

  state.habits.forEach((habit) => {
    const opt = document.createElement('option');
    opt.value = habit.id;
    opt.textContent = `${habit.name}${habit.is_archived ? ' (Archived)' : ''}`;
    select.appendChild(opt);
  });

  if (currentVal && state.habits.some((h) => h.id === Number(currentVal))) {
    select.value = currentVal;
  }
}

function renderStatsView(stats, habit) {
  el.kpiCurrentStreak.textContent = stats.current_streak ?? 0;
  el.kpiLongestStreak.textContent = stats.longest_streak ?? 0;
  
  const ratePct = Math.round((stats.completion_rate ?? 0) * 100);
  el.kpiCompletionRate.textContent = `${ratePct}%`;

  if (habit) {
    el.statsHabitTitle.textContent = habit.name;
    el.statsHabitDesc.textContent = habit.description || 'Consistency overview for this habit.';
    el.statsActionButtons.innerHTML = `
      <button class="btn btn-secondary btn-sm" onclick="editHabit(${habit.id})">Edit Habit</button>
    `;
  }
}

function resetStatsView() {
  el.kpiCurrentStreak.textContent = '0';
  el.kpiLongestStreak.textContent = '0';
  el.kpiCompletionRate.textContent = '0%';
  el.statsHabitTitle.textContent = 'Select a Habit Above';
  el.statsHabitDesc.textContent = 'Choose any habit to inspect historical streak metrics.';
  el.statsActionButtons.innerHTML = '';
}

/* ==========================================================================
   Habit Actions (Check-in, Create, Update, Delete, Archive)
   ========================================================================== */

async function toggleCheckin(habitId, isDone) {
  try {
    if (!isDone) {
      await apiRequest(`/habits/${habitId}/checkins`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      showToast('Checked in! ⚡ Streak updated', 'success');
    } else {
      const todayIso = getTodayIsoString();
      await apiRequest(`/habits/${habitId}/checkins/${todayIso}`, {
        method: 'DELETE',
        headers: getAuthHeaders(false),
      });
      showToast('Check-in removed', 'info');
    }

    await fetchTodayHabits();
    if (state.selectedHabitId === habitId) {
      fetchHabitStats(habitId);
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function openHabitModal(habit = null) {
  if (!state.token) {
    openAuthModal('login');
    return;
  }

  el.formHabit.reset();
  if (habit) {
    el.modalHabitId.value = habit.id;
    el.modalHabitHeading.textContent = 'Edit Habit';
    el.habitInputName.value = habit.name;
    el.habitInputDesc.value = habit.description || '';
    el.habitInputArchived.checked = Boolean(habit.is_archived);
    el.modalArchiveGroup.classList.remove('hidden');
  } else {
    el.modalHabitId.value = '';
    el.modalHabitHeading.textContent = 'Create New Habit';
    el.modalArchiveGroup.classList.add('hidden');
  }

  el.habitModal.classList.remove('hidden');
  el.habitInputName.focus();
}

function closeHabitModal() {
  el.habitModal.classList.add('hidden');
}

async function handleHabitSubmit(e) {
  e.preventDefault();
  const id = el.modalHabitId.value;
  const name = el.habitInputName.value.trim();
  const description = el.habitInputDesc.value.trim() || null;
  const is_archived = el.habitInputArchived.checked;

  if (!name) {
    showToast('Habit name is required.', 'error');
    return;
  }

  try {
    if (id) {
      await apiRequest(`/habits/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description, is_archived }),
      });
      showToast('Habit updated.', 'success');
    } else {
      await apiRequest('/habits/', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ name, description }),
      });
      showToast('Habit created!', 'success');
    }

    closeHabitModal();
    await Promise.all([fetchAllHabits(), fetchTodayHabits()]);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function editHabit(habitId) {
  const habit = state.habits.find((h) => h.id === habitId);
  if (habit) openHabitModal(habit);
}

async function toggleArchiveHabit(habitId, isArchived) {
  try {
    await apiRequest(`/habits/${habitId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_archived: !isArchived }),
    });
    showToast(!isArchived ? 'Habit archived' : 'Habit restored to active', 'info');
    await Promise.all([fetchAllHabits(), fetchTodayHabits()]);
  } catch (err) {
    showToast(err.message, 'error');
  }
}

async function deleteHabit(habitId) {
  const habit = state.habits.find((h) => h.id === habitId);
  const name = habit ? `"${habit.name}"` : 'this habit';

  if (!confirm(`Delete ${name}? All streak data will be lost.`)) {
    return;
  }

  try {
    await apiRequest(`/habits/${habitId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(false),
    });
    showToast('Habit deleted.', 'info');
    await Promise.all([fetchAllHabits(), fetchTodayHabits()]);

    if (state.selectedHabitId === habitId) {
      state.selectedHabitId = null;
      el.statsHabitSelect.value = '';
      resetStatsView();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function viewHabitStats(habitId) {
  state.selectedHabitId = habitId;
  el.statsHabitSelect.value = habitId;
  switchTab('analytics');
  fetchHabitStats(habitId);
}

/* ==========================================================================
   Navigation Tabs
   ========================================================================== */

function switchTab(tabName) {
  // Privacy & security guard: guests can only view 'landing'
  if (!state.token && tabName !== 'landing') {
    openAuthModal('login');
    tabName = 'landing';
  }

  state.activeTab = tabName;

  el.tabs.forEach((tab) => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });

  el.viewPanels.forEach((panel) => {
    if (panel.id === `view-${tabName}`) {
      panel.classList.add('active');
    } else {
      panel.classList.remove('active');
    }
  });

  if (tabName === 'today') {
    renderTodayView();
  } else if (tabName === 'habits') {
    renderManageHabitsView();
  } else if (tabName === 'analytics' && state.selectedHabitId) {
    fetchHabitStats(state.selectedHabitId);
  }
}

/* ==========================================================================
   Event Listeners Setup
   ========================================================================== */

function initEventListeners() {
  // Navigation Tabs
  el.tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  // Brand Logo Click
  if (el.brandLogoBtn) {
    el.brandLogoBtn.addEventListener('click', () => {
      if (state.token) {
        switchTab('today');
      } else {
        switchTab('landing');
      }
    });
  }

  // Auth Modal Triggers
  el.btnOpenLogin.addEventListener('click', () => openAuthModal('login'));
  el.btnOpenSignup.addEventListener('click', () => openAuthModal('signup'));
  el.btnCloseAuthModal.addEventListener('click', closeAuthModal);
  el.authTabLogin.addEventListener('click', () => openAuthModal('login'));
  el.authTabSignup.addEventListener('click', () => openAuthModal('signup'));
  el.formAuth.addEventListener('submit', handleAuthSubmit);
  el.btnLogout.addEventListener('click', logout);

  [el.authModal, el.habitModal].forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  });

  // Habit Modal Triggers
  el.btnQuickNewHabit.addEventListener('click', () => openHabitModal());
  el.btnNewHabitManage.addEventListener('click', () => openHabitModal());
  el.btnCloseHabitModal.addEventListener('click', closeHabitModal);
  el.btnCancelHabitModal.addEventListener('click', closeHabitModal);
  el.formHabit.addEventListener('submit', handleHabitSubmit);

  // Today View Controls: Filters (All, To Do, Completed)
  if (el.todayFilterBtns) {
    el.todayFilterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        el.todayFilterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        state.todayFilter = btn.dataset.filter;
        renderTodayView();
      });
    });
  }

  // Today View Controls: Quick Search Input
  if (el.todaySearchInput) {
    el.todaySearchInput.addEventListener('input', (e) => {
      state.todaySearch = e.target.value.trim();
      renderTodayView();
    });
  }

  // Today View Controls: View Mode Toggle (Rows vs Compact Grid)
  if (el.btnModeList && el.btnModeGrid) {
    el.btnModeList.addEventListener('click', () => {
      el.btnModeList.classList.add('active');
      el.btnModeGrid.classList.remove('active');
      state.todayViewMode = 'list';
      renderTodayView();
    });

    el.btnModeGrid.addEventListener('click', () => {
      el.btnModeGrid.classList.add('active');
      el.btnModeList.classList.remove('active');
      state.todayViewMode = 'grid';
      renderTodayView();
    });
  }

  // Manage Habits Search & Filter
  el.habitSearchInput.addEventListener('input', (e) => {
    state.searchQuery = e.target.value.trim();
    renderManageHabitsView();
  });

  el.filterPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      el.filterPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      state.filter = pill.dataset.filter;
      renderManageHabitsView();
    });
  });

  el.statsHabitSelect.addEventListener('change', (e) => {
    const val = e.target.value;
    state.selectedHabitId = val ? Number(val) : null;
    fetchHabitStats(state.selectedHabitId);
  });

  // Theme Toggle Button
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
  }
}

// Global Window Exports
window.openAuthModal = openAuthModal;
window.openHabitModal = openHabitModal;
window.toggleCheckin = toggleCheckin;
window.toggleArchiveHabit = toggleArchiveHabit;
window.toggleDemoHabit = toggleDemoHabit;
window.toggleTheme = toggleTheme;
window.editHabit = editHabit;
window.deleteHabit = deleteHabit;
window.viewHabitStats = viewHabitStats;

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  el.currentDateDisplay.textContent = formatTodayDate();
  initEventListeners();
  initDemoAnimation();
  checkAuthState();
  loadInitialData();
});
