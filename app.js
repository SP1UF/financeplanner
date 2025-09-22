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
  let incomes = Array(12).fill(0); // 12 miesięcy
  let bankBalance = 0;
  let goals = []; // bez pre-wpisanych celów

  // Stan konta
  const balanceEl = document.getElementById('bank-balance');
  function refreshBalance() { balanceEl.textContent = bankBalance + " PLN"; }

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
    goals.forEach((g,i)=>{
      const wrapper = document.createElement('div');
      wrapper.classList.add('goal-chart-wrapper');
      const label = document.createElement('span');
      label.textContent = `${g.name} (${g.saved}/${g.amount})`;
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

  // Dodawanie celów z dashboard
  document.getElementById('add-goal-btn').addEventListener('click', ()=>{
    const name = prompt("Nazwa celu:");
    const amount = parseFloat(prompt("Kwota celu:"));
    if(name && !isNaN(amount)){
      goals.push({name:name, amount:amount, saved:0});
      refreshGoalsDashboard();
    }
  });

  // Formularz transakcji
  const txForm = document.getElementById('transaction-form');
  const txList = document.getElementById('tx-list');
  txForm.addEventListener('submit', e=>{
    e.preventDefault();
    const date = document.getElementById('tx-date').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const type = document.getElementById('tx-type').value;
    const note = document.getElementById('tx-note').value;

    if(isNaN(amount)) return;

    // Zapis
    if(type==='income'){
      bankBalance += amount;
      const month = new Date(date).getMonth();
      incomes[month] += amount;
      incomeChart.data.datasets[0].data[month] = incomes[month];
      incomeChart.update();
    } else {
      bankBalance -= amount;
    }

    refreshBalance();

    // Dodaj do listy
    const li = document.createElement('li');
    li.textContent = `${date} | ${type==='income'?'+':'-'}${amount} PLN | ${note}`;
    txList.appendChild(li);

    // Czyści formularz
    txForm.reset();
  });

  refreshBalance();
  refreshGoalsDashboard();
});