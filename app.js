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
      if(target === "settings") refreshGoalsSettings();
      if(target === "goals") refreshGoalsList();
    });
  });

  // 🔹 Fix dla iOS Safari (viewport height bug z klawiaturą)
  function fixViewportHeight() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  }
  window.addEventListener('resize', fixViewportHeight);
  fixViewportHeight();

  // 🔹 Dane użytkownika
  let incomes = Array(12).fill(0);
  let bankBalance = 0;
  let cashBalance = 0;
  let savingsBalance = 0;
  let goals = [];
  let minIncome = null;
  let payments = [];

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
          refreshGoalsList();
          refreshGoalsSettings();
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
      const source = document.getElementById('tx-source').value;
      const note = document.getElementById('tx-note').value;

      if(isNaN(amount)){
        alert("Podaj poprawną kwotę (np. 5,50 lub 5.50)");
        return;
      }

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
      refreshIncomeGoal();

      const li = document.createElement('li');
      li.textContent = `${date} | ${type==='income'?'+':'-'}${formatPLN(amount)} | ${note} [${source}]`;
      txList.appendChild(li);

      txForm.reset();
    });
  }

  // 🔹 Zakładka Cele
  const goalsListEl = document.getElementById('goals-list');
  function refreshGoalsList(){
    if(!goalsListEl) return;
    goalsListEl.innerHTML = '';
    goals.forEach((g,i)=>{
      const div = document.createElement('div');
      div.classList.add('goal-item');
      div.innerHTML = `<strong>${g.name}</strong> (${formatPLN(g.saved)} / ${formatPLN(g.amount)})`;
      const payBtn = document.createElement('button');
      payBtn.textContent = "Wpłać";
      payBtn.addEventListener('click', ()=>{
        let amountInput = prompt("Kwota wpłaty:");
        if(amountInput){
          amountInput = amountInput.replace(',', '.');
          const amount = parseFloat(amountInput);
          if(!isNaN(amount)){
            const source = prompt("Źródło (bank/cash/savings):");
            if(source==='bank' && bankBalance>=amount){ bankBalance-=amount; g.saved+=amount; }
            else if(source==='cash' && cashBalance>=amount){ cashBalance-=amount; g.saved+=amount; }
            else if(source==='savings' && savingsBalance>=amount){ savingsBalance-=amount; g.saved+=amount; }
            else { alert("Nieprawidłowe źródło lub brak środków."); return; }
            refreshBalances();
            refreshGoalsDashboard();
            refreshGoalsList();
            refreshGoalsSettings();
          } else { alert("Nieprawidłowa kwota."); }
        }
      });
      div.appendChild(payBtn);
      goalsListEl.appendChild(div);
    });
  }

  // 🔹 Zakładka Ustawienia – lista celów do usunięcia
  const settingsGoalsList = document.createElement('div');
  function refreshGoalsSettings(){
    const settingsForm = document.getElementById('settings-form');
    if(!settingsForm) return;
    settingsGoalsList.innerHTML = "<h3>Twoje cele:</h3>";
    goals.forEach((g,i)=>{
      const div = document.createElement('div');
      div.classList.add('goal-settings-item');
      div.textContent = `${g.name} (${formatPLN(g.amount)})`;
      const delBtn = document.createElement('button');
      delBtn.textContent = "❌";
      delBtn.addEventListener('click', ()=>{
        if(confirm(`Usunąć cel "${g.name}"?`)){
          goals.splice(i,1);
          refreshGoalsDashboard();
          refreshGoalsList();
          refreshGoalsSettings();
        }
      });
      div.appendChild(delBtn);
      settingsGoalsList.appendChild(div);
    });
    if(!document.getElementById('settings-goals')){
      settingsGoalsList.id = 'settings-goals';
      settingsForm.parentElement.appendChild(settingsGoalsList);
    }
  }

  // 🔹 Formularz ustawień
  const settingsForm = document.getElementById('settings-form');
  if(settingsForm){
    settingsForm.addEventListener('submit', e=>{
      e.preventDefault();
      let bankVal = parseFloat(settingsForm.querySelector('#init-bank').value.replace(',','.')) || 0;
      let cashVal = parseFloat(settingsForm.querySelector('#init-cash').value.replace(',','.')) || 0;
      let savingsVal = parseFloat(settingsForm.querySelector('#init-savings').value.replace(',','.')) || 0;
      let minInc = parseFloat(settingsForm.querySelector('#min-income').value.replace(',','.'));
      bankBalance = bankVal;
      cashBalance = cashVal;
      savingsBalance = savingsVal;
      if(!isNaN(minInc)) minIncome = minInc;
      refreshBalances();
      refreshIncomeGoal();
      alert("Zapisano ustawienia!");
    });
  }

  // 🔹 Status minimalnego zarobku
  const incomeGoalStatusEl = document.getElementById("income-goal-status");
  function refreshIncomeGoal(){
    if(!incomeGoalStatusEl) return;
    if(!minIncome){
      incomeGoalStatusEl.textContent = "Brak ustawionego celu.";
      return;
    }
    const month = new Date().getMonth();
    const earned = incomes[month];
    const remaining = minIncome - earned;
    if(remaining > 0){
      incomeGoalStatusEl.textContent = `Do celu brakuje: ${formatPLN(remaining)}`;
    } else {
      incomeGoalStatusEl.textContent = `Cel osiągnięty! (+${formatPLN(Math.abs(remaining))})`;
    }
  }

  // 🔹 Nadchodzące płatności
  const paymentsListEl = document.getElementById("upcoming-payments");
  function refreshPayments(){
    if(!paymentsListEl) return;
    paymentsListEl.innerHTML = "";
    payments.forEach(p=>{
      const today = new Date();
      const payDate = new Date(p.date);
      const diffTime = payDate - today;
      const daysLeft = Math.ceil(diffTime / (1000*60*60*24));
      const li = document.createElement("li");
      li.textContent = `${p.name} – ${daysLeft} dni – ${formatPLN(p.amount)} (${p.source})`;
      paymentsListEl.appendChild(li);
    });
  }

  const paymentForm = document.getElementById("payment-form");
  if(paymentForm){
    paymentForm.addEventListener("submit", e=>{
      e.preventDefault();
      let name = document.getElementById("payment-name").value;
      let amount = document.getElementById("payment-amount").value.replace(",",".");
      let date = document.getElementById("payment-date").value;
      let source = document.getElementById("payment-source").value;
      let parsed = parseFloat(amount);

      if(!name || isNaN(parsed) || !date){
        alert("Podaj poprawne dane płatności.");
        return;
      }
      payments.push({name, amount:parsed, date, source});
      refreshPayments();
      paymentForm.reset();
    });
  }

  // 🔹 Inicjalizacja
  refreshBalances();
  refreshGoalsDashboard();
  refreshIncomeGoal();
  refreshPayments();
});