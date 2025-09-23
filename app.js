// Pełny plik app.js — gotowy od razu do wklejenia
document.addEventListener("DOMContentLoaded", () => {
  /* --------------------------
     Nawigacja dolna (przyciski)
     -------------------------- */
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById("view-" + target).classList.add("active");
      // po przełączeniu przewiń na top widoku
      window.scrollTo({top:0, behavior:'smooth'});
    });
  });

  /* --------------------------
     Dane i stany aplikacji
     -------------------------- */
  let incomes = Array(12).fill(0); // zarobki per miesiąc
  let bankBalance = 0;
  let cashBalance = 0;
  let savingsBalance = 0;
  let goals = []; // {name, amount, saved}

  /* --------------------------
     Formatowanie waluty
     -------------------------- */
  function formatPLN(value){
    // wartość number -> "1 234,56 PLN" (ale prostsze: 2 miejsca, przecinek)
    const n = Number(value) || 0;
    // używamy toLocaleString aby uzyskać separatory tysięcy zgodne z lokalizacją
    const str = n.toLocaleString('pl-PL', {minimumFractionDigits:2, maximumFractionDigits:2});
    return str + " PLN";
  }

  /* --------------------------
     Elementy DOM (balances)
     -------------------------- */
  const bankEl = document.getElementById('bank-balance');
  const cashEl = document.getElementById('cash-balance');
  const savingsEl = document.getElementById('savings-balance');
  function refreshBalances(){
    bankEl.textContent = formatPLN(bankBalance);
    cashEl.textContent = formatPLN(cashBalance);
    savingsEl.textContent = formatPLN(savingsBalance);
  }

  /* --------------------------
     Wykres zarobków (Chart.js)
     -------------------------- */
  const incomeCtx = document.getElementById('income-chart').getContext('2d');
  const incomeChart = new Chart(incomeCtx, {
    type: 'bar',
    data: {
      labels: ['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'],
      datasets: [{
        label: 'Zarobki',
        data: incomes,
        backgroundColor: 'rgba(37,99,235,0.85)',
        borderColor: 'rgba(37,99,235,1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks:{callback: (v)=> v ? v.toLocaleString('pl-PL') : v } }
      }
    }
  });

  /* --------------------------
     Cele — rysowanie pojedynczych kół
     -------------------------- */
  const goalsContainer = document.getElementById('goals-charts-container');
  function refreshGoalsDashboard(){
    goalsContainer.innerHTML = '';
    goals.forEach((g, idx) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'goal-chart-wrapper';
      const label = document.createElement('span');
      label.textContent = `${g.name} (${formatPLN(g.saved)} / ${formatPLN(g.amount)})`;
      const canvas = document.createElement('canvas');
      canvas.id = 'goal-canvas-' + idx;
      wrapper.appendChild(label);
      wrapper.appendChild(canvas);
      goalsContainer.appendChild(wrapper);

      new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: ['Zebrane','Pozostałe'],
          datasets: [{
            data: [g.saved, Math.max(0, g.amount - g.saved)],
            backgroundColor: ['rgba(37,99,235,0.85)', 'rgba(200,200,200,0.25)'],
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          cutout: '70%',
          plugins: { legend: { display: false } }
        }
      });

      // dodaj przyciski pod wykresem: dopłać / usuń
      const controls = document.createElement('div');
      controls.style.marginTop = '8px';
      controls.style.display = 'flex';
      controls.style.gap = '8px';
      const addBtn = document.createElement('button');
      addBtn.className = 'primary';
      addBtn.textContent = 'Dodaj do celu';
      addBtn.addEventListener('click', () => {
        let val = prompt(`Dodaj kwotę do celu "${g.name}" (np. 50,50):`);
        if(!val) return;
        val = val.replace(',', '.');
        const v = parseFloat(val);
        if(isNaN(v)) { alert('Nieprawidłowa kwota'); return; }
        g.saved = Math.min(g.amount, g.saved + v);
        refreshGoalsDashboard();
      });
      const delBtn = document.createElement('button');
      delBtn.className = 'danger';
      delBtn.textContent = 'Usuń cel';
      delBtn.addEventListener('click', () => {
        if(confirm(`Usunąć cel "${g.name}"?`)){
          goals.splice(idx,1);
          refreshGoalsDashboard();
        }
      });
      controls.appendChild(addBtn);
      controls.appendChild(delBtn);
      wrapper.appendChild(controls);
    });
  }

  /* --------------------------
     Dodaj cel z dashboard (przycisk)
     -------------------------- */
  document.getElementById('add-goal-btn').addEventListener('click', ()=>{
    const name = prompt("Nazwa celu:");
    if(!name) return;
    let amountInput = prompt("Kwota celu (np. 5000 lub 5000,50):");
    if(!amountInput) return;
    amountInput = amountInput.replace(',', '.');
    const amount = parseFloat(amountInput);
    if(isNaN(amount) || amount <= 0) { alert("Nieprawidłowa kwota."); return; }
    goals.push({name: name, amount: amount, saved: 0});
    refreshGoalsDashboard();
  });

  /* --------------------------
     Formularz transakcji
     -------------------------- */
  const txForm = document.getElementById('transaction-form');
  const txList = document.getElementById('tx-list');

  function addTxToList(entry){
    const li = document.createElement('li');
    const srcLabel = (entry.source === 'bank') ? 'Konto' : (entry.source === 'cash' ? 'Gotówka' : 'Oszczędności');
    const sign = entry.type === 'income' ? '+' : '-';
    li.textContent = `${entry.date} | ${sign}${formatPLN(entry.amount)} | ${entry.note || ''} [${srcLabel}]`;
    txList.insertBefore(li, txList.firstChild);
  }

  txForm.addEventListener('submit', e=>{
    e.preventDefault();
    const date = document.getElementById('tx-date').value || new Date().toISOString().slice(0,10);
    let amountInput = document.getElementById('tx-amount').value.trim();
    amountInput = amountInput.replace(',', '.');
    const amount = parseFloat(amountInput);
    const type = document.getElementById('tx-type').value;
    const source = document.getElementById('tx-source').value;
    const note = document.getElementById('tx-note').value;

    if(isNaN(amount) || amount <= 0){
      alert("Podaj poprawną kwotę (np. 5,50 lub 5.50)");
      return;
    }

    // wpływ na odpowiedni portfel
    if(type === 'income'){
      if(source === 'bank') bankBalance += amount;
      if(source === 'cash') cashBalance += amount;
      if(source === 'savings') savingsBalance += amount;
      // odo update wykresu: zwiększamy income dla miesiąca
      const month = new Date(date).getMonth();
      incomes[month] += amount;
      incomeChart.data.datasets[0].data[month] = incomes[month];
      incomeChart.update();
    } else {
      if(source === 'bank') bankBalance -= amount;
      if(source === 'cash') cashBalance -= amount;
      if(source === 'savings') savingsBalance -= amount;
    }

    refreshBalances();

    const txEntry = { date, amount, type, source, note };
    addTxToList(txEntry);

    // reset form
    txForm.reset();
  });

  // clear history button
  document.getElementById('clear-tx-btn').addEventListener('click', ()=>{
    if(confirm('Wyczyścić historię transakcji?')){
      txList.innerHTML = '';
    }
  });

  /* --------------------------
     Kalendarz (prosty widok dni)
     -------------------------- */
  function refreshCalendar(){
    const monthInput = document.getElementById('calendar-month');
    if(!monthInput.value) monthInput.value = new Date().toISOString().slice(0,7);
    const month = monthInput.value; // YYYY-MM
    const container = document.getElementById('calendar-days');
    container.innerHTML = '';
    // build days
    const [y,m] = month.split('-').map(Number);
    const daysInMonth = new Date(y,m,0).getDate();
    for(let d=1; d<=daysInMonth; d++){
      const date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const div = document.createElement('div');
      div.className = 'day-row';
      div.textContent = `${d}.${m}.${y}`;
      container.appendChild(div);
    }
  }
  document.getElementById('calendar-month').addEventListener('change', refreshCalendar);

  /* --------------------------
     Obsługa zachowania paska dolnego przy klawiaturze
     iOS czasem zmienia viewport i fixed element przemieszcza się.
     Tutaj wymuszamy przyklejenie i obsługujemy focus/blur pól.
     -------------------------- */
  const bottomNav = document.getElementById('bottom-nav');
  function keepBottomFixed(){
    // lekkie przesunięcie transform żeby wymusić repaint i utrzymać pozycję
    bottomNav.style.transform = 'translateZ(0) translateY(0)';
    bottomNav.style.position = 'fixed';
    bottomNav.style.bottom = '0';
  }
  // na focus pól wejściowych — próbujemy utrzymać pasek w miejscu
  document.querySelectorAll('input, textarea, select').forEach(inp=>{
    inp.addEventListener('focus', () => { setTimeout(keepBottomFixed, 50); });
    inp.addEventListener('blur', () => { setTimeout(keepBottomFixed, 50); });
  });
  // dodatkowo reagujemy na resize (klawiatura może zmienić wysokość viewport)
  window.addEventListener('resize', () => { setTimeout(keepBottomFixed, 50); });

  /* --------------------------
     Inicjalne odświeżenie widoków
     -------------------------- */
  refreshBalances();
  refreshGoalsDashboard();
  refreshCalendar();
});