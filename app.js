// app.js
document.addEventListener('DOMContentLoaded', async () => {
  // Init date
  document.getElementById('today-date').textContent = new Date().toLocaleDateString('pl-PL', {weekday:'long', year:'numeric', month:'short', day:'numeric'});

  await openDB();

  // Navigation
  const views = document.querySelectorAll('.view');
  function show(id){
    views.forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('.sidebar button').forEach(b => b.classList.remove('active'));
    document.querySelector(`[id="nav-${id.split('-')[1]||'dashboard'}"]`)?.classList.add('active');
  }
  document.getElementById('nav-dashboard').onclick = () => { refreshAll(); show('view-dashboard'); };
  document.getElementById('nav-daily').onclick = () => { refreshAll(); show('view-daily'); };
  document.getElementById('nav-goals').onclick = () => { refreshAll(); show('view-goals'); };
  document.getElementById('nav-scheduled').onclick = () => { refreshAll(); show('view-scheduled'); };
  document.getElementById('nav-reports').onclick = () => { refreshReport(); show('view-reports'); };

  document.getElementById('clear-data').onclick = async () => {
    if(confirm('Na pewno usunąć WSZYSTKIE dane?')) {
      await clearStore('txns'); await clearStore('goals'); refreshAll();
    }
  };

  // Form handlers
  const txnForm = document.getElementById('txn-form');
  txnForm.onsubmit = async (e) => {
    e.preventDefault();
    const date = document.getElementById('txn-date').value || new Date().toISOString().slice(0,10);
    const type = document.getElementById('txn-type').value;
    const amount = parseFloat(document.getElementById('txn-amount').value) || 0;
    const category = document.getElementById('txn-category').value || '';
    const note = document.getElementById('txn-note').value || '';
    const scheduled = document.getElementById('txn-scheduled').checked;
    await addItem('txns', { date, type, amount, category, note, scheduled, createdAt: new Date().toISOString() });
    txnForm.reset(); refreshAll(); alert('Dodano transakcję');
  };

  const goalForm = document.getElementById('goal-form');
  goalForm.onsubmit = async (e) => {
    e.preventDefault();
    const title = document.getElementById('goal-title').value;
    const target = parseFloat(document.getElementById('goal-target').value) || 0;
    await addItem('goals', { title, target, createdAt: new Date().toISOString() });
    goalForm.reset(); refreshGoals(); refreshAll();
  };

  // Refresh functions
  async function refreshAll(){
    await renderBalance();
    await renderRecent();
    await renderTodayTotals();
    await renderNextScheduled();
    await renderTxnList();
    await refreshGoals();
  }

  async function renderBalance(){
    const txns = await getAll('txns');
    let bal = 0;
    txns.forEach(t => bal += (t.type === 'income' ? 1 : -1) * t.amount);
    document.getElementById('balance-amount').textContent = formatMoney(bal);
  }

  async function renderTodayTotals(){
    const today = new Date().toISOString().slice(0,10);
    const txns = await getAll('txns');
    const todayTx = txns.filter(t => t.date === today);
    const income = todayTx.filter(t => t.type === 'income').reduce((s,i)=>s+i.amount,0);
    const expense = todayTx.filter(t => t.type === 'expense').reduce((s,i)=>s+i.amount,0);
    document.getElementById('today-income').textContent = formatMoney(income);
    document.getElementById('today-expense').textContent = formatMoney(expense);
  }

  async function renderNextScheduled(){
    const txns = await getAll('txns');
    const scheduled = txns.filter(t => t.scheduled).sort((a,b)=> (a.date > b.date?1:-1)).slice(0,5);
    const ul = document.getElementById('next-scheduled');
    ul.innerHTML = '';
    if(scheduled.length===0) ul.innerHTML = '<li class="small">Brak zaplanowanych transakcji</li>';
    scheduled.forEach(s=>{
      const li = document.createElement('li');
      li.textContent = `${s.date} • ${s.type==='income'?'+' : '-'} ${formatMoney(s.amount)} • ${s.category||''}`;
      ul.appendChild(li);
    });
  }

  async function renderRecent(){
    const txns = await getAll('txns');
    const sort = txns.sort((a,b)=> (a.date < b.date?1:-1)).slice(0,10);
    const tbody = document.querySelector('#recent-table tbody');
    tbody.innerHTML = '';
    sort.forEach(t=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.date}</td><td>${t.type}</td><td>${t.category||''}</td><td>${formatMoney(t.amount)}</td><td>${t.note||''}</td>`;
      tbody.appendChild(tr);
    });
  }

  async function renderTxnList(){
    const txns = await getAll('txns');
    const tbody = document.querySelector('#txn-table tbody');
    tbody.innerHTML = '';
    txns.sort((a,b)=>a.date < b.date ? 1 : -1).forEach(t=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${t.date}</td><td>${t.type}</td><td>${formatMoney(t.amount)}</td><td>${t.category||''}</td>
        <td><button data-id="${t.id}" class="del">Usuń</button></td>`;
      tbody.appendChild(tr);
    });
    document.querySelectorAll('#txn-table .del').forEach(b=>{
      b.onclick = async () => {
        if(confirm('Usuń tę transakcję?')){
          await deleteItem('txns', Number(b.dataset.id));
          refreshAll();
        }
      };
    });
  }

  async function refreshGoals(){
    const goals = await getAll('goals');
    const allTx = await getAll('txns');
    const container = document.getElementById('goals-list');
    container.innerHTML = '';
    if(goals.length===0) container.innerHTML = '<div class="small">Brak celów. Dodaj nowy cel.</div>';
    goals.forEach(g=>{
      const saved = allTx.filter(t=> t.type==='income').reduce((s,i)=>s+i.amount,0) - allTx.filter(t=> t.type==='expense').reduce((s,i)=>s+i.amount,0);
      // for demo, progress uses current balance; in real app you might track assigned savings
      const progress = Math.min(100, Math.round((saved / g.target) * 100));
      const card = document.createElement('div'); card.className='goal-card';
      card.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center">
        <strong>${g.title}</strong><span class="small">${formatMoney(g.target)}</span></div>
        <div class="small">Progres: ${progress}%</div>
      `;
      container.appendChild(card);
    });
  }

  async function renderScheduledList(){
    const txns = await getAll('txns');
    const scheduled = txns.filter(t=>t.scheduled).sort((a,b)=> a.date > b.date ? 1 : -1);
    const ul = document.getElementById('scheduled-list'); ul.innerHTML = '';
    if(scheduled.length===0) ul.innerHTML = '<li class="small">Brak</li>';
    scheduled.forEach(s=>{
      const li = document.createElement('li');
      li.innerHTML = `<div>${s.date} • ${s.type} • ${formatMoney(s.amount)} <span class="small">${s.category||''}</span></div>
        <div><button data-id="${s.id}" class="del-s">Usuń</button></div>`;
      ul.appendChild(li);
    });
    document.querySelectorAll('.del-s').forEach(b=>{
      b.onclick = async () => { if(confirm('Usuń zaplanowaną transakcję?')){ await deleteItem('txns', Number(b.dataset.id)); refreshAll(); } };
    });
  }

  async function refreshReport(){
    const txns = await getAll('txns');
    const byMonth = {};
    txns.forEach(t=>{
      const m = t.date.slice(0,7);
      byMonth[m] = byMonth[m] || { income:0, expense:0 };
      byMonth[m][t.type === 'income' ? 'income' : 'expense'] += t.amount;
    });
    const elm = document.getElementById('report-summary');
    elm.innerHTML = '<h4>Przychody/wydatki wg miesiąca</h4>';
    const table = document.createElement('table');
    table.innerHTML = '<thead><tr><th>Miesiąc</th><th>Przychód</th><th>Wydatek</th></tr></thead>';
    const tbody = document.createElement('tbody');
    Object.keys(byMonth).sort().reverse().forEach(m=>{
      const r = byMonth[m];
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${m}</td><td>${formatMoney(r.income)}</td><td>${formatMoney(r.expense)}</td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    elm.appendChild(table);
  }

  function formatMoney(n){
    return (n || 0).toLocaleString('pl-PL', { style:'currency', currency:'PLN' });
  }

  // initial load
  await refreshAll();

  // ensure scheduled list refreshed when view shown
  document.getElementById('nav-scheduled').addEventListener('click', renderScheduledList);

  // Register service worker for offline
  if('serviceWorker' in navigator){
    navigator.serviceWorker.register('sw.js').then(()=>console.log('SW registered')).catch(()=>{});
  }
});