document.addEventListener("DOMContentLoaded", () => {
  // Nawigacja dolna
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

  // Dane użytkownika
  let incomes = Array(12).fill(0);
  let bankBalance = 0;
  let cashBalance = 0;
  let savingsBalance = 0;
  let goals = [];

  // Formatowanie kwot
  function formatPLN(value){
    return Number(value).toFixed(2).replace('.',',') + " PLN";
  }

  // Odświeżenie wyświetlanych sald
  const bankEl = document.getElementById('bank-balance');
  const cashEl = document.getElementById('cash-balance');
  const savingsEl = document.getElementById('savings-balance');
  function refreshBalances(){
    bankEl.textContent = formatPLN(bankBalance);
    cashEl.textContent = formatPLN(cashBalance);
    savingsEl.textContent = formatPLN(savingsBalance);
  }

  // Wykres zarobków
  const incomeCtx = document.getElementById('income-chart').getContext('2d');
  const incomeChart = new Chart(incomeCtx, {
    type:'bar',
    data:{
      labels:['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
      datasets:[{ label:'Zarobki', data:incomes, backgroundColor:'rgba(59,130,246,0.7)', borderColor:'rgba(59,130,246,1)', borderWidth:1 }]
    },
    options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });

  // Dashboard – cele
  const goalsContainer = document.getElementById('goals-charts-container');
  function refreshGoalsDashboard(){
    goalsContainer.innerHTML = '';
    goals.forEach((g)=>{
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

  // Dodawanie celu z dashboard
  document.getElementById('add-goal-btn').addEventListener('click', ()=>{
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

  // Formularz transakcji
  const txForm = document.getElementById('transaction-form');
  const txList = document.getElementById('tx-list');
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

    // Aktualizacja źródła
    if(type === 'income'){
      if(source === 'bank') bankBalance += amount;
      if(source === 'cash') cashBalance += amount;
      if(source === 'savings') savingsBalance += amount;
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

    // Dodanie do listy transakcji
    const li = document.createElement('li');
    li.textContent = `${date} | ${type==='income'?'+':'-'}${formatPLN(amount)} | ${note} [${source}]`;
    txList.appendChild(li);

    txForm.reset();
  });

  refreshBalances();
  refreshGoalsDashboard();
});