// ============================================================
// app.js — apeluri API (/predict, /generate) + orchestrare/init.
// ============================================================

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
    Object.keys(j).forEach(k=> setVal(k, j[k]));
  }catch(e){ alert("Eroare la generare: "+e.message); }
}

async function verify(){
  setLoading(true);
  const payload={}; FEATURES.forEach(f=> payload[f.name]=getVal(f.name));
  try{
    const r=await fetch("/predict",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    if(!r.ok) throw new Error(await r.text());
    const j=await r.json();
    LAST={resp:j, payload};
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
  document.getElementById('thr-slider').addEventListener('input', applyAll);
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
});
