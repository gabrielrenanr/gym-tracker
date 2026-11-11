(function() {
  'use strict';

  const STORAGE_KEYS = {
    exercises: 'gym_exercises',
    history: 'gym_history',
    profile: 'gym_profile'
  };

  function loadData(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch { return null; }
  }

  function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Tab Navigation ---
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
      if (tab.dataset.tab === 'historico') renderHistory();
      if (tab.dataset.tab === 'perfil') renderStats();
    });
  });

  // --- Exercise Form ---
  const exerciseForm = document.getElementById('exercise-form');
  const exerciseList = document.getElementById('exercise-list');
  let currentExercises = loadData(STORAGE_KEYS.exercises) || [];

  function renderExercises() {
    if (currentExercises.length === 0) {
      exerciseList.innerHTML = '<li class="empty-state">Nenhum exercício adicionado ainda.</li>';
      return;
    }
    exerciseList.innerHTML = currentExercises.map((ex, i) => `
      <li class="exercise-item">
        <div class="exercise-info">
          <h3>${escapeHtml(ex.name)}</h3>
          <p>${ex.sets} séries × ${ex.reps} reps${ex.weight ? ' • ' + ex.weight + ' kg' : ''}</p>
        </div>
        <button class="btn-remove" data-index="${i}" aria-label="Remover">×</button>
      </li>
    `).join('');

    exerciseList.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        currentExercises.splice(parseInt(btn.dataset.index), 1);
        saveData(STORAGE_KEYS.exercises, currentExercises);
        renderExercises();
      });
    });
  }

  exerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('exercise-name').value.trim();
    const sets = parseInt(document.getElementById('sets').value);
    const reps = parseInt(document.getElementById('reps').value);
    const weight = parseFloat(document.getElementById('weight').value) || null;

    if (!name || !sets || !reps) return;

    currentExercises.push({ name, sets, reps, weight, timestamp: Date.now() });
    saveData(STORAGE_KEYS.exercises, currentExercises);
    renderExercises();
    exerciseForm.reset();
    document.getElementById('exercise-name').focus();
  });

  // --- History ---
  function renderHistory() {
    const history = loadData(STORAGE_KEYS.history) || [];
    const weeklySummary = document.getElementById('weekly-summary');
    const historyListEl = document.getElementById('history-list');

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentWorkouts = history.filter(h => new Date(h.date) >= weekAgo);

    const totalExercises = recentWorkouts.reduce((sum, w) => sum + w.exercises.length, 0);
    const totalVolume = recentWorkouts.reduce((sum, w) => {
      return sum + w.exercises.reduce((v, ex) => v + (ex.sets * ex.reps * (ex.weight || 0)), 0);
    }, 0);

    weeklySummary.innerHTML = `
      <div class="stat-box"><div class="stat-value">${recentWorkouts.length}</div><div class="stat-label">Treinos esta semana</div></div>
      <div class="stat-box"><div class="stat-value">${totalExercises}</div><div class="stat-label">Exercícios</div></div>
      <div class="stat-box"><div class="stat-value">${totalVolume > 0 ? Math.round(totalVolume).toLocaleString('pt-BR') : '—'}</div><div class="stat-label">Volume total (kg)</div></div>
      <div class="stat-box"><div class="stat-value">${history.length}</div><div class="stat-label">Total de treinos</div></div>
    `;

    if (history.length === 0) {
      historyListEl.innerHTML = '<li class="empty-state">Nenhum treino salvo ainda. Finalize um treino para vê-lo aqui.</li>';
      return;
    }

    historyListEl.innerHTML = history.slice().reverse().map((workout, i) => {
      const date = new Date(workout.date);
      const dateStr = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
      const exCount = workout.exercises.length;
      const vol = workout.exercises.reduce((v, ex) => v + (ex.sets * ex.reps * (ex.weight || 0)), 0);
      return `
        <li class="history-item">
          <div class="exercise-info">
            <h3>${dateStr}</h3>
            <p>${exCount} exercícios • Volume: ${vol > 0 ? Math.round(vol).toLocaleString('pt-BR') + ' kg' : '—'}</p>
          </div>
          <button class="btn-remove" data-rev-index="${i}" aria-label="Excluir">×</button>
        </li>
      `;
    }).join('');

    historyListEl.querySelectorAll('.btn-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const revIndex = parseInt(btn.dataset.revIndex);
        const actualIndex = history.length - 1 - revIndex;
        history.splice(actualIndex, 1);
        saveData(STORAGE_KEYS.history, history);
        renderHistory();
      });
    });
  }

  // Auto-save workout to history when leaving treino tab or on visibility change
  function saveWorkoutToHistory() {
    if (currentExercises.length === 0) return;
    const history = loadData(STORAGE_KEYS.history) || [];
    history.push({ date: new Date().toISOString(), exercises: [...currentExercises] });
    saveData(STORAGE_KEYS.history, history);
  }

  let workoutSavedForToday = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !workoutSavedForToday && currentExercises.length > 0) {
      saveWorkoutToHistory();
      workoutSavedForToday = true;
    }
  });

  // Also add a "Finalizar Treino" behavior: save when switching away from treino tab
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      if (tab.dataset.tab !== 'treino' && !workoutSavedForToday && currentExercises.length > 0) {
        saveWorkoutToHistory();
        workoutSavedForToday = true;
      }
    });
  });

  // --- Profile ---
  const profileForm = document.getElementById('profile-form');
  let profile = loadData(STORAGE_KEYS.profile) || {};

  function loadProfile() {
    if (profile.name) document.getElementById('user-name').value = profile.name;
    if (profile.weight) document.getElementById('user-weight').value = profile.weight;
    if (profile.goal) document.getElementById('user-goal').value = profile.goal;
  }

  profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    profile = {
      name: document.getElementById('user-name').value.trim(),
      weight: parseFloat(document.getElementById('user-weight').value) || null,
      goal: document.getElementById('user-goal').value,
      updatedAt: new Date().toISOString()
    };
    saveData(STORAGE_KEYS.profile, profile);
    renderStats();
    alert('Perfil salvo com sucesso!');
  });

  function renderStats() {
    loadProfile();
    const statsDisplay = document.getElementById('stats-display');
    const history = loadData(STORAGE_KEYS.history) || [];

    const totalWorkouts = history.length;
    const allExercises = history.flatMap(h => h.exercises);
    const uniqueExercises = new Set(allExercises.map(e => e.name.toLowerCase())).size;
    const totalVolume = allExercises.reduce((v, ex) => v + (ex.sets * ex.reps * (ex.weight || 0)), 0);

    let streak = 0;
    if (history.length > 0) {
      const sortedDates = history.map(h => new Date(h.date).toDateString()).filter((d, i, arr) => arr.indexOf(d) === i).sort((a, b) => new Date(b) - new Date(a));
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      if (sortedDates[0] === today || sortedDates[0] === yesterday) {
        streak = 1;
        for (let i = 1; i < sortedDates.length; i++) {
          const diff = (new Date(sortedDates[i - 1]) - new Date(sortedDates[i])) / 86400000;
          if (diff <= 1) streak++;
          else break;
        }
      }
    }

    statsDisplay.innerHTML = `
      <div class="stat-box"><div class="stat-value">${totalWorkouts}</div><div class="stat-label">Treinos totais</div></div>
      <div class="stat-box"><div class="stat-value">${streak}</div><div class="stat-label">Dias seguidos</div></div>
      <div class="stat-box"><div class="stat-value">${uniqueExercises}</div><div class="stat-label">Exercícios únicos</div></div>
      <div class="stat-box"><div class="stat-value">${totalVolume > 0 ? Math.round(totalVolume).toLocaleString('pt-BR') : '—'}</div><div class="stat-label">Volume acumulado</div></div>
      ${profile.weight ? '<div class="stat-box"><div class="stat-value">' + profile.weight + '</div><div class="stat-label">Peso atual (kg)</div></div>' : ''}
      ${profile.goal ? '<div class="stat-box"><div class="stat-value" style="font-size:16px">' + capitalize(profile.goal) + '</div><div class="stat-label">Objetivo</div></div>' : ''}
    `;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // --- Init ---
  renderExercises();
  loadProfile();
})();
