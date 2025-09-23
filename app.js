document.addEventListener("DOMContentLoaded", () => {
  // 🔹 Dolna nawigacja
  const navButtons = document.querySelectorAll(".nav-btn");
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      navButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.dataset.target;
      document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
      document.getElementById("view-" + target).classList.add("active");
    });
  });

  // 🔹 Fix dla iOS Safari (viewport height bug z klawiaturą)
  function fixViewportHeight() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  }
  window.addEventListener('resize', fixViewportHeight);
  fixViewportHeight();

  // 🔹 Dane użytkownika
  let incomes = Array(12).fill(0); // 12 miesięcy
  let bankBalance = 0;
  let cashBalance = 0;
  let savingsBalance = 0;
  let goals = []; // cele od zera

  // 🔹 Formatowanie waluty
  function formatPLN(value){
    return Number(value).toFixed(2).replace('.',',') + " PLN";
  }

  // 🔹 Wyświetlanie sald
  const balanceBankEl = document.getElementById('bank-balance');
  const balanceCashEl = document.getElementById('cash-balance');
  const balanceSavingsEl = document.getElementById('savings-balance');
  function refreshBalances() {
    if(balanceBankEl) balanceBankEl.textContent = formatPLN(bankBalance);
    if(balanceCashEl) balanceCashEl.textContent = formatPLN(cashBalance);
    if(balanceSavingsEl) balanceSavingsEl.textContent = formatPLN(savingsBalance);
  }

  // 🔹 Wykres zarobków
  const incomeCtx = document.getElementById('income-chart').getContext('2d');
  const incomeChart = new Chart(incomeCtx, {
    type:'bar',
    data:{
      labels:['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
      datasets:[{ label:'Zarobki', data:incomes, backgroundColor:'rgba(59,130,246,0.7)', borderColor:'rgba(59,130,246,1)', borderWidth:1 }]
    },
    options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });

  // 🔹 Dashboard – cele
  const goalsContainer = document.getElementById('goals-charts-container');
  function refreshGoalsDashboard(){
    if(!goalsContainer) return;
    goalsContainer.innerHTML = '';
    goals.forEach((g,i)=>{
      const wrapper = document.createElement('div');
      wrapper.classList.add('goal-chart-wrapper');
      const label = document.createElement('span');
      label.textContent = `${g.name} (${formatPLN(g.saved)} / ${formatPLN(g.amount)})`;
      const canvas = document.createElement('canvas');
      wrapper.appendChild(label);
      wrapper.appendChild(canvas);
      goalsContainer.appendChild(wrapper);

      new Chart(canvas.getContext('2d'),{
        type:'doughnut',
        data:{ labels:['Zebrane','Pozostałe'], datasets:[{ data:[g.saved,g.amount-g.saved], backgroundColor:['rgba(59,130,246,0.7)','rgba(200,200,200,0.3)'] }] },
        options:{ responsive:true, plugins:{ legend:{ display:false } }, cutout:'70%' }
      });
    });
  }

  // 🔹 Dodawanie celów
  const addGoalBtn = document.getElementById('add-goal-btn');
  if(addGoalBtn){
    addGoalBtn.addEventListener('click', ()=>{
      const name = prompt("Nazwa celu:");
      let amountInput = prompt("Kwota celu (np. 5000 lub 5000,50):");
      if(name && amountInput){
        amountInput = amountInput.replace(',', '.');
        const amount = parseFloat(amountInput);
        if(!isNaN(amount)){
          goals.push({name:name, amount:amount, saved:0});
          refreshGoalsDashboard();
        } else { alert("Nieprawidłowa kwota."); }
      }
    });
  }

  // 🔹 Formularz transakcji
  const txForm = document.getElementById('transaction-form');
  const txList = document.getElementById('tx-list');
  if(txForm){
    txForm.addEventListener('submit', e=>{
      e.preventDefault();
      const date = document.getElementById('tx-date').value;
      let amountInput = document.getElementById('tx-amount').value.trim();
      amountInput = amountInput.replace(',', '.');
      const amount = parseFloat(amountInput);
      const type = document.getElementById('tx-type').value;
      const source = document.getElementById('tx-source').value; // konto, gotówka, oszczędności
      const note = document.getElementById('tx-note').value;

      if(isNaN(amount)){
        alert("Podaj poprawną kwotę (np. 5,50 lub 5.50)");
        return;
      }

      // 🔹 Zapis i aktualizacja konta/gotówki/oszczędności
      if(type==='income'){
        if(source==='bank') bankBalance += amount;
        if(source==='cash') cashBalance += amount;
        if(source==='savings') savingsBalance += amount;
        const month = new Date(date).getMonth();
        incomes[month] += amount;
        incomeChart.data.datasets[0].data[month] = incomes[month];
        incomeChart.update();
      } else {
        if(source==='bank') bankBalance -= amount;
        if(source==='cash') cashBalance -= amount;
        if(source==='savings') savingsBalance -= amount;
      }

      refreshBalances();

      // 🔹 Dodaj do listy
      const li = document.createElement('li');
      li.textContent = `${date} | ${type==='income'?'+':'-'}${formatPLN(amount)} | ${note} [${source}]`;
      txList.appendChild(li);

      txForm.reset();
    });
  }

  // 🔹 Formularz ustawień – początkowe salda
  const settingsForm = document.getElementById('settings-form');
  if(settingsForm){
    settingsForm.addEventListener('submit', e=>{
      e.preventDefault();
      let bank = document.getElementById('init-bank').value.trim().replace(',', '.');
      let cash = document.getElementById('init-cash').value.trim().replace(',', '.');
      let savings = document.getElementById('init-savings').value.trim().replace(',', '.');

      bankBalance = parseFloat(bank) || bankBalance;
      cashBalance = parseFloat(cash) || cashBalance;
      savingsBalance = parseFloat(savings) || savingsBalance;

      refreshBalances();
      alert("Salda zostały zaktualizowane!");
    });
  }

  // 🔹 Inicjalizacja
  refreshBalances();
  refreshGoalsDashboard();
});