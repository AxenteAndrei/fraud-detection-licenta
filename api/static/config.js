// ============================================================
// config.js — date statice + helperi puri (fara DOM).
// ============================================================

const TOP = ["V14","V10","V12","V17","V16"];
const TOP_LABEL = {
  V14:"V14 * (imp=0.2065)", V10:"V10 * (imp=0.1292)",
  V12:"V12 * (imp=0.1148)", V17:"V17 * (imp=0.1106)", V16:"V16 * (imp=0.0785)"
};

// Texte de ajutor ONESTE. Amount/Time au semnificatie reala; V1-V28 sunt
// componente PCA anonimizate (fara nume real, din motive de confidentialitate).
const HELP = {
  Amount: "Suma tranzactiei in EUR. Fraudele au tipic sume mici (mediana 9.25 EUR), dar pot aparea si sume mari.",
  Time:   "Secunde de la prima tranzactie din dataset (48 ore total). Fraudele sunt distribuite uniform, cele legitime au un tipar ciclic zi/noapte.",
  V14:    "Componenta PCA anonimizata, cea mai importanta pentru model (importanta 0.2065). Nu corespunde unei variabile cu nume real — datele au fost transformate prin PCA pentru confidentialitate. Valorile extreme (departe de 0) au fost cel mai puternic asociate cu frauda la antrenare.",
  V10:    "Componenta PCA anonimizata (a 2-a ca importanta, 0.1292). Fara semnificatie cu nume real. Cu cat se departeaza de 0, cu atat tranzactia e mai atipica pe aceasta dimensiune.",
  V12:    "Componenta PCA anonimizata (importanta 0.1148). Fara semnificatie cu nume real. Valoarea 0 = tipic; extremele semnaleaza un tipar neobisnuit.",
  V17:    "Componenta PCA anonimizata (importanta 0.1106). Fara semnificatie cu nume real. Extremele au fost asociate cu tranzactii neobisnuite.",
  V16:    "Componenta PCA anonimizata (importanta 0.0785). Fara semnificatie cu nume real. Valoarea 0 = tipic; departarea de 0 = mai atipic.",
  V:      "Componenta PCA anonimizata, fara semnificatie cu nume real (datele au fost transformate pentru confidentialitate). Valoarea 0 = tipic; cu cat se departeaza de 0 (in plus sau minus), cu atat tranzactia e mai neobisnuita pe aceasta dimensiune."
};

// definitia tuturor sliderilor (Amount/Time + 28 componente PCA, grupate)
const FEATURES = [];
FEATURES.push({name:"Amount", min:0, max:5000, step:1, dec:2, val:100, unit:" EUR", label:"Amount (EUR)", grp:"real"});
FEATURES.push({name:"Time", min:0, max:172792, step:1, dec:0, val:50000, unit:" s", label:"Time (secunde)", grp:"real"});
TOP.forEach(n => FEATURES.push({name:n, min:-5, max:5, step:0.01, dec:2, val:0, unit:"", label:TOP_LABEL[n], grp:"top", top:true}));
for(let i=1;i<=14;i++){ const n="V"+i; if(!TOP.includes(n)) FEATURES.push({name:n,min:-5,max:5,step:0.01,dec:2,val:0,unit:"",label:n,grp:"rest1"}); }
for(let i=15;i<=28;i++){ const n="V"+i; if(!TOP.includes(n)) FEATURES.push({name:n,min:-5,max:5,step:0.01,dec:2,val:0,unit:"",label:n,grp:"rest2"}); }

const CFG = {}; FEATURES.forEach(f => CFG[f.name]=f);

// ---------------------------------------------------------------- helperi puri
function fmt(name, v){ const f=CFG[name]; return Number(v).toFixed(f.dec)+f.unit; }
function escTip(s){ return String(s).replace(/"/g,'&quot;'); }
function isV(name){ return /^V\d+$/.test(name); }

// eticheta calitativa de "normalitate" pentru o componenta PCA standardizata
function normInfo(v){
  const a = Math.abs(v);
  let tag, cls;
  if(a < 1)       { tag="tipic";            cls="n0"; }
  else if(a < 2)  { tag="usor neobisnuit";  cls="n1"; }
  else if(a < 3.5){ tag="neobisnuit";       cls="n2"; }
  else            { tag="foarte atipic";    cls="n3"; }
  return { tag, cls, left: (v + 5) / 10 * 100 };   // marker pe banda [-5, 5]
}
