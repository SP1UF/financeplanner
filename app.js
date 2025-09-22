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

  // Dane przykładowe
  let incomes = [3000, 2800, 3200, 3500, 3000, 3300, 3100, 3600, 3400, 3700, 3800, 4000];
  let goals = [
    { name:"Nowy laptop", amount:5000, saved:1500 },
    { name:"Wakacje", amount:8000, saved:2000 }
  ];

  // Dashboard - wykres zarobków
  const incomeCtx = document.getElementById('income-chart').getContext('2d');
  new Chart(incomeCtx, {
    type:'bar',
    data:{
      labels:['Styczeń','Luty','Marzec','Kwiecień','Maj','Czerwiec','Lipiec','Sierpień','Wrzesień','Październik','Listopad','Grudzień'],
      datasets:[{
        label:'Zarobki',
        data:incomes,
        backgroundColor:'rgba(59,130,246,0.7)',
        borderColor:'rgba(59,130,246,1)',
        borderWidth:1
      }]
    },
    options:{ responsive:true, plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true } } }
  });

  // Dashboard - wykres procentów celów
  const goalsCtx = document.getElementById('goals-chart').getContext('2d');
  new Chart(goalsCtx,{
    type:'doughnut',
    data:{
      labels: goals.map(g=>g.name),
      datasets:[{
        label:'Realizacja celów',
        data: goals.map(g=>Math.min(100, Math.round(g.saved/g.amount*100))),
        backgroundColor: goals.map((_,i)=>`hsl(${i*60},70%,50%)`)
      }]
    },
    options:{ responsive:true, plugins:{ legend:{ position:'bottom' } } }
  });

  // Lista celów w dashboard
  const goalListDash = document.getElementById('goal-list-dashboard');
  function refreshGoalsDashboard(){
    goalListDash.innerHTML = '';
    goals.forEach((g,i)=>{
      const li = document.createElement('li');
      li.textContent = `${g.name}: ${g.saved} / ${g.amount} (${Math.round(g.saved/g.amount*100)}%)`;
      goalListDash.appendChild(li);
    });
  }
  refreshGoalsDashboard();

  // Dodawanie celu z dashboard
  document.getElementById('add-goal-btn').addEventListener('click', ()=>{
    const name = prompt("Nazwa celu:");
    const amount = parseFloat(prompt("Kwota celu:"));
    if(name && !isNaN(amount)){
      goals.push({name:name, amount:amount, saved:0});
      refreshGoalsDashboard();
      goalsCtx.data.labels.push(name);
      goalsCtx.data.datasets[0].data.push(0);
      goalsCtx.update();
    }
  });
});