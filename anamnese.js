(function() {
 'use strict';

 const TOTAL_STEPS = 6;
 let currentStep = 1;
 const anamneseData = {};

 function updateUI() {
 document.querySelectorAll('.step-content').forEach(el => el.classList.remove('active'));
 document.querySelector(`.step-content[data-step="${currentStep}"]`).classList.add('active');
 document.querySelectorAll('.step-dot').forEach(dot => {
 const step = parseInt(dot.dataset.step);
 dot.classList.remove('active', 'done');
 if (step === currentStep) dot.classList.add('active');
 else if (step < currentStep) dot.classList.add('done');
 });
 const pct = (currentStep / TOTAL_STEPS) * 100;
 document.getElementById('progress-fill').style.width = pct + '%';
 }

 function collectStepData(step) {
 if (step === 1) {
 anamneseData.nome = document.getElementById('anam-nome').value.trim();
 anamneseData.idade = parseInt(document.getElementById('anam-idade').value);
 anamneseData.sexo = document.getElementById('anam-sexo').value;
 anamneseData.altura = parseInt(document.getElementById('anam-altura').value);
 anamneseData.peso = parseFloat(document.getElementById('anam-peso').value);
 if (!anamneseData.nome || !anamneseData.idade || !anamneseData.sexo || !anamneseData.altura || !anamneseData.peso) {
 alert('Preencha todos os campos obrigatórios.');
 return false;
 }
 } else if (step === 2) {
 const objs = Array.from(document.querySelectorAll('input[name="objetivo"]:checked')).map(c => c.value);
 if (objs.length === 0) { alert('Selecione pelo menos um objetivo.'); return false; }
 anamneseData.objetivos = objs;
 } else if (step === 3) {
 const exp = document.querySelector('input[name="experiencia"]:checked');
 const dias = document.querySelector('input[name="dias"]:checked');
 if (!exp || !dias) { alert('Selecione experiência e disponibilidade.'); return false; }
 anamneseData.experiencia = exp.value;
 anamneseData.diasSemana = parseInt(dias.value);
 } else if (step === 4) {
 const lesoes = Array.from(document.querySelectorAll('input[name="lesoes"]:checked')).map(c => c.value);
 anamneseData.lesoes = lesoes;
 anamneseData.condicoesMedicas = document.getElementById('anam-condicoes').value.trim();
 } else if (step === 5) {
 const equip = Array.from(document.querySelectorAll('input[name="equip"]:checked')).map(c => c.value);
 if (equip.length === 0) { alert('Selecione pelo menos um equipamento.'); return false; }
 anamneseData.equipamentos = equip;
 } else if (step === 6) {
 anamneseData.pesoMeta = parseFloat(document.getElementById('anam-peso-meta').value) || null;
 anamneseData.prazo = document.getElementById('anam-prazo').value || null;
 anamneseData.observacoes = document.getElementById('anam-observacoes').value.trim();
 }
 return true;
 }

 window.nextStep = function() {
 if (!collectStepData(currentStep)) return;
 if (currentStep < TOTAL_STEPS) { currentStep++; updateUI(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
 };

 window.prevStep = function() {
 if (currentStep > 1) { currentStep--; updateUI(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
 };

 window.finishAnamnese = function() {
 if (!collectStepData(currentStep)) return;
 anamneseData.dataPreenchimento = new Date().toISOString();
 const jsonStr = JSON.stringify(anamneseData, null, 2);
 const blob = new Blob([jsonStr], { type: 'application/json' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `anamnese_${anamneseData.nome.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.json`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 localStorage.setItem('gym_anamnese', jsonStr);
 localStorage.setItem('gym_onboarding_complete', 'true');
 alert('Anamnese exportada! Envie este arquivo para seu personal trainer.\n\nVocê será redirecionado para o app.');
 setTimeout(() => { window.location.href = 'index.html'; }, 1500);
 };

 document.querySelectorAll('.radio-item input, .checkbox-item input').forEach(input => {
 input.addEventListener('change', () => {
 if (input.type === 'radio') {
 document.querySelectorAll(`input[name="${input.name}"]`).forEach(r => r.closest('.radio-item').classList.remove('selected'));
 }
 const item = input.closest('.radio-item, .checkbox-item');
 if (item) item.classList.toggle('selected', input.checked);
 });
 });

 updateUI();
})();
