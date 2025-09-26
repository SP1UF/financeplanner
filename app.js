let transactions = [];
let payments = [];
let payouts = [];
let balances = { bank: 0, cash: 0, savings: 0 };
let minIncome = 0;

// Instrukcja instalacji w Safari
function showInstallInstructions() {
  document.getElementById("installOverlay").classList.add("active");
}
function closeInstallInstructions() {
  document.getElementById("installOverlay").classList.remove("active");
}
if (navigator.userAgent.includes("Safari") && !navigator.standalone) {
  setTimeout(showInstallInstructions, 2000);
}

// Nawigacja
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
    document.getElementById(btn.dataset.view).classList.add("active");
  });
});

// Formularze
document.getElementById("transactionForm").addEventListener("submit", e => {
  e.preventDefault();
  let amount = parseFloat(document.getElementById("amount").value.replace(",","."));
  let type = document.getElementById("type").value;
  let account = document.getElementById("account").value;
  if(isNaN(amount)) return alert("Podaj poprawną kwotę");

  transactions.push({ amount, type, account, date: new Date() });
  if(type==="income") balances[account]+=amount;
  else balances[account]-=amount;

  updateUI();
  e.target.reset();
});

document.getElementById("paymentForm").addEventListener("submit", e => {
  e.preventDefault();
  let name=document.getElementById("paymentName").value;
  let amount=parseFloat(document.getElementById("paymentAmount").value.replace(",","."));
  let date=document.getElementById("paymentDate").value;
  let account=document.getElementById("paymentAccount").value;
  payments.push({ name, amount, date, account });
  updateUI();
  e.target.reset();
});

document.getElementById("settingsForm").addEventListener("submit", e => {
  e.preventDefault();
  minIncome=parseFloat(document.getElementById("minIncome").value.replace(",","."));
  updateUI();
});

document.getElementById("initialBalanceForm").addEventListener("submit", e => {
  e.preventDefault();
  balances.bank=parseFloat(document.getElementById("initialBank").value.replace(",",".")||0);
  balances.cash=parseFloat(document.getElementById("initialCash").value.replace(",",".")||0);
  balances.savings=parseFloat(document.getElementById("initialSavings").value.replace(",",".")||0);
  updateUI();
});

document.getElementById("payoutForm").addEventListener("submit", e => {
  e.preventDefault();
  let day=parseInt(document.getElementById("payoutDay").value);
  if(day>=1 && day<=31) payouts.push(day);
  updateUI();
  e.target.reset();
});

document.getElementById("resetApp").addEventListener("click", ()=>{
  if(confirm("Na pewno chcesz zresetować aplikację?")) {
    transactions=[]; payments=[]; payouts=[]; balances={bank:0,cash:0,savings:0}; minIncome=0;
    updateUI();
  }
});

// UI
function updateUI(){
  document.getElementById("bankBalance").textContent=`Konto bankowe: ${balances.bank.toFixed(2)} PLN`;
  document.getElementById("cashBalance").textContent=`Gotówka: ${balances.cash.toFixed(2)} PLN`;
  document.getElementById("savingsBalance").textContent=`Oszczędności: ${balances.savings.toFixed(2)} PLN`;

  let list=document.getElementById("transactionList");
  list.innerHTML="";
  transactions.slice(-10).reverse().forEach(t=>{
    let li=document.createElement("li");
    li.textContent=`${t.type==="income"?"+" : "-"}${t.amount.toFixed(2)} PLN (${t.account})`;
    list.appendChild(li);
  });

  let payList=document.getElementById("paymentList");
  payList.innerHTML="";
  payments.forEach((p,i)=>{
    let li=document.createElement("li");
    li.textContent=`${p.name}: ${p.amount.toFixed(2)} PLN (${p.date}, ${p.account})`;
    let btn=document.createElement("button");
    btn.textContent="Usuń";
    btn.onclick=()=>{ payments.splice(i,1); updateUI(); };
    li.appendChild(btn);
    payList.appendChild(li);
  });

  let payoutList=document.getElementById("payoutList");
  payoutList.innerHTML="";
  payouts.forEach((d,i)=>{
    let li=document.createElement("li");
    li.textContent=`Dzień ${d}`;
    let btn=document.createElement("button");
    btn.textContent="Usuń";
    btn.onclick=()=>{ payouts.splice(i,1); updateUI(); };
    li.appendChild(btn);
    payoutList.appendChild(li);
  });

  let totalIncome=transactions.filter(t=>t.type==="income").reduce((a,b)=>a+b.amount,0);
  document.getElementById("minIncomeStatus").textContent=`Brakuje ${(minIncome-totalIncome).toFixed(2)} PLN do celu`;

  renderIncomeChart();
  renderUpcoming();
}

function renderUpcoming(){
  let up=document.getElementById("upcomingPayments");
  up.innerHTML="";
  let now=new Date();
  payments.forEach(p=>{
    let d=new Date(p.date);
    let diff=Math.ceil((d-now)/(1000*60*60*24));
    let li=document.createElement("li");
    li.textContent=`${p.name}: ${p.amount.toFixed(2)} PLN za ${diff} dni (${p.account})`;
    up.appendChild(li);
  });

  let up2=document.getElementById("upcomingPayouts");
  up2.innerHTML="";
  let today=new Date().getDate();
  payouts.forEach(d=>{
    let diff=d-today;
    if(diff<0) diff+=30;
    let li=document.createElement("li");
    li.textContent=`Wypłata za ${diff} dni (dzień ${d})`;
    up2.appendChild(li);
  });
}

// Wykres
function renderIncomeChart(){
  let ctx=document.getElementById("incomeChart").getContext("2d");
  if(window.incomeChart) window.incomeChart.destroy();
  let monthlyIncome=Array(12).fill(0);
  transactions.forEach(t=>{
    if(t.type==="income") monthlyIncome[new Date(t.date).getMonth()]+=t.amount;
  });
  window.incomeChart=new Chart(ctx,{
    type:"bar",
    data:{labels:["Styczeń","Luty","Marzec","Kwiecień","Maj","Czerwiec","Lipiec","Sierpień","Wrzesień","Październik","Listopad","Grudzień"],
      datasets:[{label:"Zarobki",data:monthlyIncome,backgroundColor:"rgba(59,130,246,0.8)"}]},
    options:{responsive:true,maintainAspectRatio:false,
      plugins:{legend:{labels:{color:getComputedStyle(document.body).color}}},
      scales:{y:{beginAtZero:true,ticks:{color:getComputedStyle(document.body).color}},
              x:{ticks:{color:getComputedStyle(document.body).color}}}}
  });
}

updateUI();