// ============================================================
// app.js — apeluri API (/predict, /generate, /samples) + orchestrare/init.
// ============================================================

// Exemplul real incarcat curent. Cand e setat, /predict foloseste valorile
// REALE complete (SAMPLE.features), nu citirea din slidere — care sunt limitate
// la [-5, 5] si ar falsifica predictia pe fraude reale (V14 real poate fi ~ -18).
let SAMPLE = null;

function setLoading(on){
  const btn=document.getElementById("btn-verify");
  btn.disabled=on;
  btn.classList.toggle("loading", on);
  btn.textContent = on ? "Se analizeaza..." : "Verifica tranzactie";
}

async function generate(type){
  try{
    const r=await fetch("/generate/"+type);
    if(!r.ok) throw new Error(await r.text());
    const j=await r.json();
    clearSample();                       // generarea sintetica iese din modul "exemplu real"
    Object.keys(j).forEach(k=> setVal(k, j[k]));
  }catch(e){ alert("Eroare la generare: "+e.message); }
}

// ---------------------------------------------------------------- exemple reale
let SAMPLES_META = [];

async function loadSamples(){
  try{
    const r=await fetch("/samples");
    if(!r.ok) throw new Error(await r.text());
    SAMPLES_META = await r.json();
    buildSampleList(SAMPLES_META);
    wireDropdown();
  }catch(e){
    // subsetul lipseste -> ascundem controlul, restul aplicatiei merge normal
    const box=document.querySelector(".sample-box");
    if(box) box.style.display="none";
    console.warn("Exemple reale indisponibile:", e.message);
  }
}

// Lista NU dezvaluie eticheta (frauda/legitim) — doar index + suma. "Test orb".
function buildSampleList(list){
  const wrap=document.getElementById("dd-list");
  wrap.innerHTML = list.map(s=>`
    <button type="button" class="dd-item" role="option" data-index="${s.index}">
      <span class="dd-id">#${s.index}</span>
      <span class="dd-amt">${s.amount.toFixed(2)} <span class="dd-cur">EUR</span></span>
    </button>`).join("") +
    `<div class="dd-empty" id="dd-empty" hidden>Niciun rezultat</div>`;
}

function wireDropdown(){
  const dd=document.getElementById("sample-dd");
  const trigger=document.getElementById("dd-trigger");
  const panel=document.getElementById("dd-panel");
  const search=document.getElementById("dd-search");
  const list=document.getElementById("dd-list");

  function open(){ panel.hidden=false; trigger.setAttribute("aria-expanded","true"); dd.classList.add("open"); search.value=""; filter(""); search.focus(); }
  function close(){ panel.hidden=true; trigger.setAttribute("aria-expanded","false"); dd.classList.remove("open"); }

  trigger.addEventListener("click", e=>{ e.stopPropagation(); panel.hidden ? open() : close(); });
  search.addEventListener("input", ()=> filter(search.value));
  list.addEventListener("click", e=>{
    const it=e.target.closest(".dd-item"); if(!it) return;
    selectItem(it.dataset.index);
    close();
  });
  document.addEventListener("click", e=>{ if(!dd.contains(e.target)) close(); });
  document.addEventListener("keydown", e=>{ if(e.key==="Escape") close(); });

  function filter(q){
    q=q.trim().toLowerCase();
    let shown=0;
    list.querySelectorAll(".dd-item").forEach(it=>{
      const s=SAMPLES_META.find(m=> String(m.index)===it.dataset.index);
      const hay=`#${s.index} ${s.amount.toFixed(2)}`.toLowerCase();
      const ok=hay.includes(q); it.style.display=ok?"":"none"; if(ok) shown++;
    });
    document.getElementById("dd-empty").hidden = shown>0;
  }
}

function selectItem(idx){
  const s=SAMPLES_META.find(m=> String(m.index)===String(idx));
  if(!s) return;
  document.getElementById("dd-trigger-text").textContent=`#${s.index} · ${s.amount.toFixed(2)} EUR`;
  document.querySelectorAll(".dd-item").forEach(it=> it.classList.toggle("sel", it.dataset.index===String(idx)));
  pickSample(idx);
}

async function pickSample(index){
  try{
    const r=await fetch("/samples/"+index);
    if(!r.ok) throw new Error(await r.text());
    const j=await r.json();
    SAMPLE={features:j.features, true_label:j.true_label, index:j.index, orig_index:j.orig_index};
    // populam sliderii pentru afisare (pot fi limitati la extreme — vizual doar)
    Object.keys(j.features).forEach(k=> setVal(k, j.features[k]));
  }catch(e){ alert("Eroare la incarcarea exemplului: "+e.message); }
}

// iesire din modul "exemplu real" (ajustare manuala / generare sintetica)
function clearSample(){
  SAMPLE=null;
  const tt=document.getElementById("dd-trigger-text");
  if(tt) tt.textContent="Alege o tranzactie reala";
  document.querySelectorAll(".dd-item").forEach(it=> it.classList.remove("sel"));
}

// ---------------------------------------------------------------- predictie
async function verify(){
  setLoading(true);
  // exemplu real -> valori brute complete; altfel -> citire din slidere
  let payload;
  if(SAMPLE){ payload={...SAMPLE.features}; }
  else { payload={}; FEATURES.forEach(f=> payload[f.name]=getVal(f.name)); }
  try{
    const r=await fetch("/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!r.ok) throw new Error(await r.text());
    const j=await r.json();
    LAST={resp:j, payload, trueLabel: SAMPLE ? SAMPLE.true_label : null};
    document.getElementById("result-empty").hidden=true;
    document.getElementById("result").hidden=false;
    applyAll();
    pushHistory(j, payload);
  }catch(e){ alert("Eroare la predictie: "+e.message); }
  finally{ setLoading(false); }
}

// ---------------------------------------------------------------- event wiring
function wireControls(){
  document.getElementById('btn-gen-legit').addEventListener('click', () => generate('legitimate'));
  document.getElementById('btn-gen-fraud').addEventListener('click', () => generate('fraud'));
  document.getElementById('btn-verify').addEventListener('click', verify);
  // dropdown-ul de exemple reale e cablat in wireDropdown() (dupa /samples)
  // orice ajustare manuala a unui slider de feature iese din modul "exemplu real"
  document.querySelector('.sidebar').addEventListener('input', e => {
    if(e.target.matches('input[type=range]') && e.target.id.startsWith('sl-')) clearSample();
  });
  document.querySelectorAll('.grp-toggle[data-target]').forEach(el =>
    el.addEventListener('click', () => toggle(el.dataset.target))
  );
}

// ---------------------------------------------------------------- init
window.addEventListener('DOMContentLoaded', () => {
  buildSliders();
  buildGuide();
  setupTooltip();
  wireControls();
  loadSamples();
});
