let transactions = [];
let payments = [];
let payouts = [];
let settings = JSON.parse(localStorage.getItem("settings")) || { minIncome: 0 };
let balances = JSON.parse(localStorage.getItem("balances")) || { bank:0, cash:0, savings:0 };

// Nawigacja
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.getElementById(btn.dataset.view).classList.add("active");
    btn.classList.add("active");
    updateUI();
  });
});

// Transakcje
document.getElementById("transactionForm").addEventListener("submit", e=>{
  e.preventDefault();
  let amount = parseFloat(document.getElementById("amount").value.replace(",", "."));
  let type = document.getElementById("type").value;
  let account = document.getElementById("account").value;
  if(isNaN(amount)) return alert("Podaj poprawną kwotę");

  transactions.push({amount,type,account,date:new Date().toISOString()});
  localStorage.setItem("transactions",JSON.stringify(transactions));
  e.target.reset();
  updateUI();
});

// Płatności
document.getElementById("paymentForm").addEventListener("submit", e=>{
  e.preventDefault();
  let name = document.getElementById("paymentName").value;
  let amount = parseFloat(document.getElementById("paymentAmount").value.replace(",", "."));
  let date = document.getElementById("paymentDate").value;
  let account = document.getElementById("paymentAccount").value;
  if(!date||isNaN(amount)) return alert("Wpisz poprawne dane");
  payments.push({name,amount,date,account});
  localStorage.setItem("payments",JSON.stringify(payments));
  e.target.reset();
  updateUI();
});

// Usuwanie płatności
function removePayment(i){ payments.splice(i,1); localStorage.setItem("payments",JSON.stringify(payments)); updateUI(); }

// Ustawienia
document.getElementById("settingsForm").addEventListener("submit", e=>{
  e.preventDefault();
  let minIncome = parseFloat(document.getElementById("minIncome").value.replace(",", "."));
  settings.minIncome = isNaN(minIncome)?0:minIncome;
  localStorage.setItem("settings",JSON.stringify(settings));
  updateUI();
});

// Początkowe saldo
document.getElementById("initialBalanceForm").addEventListener("submit", e=>{
  e.preventDefault();
  let bank = parseFloat(document.getElementById("initialBank").value.replace(",", "."))||0;
  let cash = parseFloat(document.getElementById("initialCash").value.replace(",", "."))||0;
  let savings = parseFloat(document.getElementById("initialSavings").value.replace(",", "."))||0;
  balances = {bank,cash,savings};
  localStorage.setItem("balances",JSON.stringify(balances));
  updateUI();
});

// Wypłaty
document.getElementById("payoutForm").addEventListener("submit", e=>{
  e.preventDefault();
  let day = parseInt(document.getElementById("payoutDay").value);
  if(day<1||day>31) return alert("Niepoprawny dzień");
  payouts.push(day);
  localStorage.setItem("payouts",JSON.stringify(payouts));
  e.target.reset();
  updateUI();
});
function removePayout(i){ payouts.splice(i,1); localStorage.setItem("payouts",JSON.stringify(payouts)); updateUI(); }

// UI
function updateUI(){
  let bank=balances.bank, cash=balances.cash, savings=balances.savings;
  let month = new Date().getMonth();
  let incomeThisMonth = 0;

  transactions.forEach(t=>{
    if(t.type==="income"){ 
      if(t.account==="bank") bank+=t.amount;
      if(t.account==="cash") cash+=t.amount;
      if(t.account==="savings") savings+=t.amount;
      if(new Date(t.date).getMonth()===month) incomeThisMonth+=t.amount;
    } else{
      if(t.account==="bank") bank-=t.amount;
      if(t.account==="cash") cash-=t.amount;
      if(t.account==="savings") savings-=t.amount;
    }
  });

  document.getElementById("bankBalance").textContent=`Konto bankowe: ${bank.toFixed(2)} PLN`;
  document.getElementById("cashBalance").textContent=`Gotówka: ${cash.toFixed(2)} PLN`;
  document.getElementById("savingsBalance").textContent=`Oszczędności: ${savings.toFixed(2)} PLN`;

  let diff = settings.minIncome - incomeThisMonth;
  document.getElementById("minIncomeStatus").textContent = diff>0?`Brakuje ${diff.toFixed(2)} PLN do celu (${settings.minIncome} PLN)`:`Cel zarobku osiągnięty! (${incomeThisMonth.toFixed(2)} PLN)`;

  document.getElementById("transactionList").innerHTML=transactions.slice().reverse().map(t=>`<li>${t.type==="income"?"➕":"➖"} ${t.amount.toFixed(2)} PLN (${t.account})</li>`).join("");

  document.getElementById("paymentList").innerHTML=payments.map((p,i)=>`<li>${p.name}: ${p.amount.toFixed(2)} PLN - ${p.date} (${p.account}) <button onclick="removePayment(${i})">❌</button></li>`).join("");

  let today=new Date();
  document.getElementById("upcomingPayments").innerHTML=payments.map(p=>{
    let diffDays=Math.ceil((new Date(p.date)-today)/(1000*60*60*24));
    return diffDays>=0?`<li>${p.name}: ${p.amount.toFixed(2)} PLN za ${diffDays} dni (${p.account})</li>`:"";
  }).join("");

  document.getElementById("payoutList").innerHTML=payouts.map((d,i)=>`<li>Dzień ${d} <button onclick="removePayout(${i})">❌</button></li>`).join("");

  document.getElementById("upcomingPayouts").innerHTML=payouts.map(d=>{
    let now=new Date();
    let payoutDate=new Date(now.getFullYear(),now.getMonth(),d);
    if(payoutDate<now) payoutDate.setMonth(payoutDate.getMonth()+1);
    let diffDays=Math.ceil((payoutDate-now)/(1000*60*60*24));
    return diffDays===0?`<li>🎉 Dziś wypłata (${d}.${now.getMonth()+1})</li>`:`<li>Wypłata za ${diffDays} dni (${d}.${payoutDate.getMonth()+1})</li>`;
  }).join("");

  // Wykres
  let ctx=document.getElementById("incomeChart").getContext("2d");
  if(window.incomeChart) window.incomeChart.destroy();
  let monthlyIncome=Array(12).fill(0);
  transactions.forEach(t=>{ if(t.type==="income") monthlyIncome[new Date(t.date).getMonth()]+=t.amount; });

  window.incomeChart=new Chart(ctx,{
    type:"bar",
    data:{
      labels:["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"],
      datasets:[{label:"Zarobki",data:monthlyIncome,backgroundColor:"rgba(59,130,246,0.8)"}]
    },
    options:{
      plugins:{legend:{labels:{color: getComputedStyle(document.documentElement).getPropertyValue('--text')}}},
      scales:{y:{beginAtZero:true,ticks:{color:getComputedStyle(document.documentElement).getPropertyValue('--text')}} ,x:{ticks:{color:getComputedStyle(document.documentElement).getPropertyValue('--text')}}}
    }
  });

  localStorage.setItem("balances",JSON.stringify({bank,cash,savings}));
}

updateUI();