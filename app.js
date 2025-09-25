document.addEventListener("DOMContentLoaded",()=>{

// 🔹 Nawigacja
const navButtons=document.querySelectorAll(".nav-btn");
navButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    navButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const target=btn.dataset.target;
    document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
    document.getElementById("view-"+target).classList.add("active");
  });
});

// 🔹 Fix iOS viewport
function fixViewportHeight(){document.documentElement.style.setProperty('--vh',window.innerHeight*0.01+'px');}
window.addEventListener('resize',fixViewportHeight);
fixViewportHeight();

// 🔹 Dane
let incomes=Array(12).fill(0);
let bankBalance=0, cashBalance=0, savingsBalance=0;
let minIncome=null;
let payments=[], recurringPayments=[];

// 🔹 Formatowanie
function formatPLN(value){return Number(value).toFixed(2).replace('.',',')+" PLN";}

// 🔹 Salda
const balanceBankEl=document.getElementById('bank-balance');
const balanceCashEl=document.getElementById('cash-balance');
const balanceSavingsEl=document.getElementById('savings-balance');
function refreshBalances(){
  if(balanceBankEl)balanceBankEl.textContent=formatPLN(bankBalance);
  if(balanceCashEl)balanceCashEl.textContent=formatPLN(cashBalance);
  if(balanceSavingsEl)balanceSavingsEl.textContent=formatPLN(savingsBalance);
}

// 🔹 Wykres
const incomeCtx=document.getElementById('income-chart').getContext('2d');
const incomeChart=new Chart(incomeCtx,{type:'bar',data:{labels:['Sty','Lut','Mar','Kwi','Maj','Cze','Lip','Sie','Wrz','Paź','Lis','Gru'],datasets:[{label:'Zarobki',data:incomes,backgroundColor:'rgba(59,130,246,0.7)',borderColor:'rgba(59,130,246,1)',borderWidth:1}]},options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true}}}});

// 🔹 Minimalny zarobek
const incomeGoalStatusEl=document.getElementById("income-goal-status");
function refreshIncomeGoal(){
  if(!incomeGoalStatusEl) return;
  if(!minIncome){incomeGoalStatusEl.textContent="Brak ustawionego celu."; return;}
  const month=new Date().getMonth();
  const earned=incomes[month];
  const remaining=minIncome-earned;
  incomeGoalStatusEl.textContent=remaining>0?`Do celu brakuje: ${formatPLN(remaining)}`:`Cel osiągnięty! (+${formatPLN(Math.abs(remaining))})`;
}

// 🔹 Transakcje
const txForm=document.getElementById('transaction-form');
const txList=document.getElementById('tx-list');
if(txForm){txForm.addEventListener('submit',e=>{
  e.preventDefault();
  const date=document.getElementById('tx-date').value;
  let amountInput=document.getElementById('tx-amount').value.trim().replace(',','.');
  const amount=parseFloat(amountInput);
  const type=document.getElementById('tx-type').value;
  const source=document.getElementById('tx-source').value;
  const note=document.getElementById('tx-note').value;
  if(isNaN(amount)){alert("Podaj poprawną kwotę (np. 5,50 lub 5.50)");return;}
  if(type==='income'){
    if(source==='bank') bankBalance+=amount;
    if(source==='cash') cashBalance+=amount;
    if(source==='savings') savingsBalance+=amount;
    const month=new Date(date).getMonth();
    incomes[month]+=amount;
    incomeChart.data.datasets[0].data[month]=incomes[month];
    incomeChart.update();
  }else{
    if(source==='bank') bankBalance-=amount;
    if(source==='cash') cashBalance-=amount;
    if(source==='savings') savingsBalance-=amount;
  }
  refreshBalances();
  refreshIncomeGoal();
  const li=document.createElement('li');
  li.textContent=`${date} | ${type==='income'?'+':'-'}${formatPLN(amount)} | ${note} [${source}]`;
  txList.appendChild(li);
  txForm.reset();
}});

// 🔹 Nadchodzące płatności
const paymentsListEl=document.getElementById("upcoming-payments");
function refreshPayments(){
  if(!paymentsListEl) return;
  paymentsListEl.innerHTML="";
  payments.forEach(p=>{
    const today=new Date();
    const payDate=new Date(p.date);
    const diffTime=payDate-today;
    const daysLeft=Math.ceil(diffTime/(1000*60*60*24));
    const li=document.createElement("li");
    li.textContent=`${p.name} – ${daysLeft} dni – ${formatPLN(p.amount)} (${p.source})`;
    paymentsListEl.appendChild(li);
  });
}
const paymentForm=document.getElementById("payment-form");
if(paymentForm){paymentForm.addEventListener("submit",e=>{
  e.preventDefault();
  let name=document.getElementById("payment-name").value;
  let amount=document.getElementById("payment-amount").value.replace(',','.');
  let date=document.getElementById("payment-date").value;
  let source=document.getElementById("payment-source").value;
  let parsed=parseFloat(amount);
  if(!name||isNaN(parsed)||!date){alert("Podaj poprawne dane płatności.");return;}
  payments.push({name,amount:parsed,date,source});
  refreshPayments();
  paymentForm.reset();
}});

// 🔹 Płatności zaplanowane
const recurringListEl=document.getElementById("recurring-payments");
function refreshRecurring(){
  if(!recurringListEl) return;
  recurringListEl.innerHTML="";
  recurringPayments.forEach(p=>{
    let nextDate=calcNextDate(p);
    let diff=Math.ceil((nextDate-new Date())/(1000*60*60*24));
    const li=document.createElement("li");
    li.textContent=`${p.name} – ${formatPLN(p.amount)} (${p.source}) | ${p.interval} | następna: ${nextDate.toLocaleDateString()} (${diff} dni)`;
    recurringListEl.appendChild(li);
  });
}
function calcNextDate(payment){
  let now=new Date();
  let next=new Date(payment.lastPaid);
  if(payment.interval==="monthly") next.setMonth(next.getMonth()+1);
  else next.setDate(next.getDate()+7);
  while(next<now){
    if(payment.interval==="monthly") next.setMonth(next.getMonth()+1);
    else next.setDate(next.getDate()+7);
  }
  return next;
}
const recurringForm=document.getElementById("recurring-form");
if(recurringForm){recurringForm.addEventListener("submit",e=>{
  e.preventDefault();
  let name=document.getElementById("recurring-name").value;
  let amount=document.getElementById("recurring-amount").value.replace(',','.');
  let source=document.getElementById("recurring-source").value;
  let interval=document.getElementById("recurring-interval").value;
  let parsed=parseFloat(amount);
  if(!name||isNaN(parsed)){alert("Podaj poprawne dane płatności zaplanowane.");return;}
  recurringPayments.push({name,amount:parsed,source,interval,lastPaid:new Date()});
  refreshRecurring();
  recurringForm.reset();
}});

// 🔹 Formularz ustawień
const settingsForm=document.getElementById("settings-form");
if(settingsForm){settingsForm.addEventListener('submit',e=>{
  e.preventDefault();
  let bankVal=parseFloat(settingsForm.querySelector('#init-bank').value.replace(',','.'))||0;
  let cashVal=parseFloat(settingsForm.querySelector('#init-cash').value.replace(',','.'))||0;
  let savingsVal=parseFloat(settingsForm.querySelector('#init-savings').value.replace(',','.'))||0;
  let minInc=parseFloat(settingsForm.querySelector('#min-income').value.replace(',','.'));
  bankBalance=bankVal; cashBalance=cashVal; savingsBalance=savingsVal;
  if(!isNaN(minInc)) minIncome=minInc;
  refreshBalances();
  refreshIncomeGoal();
  alert("Zapisano ustawienia!");
}});

// 🔹 Init
refreshBalances(); refreshIncomeGoal(); refreshPayments(); refreshRecurring();

});