(function() {
 'use strict';

 const KEYS = {
 anamnese: 'gym_anamnese',
 onboarding: 'gym_onboarding_complete',
 workoutPlan: 'gym_workout_plan',
 hydration: 'gym_hydration',
 weightLog: 'gym_weight_log',
 weeklyNotes: 'gym_weekly_notes',
 completedWorkouts: 'gym_completed_workouts'
 };

 function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
 function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
 function todayStr() { return new Date().toISOString().slice(0, 10); }
 function getDayName() {
 const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
 return days[new Date().getDay()];
 }
 function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

 // --- ONBOARDING CHECK ---
 if (!localStorage.getItem(KEYS.onboarding)) {
 window.location.href = 'anamnese.html';
 return;
 }

 // --- TAB NAVIGATION ---
 const tabs = document.querySelectorAll('.tab');
 const contents = document.querySelectorAll('.tab-content');
 tabs.forEach(tab => {
 tab.addEventListener('click', () => {
 tabs.forEach(t => t.classList.remove('active'));
 contents.forEach(c => c.classList.remove('active'));
 tab.classList.add('active');
 document.getElementById(tab.dataset.tab).classList.add('active');
 if (tab.dataset.tab === 'hidratacao') renderHydration();
 if (tab.dataset.tab === 'relatorio') renderWeeklyStats();
 if (tab.dataset.tab === 'perfil') renderProfile();
 });
 });

 // --- WORKOUT UPLOAD ---
 const uploadInput = document.getElementById('workout-upload');
 const uploadStatus = document.getElementById('upload-status');

 uploadInput.addEventListener('change', (e) => {
 const file = e.target.files[0];
 if (!file) return;
 const reader = new FileReader();
 reader.onload = (ev) => {
 try {
 const plan = JSON.parse(ev.target.result);
 if (!plan.dias || !Array.isArray(plan.dias)) throw new Error('Formato inválido');
 save(KEYS.workoutPlan, plan);
 uploadStatus.textContent = 'Ficha carregada com sucesso!';
 uploadStatus.style.color = 'var(--accent)';
 renderTodayWorkout();
 setTimeout(() => { uploadStatus.textContent = ''; }, 3000);
 } catch (err) {
 uploadStatus.textContent = 'Erro: arquivo inválido. Verifique o JSON.';
 uploadStatus.style.color = 'var(--danger)';
 }
 };
 reader.readAsText(file);
 });

 // --- TODAY WORKOUT ---
 function renderTodayWorkout() {
 const plan = load(KEYS.workoutPlan);
 const container = document.getElementById('today-workout-container');
 const noMsg = document.getElementById('no-workout-msg');
 const dayNameEl = document.getElementById('today-day-name');
 const badgeEl = document.getElementById('today-workout-label');
 const listEl = document.getElementById('exercise-cards-list');

 if (!plan) {
 container.style.display = 'none';
 noMsg.style.display = 'block';
 return;
 }

 container.style.display = 'block';
 noMsg.style.display = 'none';

 const dayName = getDayName();
 dayNameEl.textContent = dayName;

 const dayPlan = plan.dias.find(d =>
 d.dia.toLowerCase() === dayName.toLowerCase() ||
 d.dia.toLowerCase().includes(dayName.toLowerCase().substring(0,3))
 );

 if (!dayPlan) {
 badgeEl.textContent = 'Descanso';
 badgeEl.className = 'workout-badge rest';
 listEl.innerHTML = '<div class="empty-state">Dia de descanso. Aproveite para recuperar!</div>';
 return;
 }

 badgeEl.textContent = dayPlan.nome || ('Treino ' + dayName);
 badgeEl.className = 'workout-badge active';

 const completed = load(KEYS.completedWorkouts) || {};
 const todayKey = todayStr();
 if (!completed[todayKey]) completed[todayKey] = [];

 listEl.innerHTML = dayPlan.exercicios.map((ex, i) => {
 const isDone = completed[todayKey].includes(i);
 return `
 <div class="exercise-card ${isDone ? 'done' : ''}" data-index="${i}">
 <div class="exercise-card-header">
 <div class="exercise-icon">${ex.animacao || '🏋️'}</div>
 <div class="exercise-title">
 <h3>${escapeHtml(ex.nome)}</h3>
 <p class="exercise-target">${escapeHtml(ex.grupoMuscular || '')}</p>
 </div>
 <button class="btn-check ${isDone ? 'checked' : ''}" onclick="toggleExercise(${i})" aria-label="Concluir">
 ${isDone ? '✓' : '○'}
 </button>
 </div>
 <div class="exercise-details">
 <div class="detail-item"><span class="detail-label">Séries</span><span class="detail-value">${ex.series}</span></div>
 <div class="detail-item"><span class="detail-label">Reps</span><span class="detail-value">${ex.repeticoes}</span></div>
 <div class="detail-item"><span class="detail-label">Carga</span><span class="detail-value">${ex.cargaKg ? ex.cargaKg + ' kg' : '—'}</span></div>
 <div class="detail-item"><span class="detail-label">Descanso</span><span class="detail-value">${ex.descansoS || 60}s</span></div>
 </div>
 ${ex.alternativa ? `<div class="exercise-alt"><strong>Alternativa:</strong> ${escapeHtml(ex.alternativa)}</div>` : ''}
 ${ex.obs ? `<div class="exercise-obs">💡 ${escapeHtml(ex.obs)}</div>` : ''}
 </div>
 `;
 }).join('');
 }

 window.toggleExercise = function(index) {
 const completed = load(KEYS.completedWorkouts) || {};
 const todayKey = todayStr();
 if (!completed[todayKey]) completed[todayKey] = [];
 const pos = completed[todayKey].indexOf(index);
 if (pos >= 0) completed[todayKey].splice(pos, 1);
 else completed[todayKey].push(index);
 save(KEYS.completedWorkouts, completed);
 renderTodayWorkout();
 };

 // --- HYDRATION ---
 function getHydrationData() {
 const data = load(KEYS.hydration) || {};
 const today = todayStr();
 if (!data[today]) data[today] = { copos: 0, meta: 8 };
 return { data, today };
 }

 window.addWater = function(delta) {
 const { data, today } = getHydrationData();
 data[today].copos = Math.max(0, Math.min(data[today].copos + delta, 20));
 save(KEYS.hydration, data);
 renderHydration();
 };

 function renderHydration() {
 const { data, today } = getHydrationData();
 const copos = data[today].copos;
 const meta = data[today].meta;
 document.getElementById('water-count').textContent = copos;
 document.getElementById('water-goal').textContent = meta;
 const pct = Math.min((copos / meta) * 100, 100);
 document.getElementById('hydration-fill').style.width = pct + '%';

 // Weight mini history
 const weights = load(KEYS.weightLog) || [];
 const recent = weights.slice(-7).reverse();
 const miniEl = document.getElementById('weight-history-mini');
 if (recent.length === 0) {
 miniEl.innerHTML = '<p class="hint">Nenhum peso registrado ainda.</p>';
 } else {
 miniEl.innerHTML = recent.map(w =>
 `<div class="weight-entry"><span>${new Date(w.data).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'})}</span><strong>${w.peso} kg</strong></div>`
 ).join('');
 }
 }

 // --- WEIGHT LOG ---
 document.getElementById('weight-form').addEventListener('submit', (e) => {
 e.preventDefault();
 const peso = parseFloat(document.getElementById('daily-weight').value);
 if (!peso) return;
 const log = load(KEYS.weightLog) || [];
 const today = todayStr();
 const existing = log.findIndex(w => w.data === today);
 if (existing >= 0) log[existing].peso = peso;
 else log.push({ data: today, peso });
 save(KEYS.weightLog, log);
 document.getElementById('daily-weight').value = '';
 renderHydration();
 alert('Peso registrado!');
 });

 // --- WEEKLY REPORT ---
 function renderWeeklyStats() {
 const completed = load(KEYS.completedWorkouts) || {};
 const weights = load(KEYS.weightLog) || [];
 const hydration = load(KEYS.hydration) || {};
 const statsEl = document.getElementById('weekly-stats');

 const now = new Date();
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 const weekDates = [];
 for (let d = new Date(weekAgo); d <= now; d.setDate(d.getDate() + 1)) {
 weekDates.push(d.toISOString().slice(0, 10));
 }

 const workoutsThisWeek = weekDates.filter(d => completed[d] && completed[d].length > 0).length;
 const totalExercises = weekDates.reduce((sum, d) => sum + (completed[d] ? completed[d].length : 0), 0);
 const avgWater = weekDates.reduce((sum, d) => sum + (hydration[d] ? hydration[d].copos : 0), 0) / 7;
 const weekWeights = weights.filter(w => new Date(w.data) >= weekAgo);
 const weightChange = weekWeights.length >= 2 ? (weekWeights[weekWeights.length-1].peso - weekWeights[0].peso).toFixed(1) : '—';

 statsEl.innerHTML = `
 <div class="stat-box"><div class="stat-value">${workoutsThisWeek}</div><div class="stat-label">Treinos na semana</div></div>
 <div class="stat-box"><div class="stat-value">${totalExercises}</div><div class="stat-label">Exercícios concluídos</div></div>
 <div class="stat-box"><div class="stat-value">${avgWater.toFixed(1)}</div><div class="stat-label">Média copos/dia</div></div>
 <div class="stat-box"><div class="stat-value">${weightChange !== '—' ? (weightChange > 0 ? '+' : '') + weightChange : '—'}</div><div class="stat-label">Variação peso (kg)</div></div>
 `;

 const savedNotes = localStorage.getItem(KEYS.weeklyNotes) || '';
 document.getElementById('weekly-notes').value = savedNotes;
 }

 window.exportWeeklyReport = function() {
 const notes = document.getElementById('weekly-notes').value.trim();
 localStorage.setItem(KEYS.weeklyNotes, notes);

 const completed = load(KEYS.completedWorkouts) || {};
 const weights = load(KEYS.weightLog) || [];
 const hydration = load(KEYS.hydration) || {};
 const anamnese = load(KEYS.anamnese) || {};
 const plan = load(KEYS.workoutPlan) || {};

 const now = new Date();
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 const weekDates = [];
 for (let d = new Date(weekAgo); d <= now; d.setDate(d.getDate() + 1)) {
 weekDates.push(d.toISOString().slice(0, 10));
 }

 const report = {
 tipo: 'relatorio_semanal',
 periodo: { inicio: weekDates[0], fim: weekDates[weekDates.length - 1] },
 geradoEm: new Date().toISOString(),
 usuario: { nome: anamneseData.nome || anamnese.nome, objetivo: anamnese.objetivo },
 resumo: {
 treinosRealizados: weekDates.filter(d => completed[d] && completed[d].length > 0).length,
 totalExerciciosConcluidos: weekDates.reduce((s, d) => s + (completed[d] ? completed[d].length : 0), 0),
 mediaHidratacao: +(weekDates.reduce((s, d) => s + (hydration[d] ? hydration[d].copos : 0), 0) / 7).toFixed(1)
 },
 pesosSemana: weights.filter(w => new Date(w.data) >= weekAgo),
 hidratacaoDiaria: weekDates.map(d => ({ data: d, copos: hydration[d] ? hydration[d].copos : 0 })),
 exerciciosPorDia: weekDates.map(d => ({ data: d, concluidos: completed[d] || [] })),
 observacoes: notes
 };

 const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `relatorio_semanal_${todayStr()}.json`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 };

 // --- PROFILE ---
 function renderProfile() {
 const anamnese = load(KEYS.anamnese) || {};
 const display = document.getElementById('profile-display');
 if (!anamnese.nome) {
 display.innerHTML = '<p class="hint">Perfil não encontrado.</p>';
 return;
 }
 display.innerHTML = `
 <div class="profile-row"><strong>Nome:</strong> ${escapeHtml(anamnese.nome)}</div>
 <div class="profile-row"><strong>Idade:</strong> ${anamnese.idade} anos</div>
 <div class="profile-row"><strong>Peso:</strong> ${anamnese.peso} kg</div>
 <div class="profile-row"><strong>Altura:</strong> ${anamnese.altura} cm</div>
 <div class="profile-row"><strong>Objetivo:</strong> ${escapeHtml(anamnese.objetivo)}</div>
 <div class="profile-row"><strong>Experiência:</strong> ${escapeHtml(anamnese.experiencia)}</div>
 <div class="profile-row"><strong>Dias/semana:</strong> ${anamnese.diasSemana}</div>
 ${anamnese.lesoes && anamnese.lesoes.length ? '<div class="profile-row"><strong>Limitações:</strong> ' + anamnese.lesoes.join(', ') + '</div>' : ''}
 `;

 const weights = load(KEYS.weightLog) || [];
 const completed = load(KEYS.completedWorkouts) || {};
 const statsEl = document.getElementById('stats-display');
 const totalWorkouts = Object.keys(completed).filter(d => completed[d].length > 0).length;
 const totalEx = Object.values(completed).reduce((s, arr) => s + arr.length, 0);
 statsEl.innerHTML = `
 <div class="stat-box"><div class="stat-value">${totalWorkouts}</div><div class="stat-label">Treinos totais</div></div>
 <div class="stat-box"><div class="stat-value">${totalEx}</div><div class="stat-label">Exercícios feitos</div></div>
 <div class="stat-box"><div class="stat-value">${weights.length}</div><div class="stat-label">Registros de peso</div></div>
 <div class="stat-box"><div class="stat-value">${weights.length > 0 ? weights[weights.length-1].peso : '—'}</div><div class="stat-label">Último peso (kg)</div></div>
 `;
 }

 window.resetAnamnese = function() {
 if (confirm('Tem certeza? Isso apagará sua anamnese e redirecionará para refazer.')) {
 localStorage.removeItem(KEYS.anamnese);
 localStorage.removeItem(KEYS.onboarding);
 window.location.href = 'anamnese.html';
 }
 };

 // --- INIT ---
 renderTodayWorkout();
})();
