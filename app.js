(function() {
 'use strict';

 const KEYS = {
 anamnese: 'gym_anamnese',
 onboarding: 'gym_onboarding_complete',
 workoutPlan: 'gym_workout_plan',
 hydration: 'gym_hydration',
 weightLog: 'gym_weight_log',
 weeklyNotes: 'gym_weekly_notes',
 completedWorkouts: 'gym_completed_workouts',
 personalSettings: 'gym_personal_settings',
 exerciseCache: 'gym_exercise_cache',
 realizedWeights: 'gym_realized_weights'
 };

 function load(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } }
 function save(key, data) { localStorage.setItem(key, JSON.stringify(data)); }
 function todayStr() { return new Date().toISOString().slice(0, 10); }
 function getDayName() {
 const days = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
 return days[new Date().getDay()];
 }
 function escapeHtml(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

 // --- YOUTUBE VIDEO EMBED FOR EXERCISES ---
 function getYouTubeEmbedUrl(exerciseName) {
 // Use YouTube search embed - shows first result for the exercise
 const searchQuery = encodeURIComponent(exerciseName + ' execução correta como fazer');
 return `https://www.youtube.com/embed?listType=search&list=${searchQuery}`;
 }

 // --- ONBOARDING CHECK ---
 if (!localStorage.getItem(KEYS.onboarding)) {
 window.location.href = 'anamnese.html';
 return;
 }

 // --- HYDRATION SCIENTIFIC CALCULATION ---
 function calculateHydrationGoal() {
 const anamnese = load(KEYS.anamnese) || {};
 const settings = load(KEYS.personalSettings) || {};
 
 if (settings.hidratacaoMl) return settings.hidratacaoMl;
 
 const peso = anamnese.peso || 70;
 let baseMl = Math.round(peso * 35);
 
 const diasSemana = anamnese.diasSemana || 4;
 if (diasSemana >= 5) baseMl += 500;
 else if (diasSemana >= 3) baseMl += 250;
 
 return Math.max(1500, Math.min(baseMl, 5000));
 }

 function getHydrationFormulaText() {
 const anamnese = load(KEYS.anamnese) || {};
 const settings = load(KEYS.personalSettings) || {};
 const peso = anamnese.peso || 70;
 
 if (settings.hidratacaoMl) {
 return `Meta definida pelo personal: ${settings.hidratacaoMl} ml/dia`;
 }
 return `Fórmula: ${peso}kg × 35ml = ${Math.round(peso * 35)}ml + ajuste por atividade (${anamnese.diasSemana || 4} dias/semana)`;
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
 if (tab.dataset.tab === 'relatorio') renderWeeklyReport();
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
 
 if (plan.configuracoesPersonal) {
 save(KEYS.personalSettings, plan.configuracoesPersonal);
 }
 
 uploadStatus.textContent = '✓ Ficha carregada com sucesso!';
 uploadStatus.style.color = 'var(--accent)';
 renderTodayWorkout();
 setTimeout(() => { uploadStatus.textContent = ''; }, 3000);
 } catch (err) {
 uploadStatus.textContent = '✗ Erro: arquivo inválido. Verifique o JSON.';
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

 if (!dayPlan || !dayPlan.exercicios || dayPlan.exercicios.length === 0) {
 badgeEl.textContent = 'Descanso';
 badgeEl.className = 'workout-badge rest';
 listEl.innerHTML = '<div class="empty-state">Dia de descanso. Aproveite para recuperar!</div>';
 return;
 }

 badgeEl.textContent = dayPlan.nome || ('Treino ' + dayName);
 badgeEl.className = 'workout-badge active';

 const completed = load(KEYS.completedWorkouts) || {};
 const realizedWeights = load(KEYS.realizedWeights) || {};
 const todayKey = todayStr();
 if (!completed[todayKey]) completed[todayKey] = [];

 listEl.innerHTML = dayPlan.exercicios.map((ex, i) => {
 const isDone = completed[todayKey].includes(i);
 const videoUrl = getYouTubeEmbedUrl(ex.nome);
 
 const realizedKey = `${todayKey}_${i}`;
 const realizedWeight = realizedWeights[realizedKey] || '';
 
 return `
 <div class="exercise-card ${isDone ? 'done' : ''}" data-index="${i}">
 <div class="exercise-video-section">
 <button class="btn-show-video" onclick="toggleVideo(${i})">
 📹 Ver vídeo de execução
 </button>
 <div class="video-container" id="video-${i}" style="display:none;">
 <iframe 
 src="${videoUrl}" 
 frameborder="0" 
 allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
 allowfullscreen
 loading="lazy">
 </iframe>
 </div>
 </div>
 <div class="exercise-card-header">
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
 <div class="detail-item"><span class="detail-label">Carga Rec.</span><span class="detail-value">${ex.cargaKg ? ex.cargaKg + ' kg' : '—'}</span></div>
 <div class="detail-item"><span class="detail-label">Descanso</span><span class="detail-value">${ex.descansoS || 60}s</span></div>
 </div>
 <div class="realized-weight-section">
 <label for="realized-${i}">Peso realizado (kg):</label>
 <input type="number" id="realized-${i}" class="realized-input" value="${realizedWeight}" placeholder="${ex.cargaKg || ''}" step="0.5" min="0" onchange="saveRealizedWeight(${i}, this.value)" />
 </div>
 ${ex.alternativa ? `<div class="exercise-alt"><strong>Alternativa:</strong> ${escapeHtml(ex.alternativa)}</div>` : ''}
 ${ex.obs ? `<div class="exercise-obs">💡 ${escapeHtml(ex.obs)}</div>` : ''}
 </div>
 `;
 }).join('');
 }

 window.toggleVideo = function(index) {
 const videoContainer = document.getElementById(`video-${index}`);
 if (videoContainer.style.display === 'none') {
 videoContainer.style.display = 'block';
 } else {
 videoContainer.style.display = 'none';
 }
 };

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

 window.saveRealizedWeight = function(index, value) {
 const realizedWeights = load(KEYS.realizedWeights) || {};
 const todayKey = todayStr();
 const realizedKey = `${todayKey}_${index}`;
 if (value) {
 realizedWeights[realizedKey] = parseFloat(value);
 } else {
 delete realizedWeights[realizedKey];
 }
 save(KEYS.realizedWeights, realizedWeights);
 };

 // --- HYDRATION ---
 function getHydrationData() {
 const data = load(KEYS.hydration) || {};
 const today = todayStr();
 const goal = calculateHydrationGoal();
 if (!data[today]) data[today] = { ml: 0, meta: goal };
 else data[today].meta = goal;
 return { data, today };
 }

 window.addWater = function(delta) {
 const { data, today } = getHydrationData();
 data[today].ml = Math.max(0, Math.min(data[today].ml + delta, 10000));
 save(KEYS.hydration, data);
 renderHydration();
 };

 function renderHydration() {
 const { data, today } = getHydrationData();
 const ml = data[today].ml;
 const meta = data[today].meta;
 document.getElementById('water-count').textContent = ml;
 document.getElementById('water-goal').textContent = meta;
 document.getElementById('hydration-formula').textContent = getHydrationFormulaText();
 const pct = Math.min((ml / meta) * 100, 100);
 document.getElementById('hydration-fill').style.width = pct + '%';
 renderWeightChart();
 }

 // --- WEIGHT CHART (SVG) ---
 function renderWeightChart() {
 const weights = load(KEYS.weightLog) || [];
 const container = document.getElementById('weight-chart-container');
 
 if (weights.length < 2) {
 container.innerHTML = '<p class="hint">Registre pelo menos 2 pesos para ver o gráfico.</p>';
 return;
 }

 const recent = weights.slice(-30);
 const minW = Math.min(...recent.map(w => w.peso)) - 1;
 const maxW = Math.max(...recent.map(w => w.peso)) + 1;
 const range = maxW - minW || 1;
 
 const width = 320;
 const height = 180;
 const padding = 30;
 const chartW = width - padding * 2;
 const chartH = height - padding * 2;

 const points = recent.map((w, i) => {
 const x = padding + (i / (recent.length - 1)) * chartW;
 const y = padding + chartH - ((w.peso - minW) / range) * chartH;
 return `${x},${y}`;
 }).join(' ');

 const svg = `
 <svg viewBox="0 0 ${width} ${height}" class="chart-svg">
 <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height-padding}" stroke="var(--border)" stroke-width="1"/>
 <line x1="${padding}" y1="${height-padding}" x2="${width-padding}" y2="${height-padding}" stroke="var(--border)" stroke-width="1"/>
 <polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
 ${recent.map((w, i) => {
 const x = padding + (i / (recent.length - 1)) * chartW;
 const y = padding + chartH - ((w.peso - minW) / range) * chartH;
 return `<circle cx="${x}" cy="${y}" r="3" fill="var(--accent)"/>`;
 }).join('')}
 <text x="${padding}" y="${padding - 8}" fill="var(--text-secondary)" font-size="10">${maxW.toFixed(1)}kg</text>
 <text x="${padding}" y="${height - padding + 16}" fill="var(--text-secondary)" font-size="10">${minW.toFixed(1)}kg</text>
 <text x="${width - padding}" y="${height - padding + 16}" fill="var(--text-secondary)" font-size="10" text-anchor="end">Hoje</text>
 </svg>
 `;
 container.innerHTML = svg;
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
 function renderWeeklyReport() {
 const completed = load(KEYS.completedWorkouts) || {};
 const weights = load(KEYS.weightLog) || [];
 const hydration = load(KEYS.hydration) || {};
 const plan = load(KEYS.workoutPlan) || {};
 const statsEl = document.getElementById('weekly-stats');

 const now = new Date();
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 const weekDates = [];
 for (let d = new Date(weekAgo); d <= now; d.setDate(d.getDate() + 1)) {
 weekDates.push(d.toISOString().slice(0, 10));
 }

 const workoutsThisWeek = weekDates.filter(d => completed[d] && completed[d].length > 0).length;
 const totalExercises = weekDates.reduce((sum, d) => sum + (completed[d] ? completed[d].length : 0), 0);
 const avgWater = weekDates.reduce((sum, d) => sum + (hydration[d] ? hydration[d].ml : 0), 0) / 7;
 const weekWeights = weights.filter(w => new Date(w.data) >= weekAgo);
 const weightChange = weekWeights.length >= 2 ? (weekWeights[weekWeights.length-1].peso - weekWeights[0].peso).toFixed(1) : '—';

 const anamnese = load(KEYS.anamnese) || {};
 const settings = load(KEYS.personalSettings) || {};
 const diasNecessarios = settings.diasTreino || anamnese.diasSemana || 4;

 statsEl.innerHTML = `
 <div class="stat-box"><div class="stat-value">${workoutsThisWeek}/${diasNecessarios}</div><div class="stat-label">Treinos (real/nec)</div></div>
 <div class="stat-box"><div class="stat-value">${totalExercises}</div><div class="stat-label">Exercícios concluídos</div></div>
 <div class="stat-box"><div class="stat-value">${Math.round(avgWater)}</div><div class="stat-label">Média hidratação (ml)</div></div>
 <div class="stat-box"><div class="stat-value">${weightChange !== '—' ? (weightChange > 0 ? '+' : '') + weightChange : '—'}</div><div class="stat-label">Variação peso (kg)</div></div>
 `;

 renderMuscleChart(weekDates, completed, plan);
 renderStressChart(weekDates, completed, plan);

 const savedNotes = localStorage.getItem(KEYS.weeklyNotes) || '';
 document.getElementById('weekly-notes').value = savedNotes;
 }

 // --- MUSCLE CHART (SVG) ---
 function renderMuscleChart(weekDates, completed, plan) {
 const container = document.getElementById('muscle-chart-container');
 
 if (!plan || !plan.dias) {
 container.innerHTML = '<p class="hint">Carregue uma ficha de treino para ver os músculos.</p>';
 return;
 }

 const muscleCounts = {};
 weekDates.forEach(date => {
 if (!completed[date]) return;
 const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
 const dayPlan = plan.dias.find(d => 
 d.dia.toLowerCase() === dayName.toLowerCase() ||
 d.dia.toLowerCase().includes(dayName.toLowerCase().substring(0,3))
 );
 if (!dayPlan || !dayPlan.exercicios) return;
 
 completed[date].forEach(idx => {
 const ex = dayPlan.exercicios[idx];
 if (ex && ex.grupoMuscular) {
 const group = ex.grupoMuscular.split('/')[0].trim();
 muscleCounts[group] = (muscleCounts[group] || 0) + 1;
 }
 });
 });

 const entries = Object.entries(muscleCounts).sort((a,b) => b[1] - a[1]).slice(0, 8);
 if (entries.length === 0) {
 container.innerHTML = '<p class="hint">Nenhum músculo registrado esta semana.</p>';
 return;
 }

 const maxCount = Math.max(...entries.map(e => e[1]));
 const barHeight = 24;
 const gap = 8;
 const labelWidth = 120;
 const chartWidth = 280;
 const height = entries.length * (barHeight + gap) + 20;

 const bars = entries.map(([name, count], i) => {
 const y = i * (barHeight + gap) + 10;
 const barW = (count / maxCount) * (chartWidth - labelWidth - 40);
 return `
 <text x="${labelWidth - 5}" y="${y + barHeight/2 + 4}" fill="var(--text-primary)" font-size="11" text-anchor="end">${escapeHtml(name.substring(0,18))}</text>
 <rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="4" fill="var(--accent)" opacity="${0.4 + (count/maxCount)*0.6}"/>
 <text x="${labelWidth + barW + 6}" y="${y + barHeight/2 + 4}" fill="var(--text-secondary)" font-size="11">${count}x</text>
 `;
 }).join('');

 container.innerHTML = `<svg viewBox="0 0 ${chartWidth} ${height}" class="chart-svg">${bars}</svg>`;
 }

 // --- STRESS CHART (SVG) - IMPROVED ---
 function renderStressChart(weekDates, completed, plan) {
 const container = document.getElementById('stress-chart-container');
 
 if (!plan || !plan.dias) {
 container.innerHTML = '<p class="hint">Carregue uma ficha de treino para ver o stress muscular.</p>';
 return;
 }

 const muscleStress = {};
 const largeMuscles = ['Peitoral', 'Dorsal', 'Quadríceps', 'Glúteos', 'Posterior'];
 
 weekDates.forEach(date => {
 if (!completed[date]) return;
 const dayName = new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long' });
 const dayPlan = plan.dias.find(d => 
 d.dia.toLowerCase() === dayName.toLowerCase() ||
 d.dia.toLowerCase().includes(dayName.toLowerCase().substring(0,3))
 );
 if (!dayPlan || !dayPlan.exercicios) return;
 
 completed[date].forEach(idx => {
 const ex = dayPlan.exercicios[idx];
 if (!ex || !ex.grupoMuscular) return;
 
 const group = ex.grupoMuscular.split('/')[0].trim();
 const sets = parseInt(ex.series) || 3;
 const reps = parseInt(String(ex.repeticoes).split('-')[0]) || 10;
 const weight = parseFloat(ex.cargaKg) || 0;
 const volume = sets * reps * weight;
 
 const isLarge = largeMuscles.some(m => group.includes(m));
 const recoveryFactor = isLarge ? 72 : 48;
 const stressScore = volume / recoveryFactor;
 
 muscleStress[group] = (muscleStress[group] || 0) + stressScore;
 });
 });

 const entries = Object.entries(muscleStress).sort((a,b) => b[1] - a[1]).slice(0, 8);
 if (entries.length === 0) {
 container.innerHTML = '<p class="hint">Nenhum dado de stress esta semana.</p>';
 return;
 }

 const maxStress = Math.max(...entries.map(e => e[1]), 100);
 const barHeight = 28;
 const gap = 10;
 const labelWidth = 120;
 const chartWidth = 300;
 const height = entries.length * (barHeight + gap) + 40;

 const bars = entries.map(([name, stress], i) => {
 const y = i * (barHeight + gap) + 10;
 const barW = Math.max((stress / maxStress) * (chartWidth - labelWidth - 50), 10);
 
 let color = 'var(--accent)';
 let zone = 'Baixo';
 if (stress > 100) {
 color = '#ff4d4d';
 zone = 'Alto';
 } else if (stress > 50) {
 color = '#ffa500';
 zone = 'Médio';
 }
 
 return `
 <text x="${labelWidth - 8}" y="${y + barHeight/2 + 5}" fill="var(--text-primary)" font-size="12" font-weight="600" text-anchor="end">${escapeHtml(name.substring(0,20))}</text>
 <rect x="${labelWidth}" y="${y}" width="${barW}" height="${barHeight}" rx="6" fill="${color}" opacity="0.85"/>
 <text x="${labelWidth + barW + 8}" y="${y + barHeight/2 + 5}" fill="var(--text-secondary)" font-size="11" font-weight="600">${Math.round(stress)} (${zone})</text>
 `;
 }).join('');

 const legend = `
 <g transform="translate(${labelWidth}, ${height - 25})">
 <rect x="0" y="0" width="12" height="12" rx="2" fill="var(--accent)" opacity="0.85"/>
 <text x="16" y="10" fill="var(--text-secondary)" font-size="10">Baixo (&lt;50)</text>
 <rect x="80" y="0" width="12" height="12" rx="2" fill="#ffa500" opacity="0.85"/>
 <text x="96" y="10" fill="var(--text-secondary)" font-size="10">Médio (50-100)</text>
 <rect x="170" y="0" width="12" height="12" rx="2" fill="#ff4d4d" opacity="0.85"/>
 <text x="186" y="10" fill="var(--text-secondary)" font-size="10">Alto (&gt;100)</text>
 </g>
 `;

 container.innerHTML = `<svg viewBox="0 0 ${chartWidth} ${height}" class="chart-svg">${bars}${legend}</svg>`;
 }

 window.exportWeeklyReport = function() {
 const notes = document.getElementById('weekly-notes').value.trim();
 localStorage.setItem(KEYS.weeklyNotes, notes);

 const completed = load(KEYS.completedWorkouts) || {};
 const weights = load(KEYS.weightLog) || [];
 const hydration = load(KEYS.hydration) || {};
 const anamnese = load(KEYS.anamnese) || {};
 const plan = load(KEYS.workoutPlan) || {};
 const settings = load(KEYS.personalSettings) || {};
 const realizedWeights = load(KEYS.realizedWeights) || {};

 const now = new Date();
 const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
 const weekDates = [];
 for (let d = new Date(weekAgo); d <= now; d.setDate(d.getDate() + 1)) {
 weekDates.push(d.toISOString().slice(0, 10));
 }

 const realizedWeightsWeek = {};
 weekDates.forEach(date => {
 const dayCompleted = completed[date] || [];
 dayCompleted.forEach(idx => {
 const key = `${date}_${idx}`;
 if (realizedWeights[key]) {
 realizedWeightsWeek[key] = realizedWeights[key];
 }
 });
 });

 const report = {
 tipo: 'relatorio_semanal',
 periodo: { inicio: weekDates[0], fim: weekDates[weekDates.length - 1] },
 geradoEm: new Date().toISOString(),
 usuario: { nome: anamnese.nome, objetivos: anamnese.objetivos },
 configuracoesPersonal: settings,
 resumo: {
 treinosRealizados: weekDates.filter(d => completed[d] && completed[d].length > 0).length,
 diasNecessarios: settings.diasTreino || anamnese.diasSemana || 4,
 totalExerciciosConcluidos: weekDates.reduce((s, d) => s + (completed[d] ? completed[d].length : 0), 0),
 mediaHidratacaoMl: Math.round(weekDates.reduce((s, d) => s + (hydration[d] ? hydration[d].ml : 0), 0) / 7),
 metaHidratacaoMl: calculateHydrationGoal()
 },
 pesosSemana: weights.filter(w => new Date(w.data) >= weekAgo),
 hidratacaoDiaria: weekDates.map(d => ({ data: d, ml: hydration[d] ? hydration[d].ml : 0 })),
 exerciciosPorDia: weekDates.map(d => ({ data: d, concluidos: completed[d] || [] })),
 pesosRealizados: realizedWeightsWeek,
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
 <div class="profile-row"><strong>Objetivos:</strong> ${(anamnese.objetivos || []).map(o => escapeHtml(o)).join(', ')}</div>
 <div class="profile-row"><strong>Experiência:</strong> ${escapeHtml(anamnese.experiencia)}</div>
 <div class="profile-row"><strong>Dias/semana:</strong> ${anamnese.diasSemana}</div>
 ${anamnese.lesoes && anamnese.lesoes.length ? '<div class="profile-row"><strong>Limitações:</strong> ' + anamnese.lesoes.join(', ') + '</div>' : ''}
 `;

 const settings = load(KEYS.personalSettings) || {};
 const settingsEl = document.getElementById('personal-settings-display');
 if (Object.keys(settings).length === 0) {
 settingsEl.innerHTML = '<p class="hint">Nenhuma configuração personalizada ainda. Seu personal pode ajustar via upload da ficha.</p>';
 } else {
 settingsEl.innerHTML = `
 ${settings.hidratacaoMl ? `<div class="profile-row"><strong>Hidratação diária:</strong> ${settings.hidratacaoMl} ml</div>` : ''}
 ${settings.diasTreino ? `<div class="profile-row"><strong>Dias de treino/semana:</strong> ${settings.diasTreino}</div>` : ''}
 ${settings.metaPeso ? `<div class="profile-row"><strong>Meta de peso:</strong> ${settings.metaPeso} kg</div>` : ''}
 ${settings.obs ? `<div class="profile-row"><strong>Obs. do personal:</strong> ${escapeHtml(settings.obs)}</div>` : ''}
 `;
 }

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
