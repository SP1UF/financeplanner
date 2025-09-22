// Rejestracja service workera
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(console.error);
}

// Funkcja do pokazywania widoków
function show(viewId) {
  document.querySelectorAll('.view').forEach(v => v.style.display='none');
  document.getElementById(viewId).style.display='block';
}

// Nawigacja
document.getElementById('nav-dashboard').onclick = () => { show('view-dashboard'); refreshSummary(); };
document.getElementById('nav-transactions').onclick = () => { show('view-transactions'); refreshTransactions(); };
document.getElementById('nav-calendar').onclick = () => { show('view-calendar'); refreshCalendar(); };
document.getElementById('nav-goals').onclick = () => { show('view-goals'); refreshGoals(); };

// Formularz transakcji
document.getElementById('transaction-form').onsubmit = async e => {
  e.preventDefault();
  const tx = {
    date: document.getElementById('tx-date').value,
    amount: parseFloat(document.getElementById('tx-amount').value),
    type: document.getElementById('tx-type').value,
    note: document.getElementById('tx-note').value
  };
  await add('txns', tx);
  e.target.reset();
  refreshTransactions();
  refreshCalendar();
  refreshSummary();
};

// Formularz celów
document.getElementById('goal-form').onsubmit = async e => {
  e.preventDefault();
  const goal = {
    name: document.getElementById('goal-name').value,
    amount: parseFloat(document.getElementById('goal-amount').value)
  };
  await add('goals', goal);
  e.target.reset();
  refreshGoals();
};

// Funkcje renderowania
async function refreshTransactions(){
  const list = document.getElementById('tx-list');
  const txns = await getAll('txns');
  list.innerHTML = txns.map(t=>`<li>${t.date} | ${t.type==='income'?'+':'-'}${t.amount} | ${t.note||''}</li>`).join('');
}

async function refreshGoals(){
  const list = document.getElementById('goal-list');
  const goals = await getAll('goals');
  list.innerHTML = goals.map(g=>`<li>${g.name}: ${g.amount}</li>`).join('');
}

async function refreshSummary(){
  const sumDiv = document.getElementById('summary');
  const txns = await getAll('txns');
  const income = txns.filter(t=>t.type==='income').reduce((a,b)=>a+b.amount,0);
  const expense = txns.filter(t=>t.type==='expense').reduce((a,b)=>a+b.amount,0);
  sumDiv.innerHTML = `Zarobki: ${income} | Wydatki: ${expense} | Bilans: ${income-expense}`;
}

async function refreshCalendar(){
  const monthInput = document.getElementById('calendar-month');
  if(!monthInput.value) monthInput.value = new Date().toISOString().slice(0,7);
  const month = monthInput.value;
  const txns = await getAll('txns');
  const monthTxns = txns.filter(t=>t.date.startsWith(month));
  const byDay = {};
  monthTxns.forEach(t=>{
    if(!byDay[t.date]) byDay[t.date] = {income:0, expense:0};
    byDay[t.date][t.type==='income'?'income':'expense'] += t.amount;
  });
  const [y,m] = month.split('-').map(Number);
  const daysInMonth = new Date(y,m,0).getDate();
  const container = document.getElementById('calendar-days');
  container.innerHTML='';
  for(let d=1; d<=daysInMonth; d++){
    const date = `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dayData = byDay[date] || {income:0, expense:0};
    const div = document.createElement('div');
    div.className='calendar-day';
    div.innerHTML = `<strong>${d}.${m}.${y}</strong> <span style="color:lightgreen">+${dayData.income}</span> <span style="color:salmon">-${dayData.expense}</span>`;
    container.appendChild(div);
  }
  monthInput.onchange = refreshCalendar;
}