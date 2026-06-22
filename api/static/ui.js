// ============================================================
// ui.js — construirea sliderilor, ghidul si tooltip-ul global.
// ============================================================

// ---------------------------------------------------------------- banda normalitate
function updateNorm(name){
  if(!isV(name)) return;
  const marker = document.getElementById("nm-"+name);
  const tagEl  = document.getElementById("nt-"+name);
  if(!marker || !tagEl) return;
  const n = normInfo(getVal(name));
  marker.style.left = n.left + "%";
  tagEl.textContent = n.tag;
  tagEl.className = "norm-tag " + n.cls;
}

// ---------------------------------------------------------------- construire slidere
function buildSliders(){
  const groups={real:"grp-real", top:"grp-top", rest1:"grp-rest1", rest2:"grp-rest2"};
  FEATURES.forEach(f=>{
    const help = HELP[f.name] || HELP.V;
    const div=document.createElement("div");
    div.className="slider"+(f.top?" top":"");
    // iconita "?" doar unde textul e specific (Amount/Time si top-5).
    // Componentele PCA generice au o singura iconita pe titlul categoriei.
    const hasIcon = f.grp === "real" || f.grp === "top";
    const icon = hasIcon ? `<span class="info-icon" data-tip="${escTip(help)}">?</span>` : "";
    const normHtml = isV(f.name) ? `
      <div class="norm">
        <div class="norm-track"><span class="norm-marker" id="nm-${f.name}"></span></div>
        <span class="norm-tag n0" id="nt-${f.name}">tipic</span>
      </div>` : "";
    div.innerHTML=`
      <div class="lab">
        <span class="name${f.top?' top':''}">${f.label}${icon}</span>
        <span class="val" id="val-${f.name}">${fmt(f.name,f.val)}</span>
      </div>
      <input type="range" id="sl-${f.name}" min="${f.min}" max="${f.max}" step="${f.step}" value="${f.val}">
      ${normHtml}`;
    document.getElementById(groups[f.grp]).appendChild(div);
    const sl=div.querySelector("input");
    sl.addEventListener("input", ()=>{
      document.getElementById("val-"+f.name).textContent=fmt(f.name,sl.value);
      updateNorm(f.name);
    });
    updateNorm(f.name);
  });
}

function setVal(name,v){
  const f=CFG[name]; if(!f) return;
  v=Math.min(f.max, Math.max(f.min, Number(v)));
  document.getElementById("sl-"+name).value=v;
  document.getElementById("val-"+name).textContent=fmt(name, v);
  updateNorm(name);
}
function getVal(name){ return parseFloat(document.getElementById("sl-"+name).value); }

function toggle(id){
  document.getElementById("grp-"+id).classList.toggle("open");
  document.getElementById("t-"+id).classList.toggle("open");
}

function buildGuide(){
  const dl=document.getElementById("guide");
  const entries=[
    ["Amount", HELP.Amount],["Time", HELP.Time],
    ["V1 - V28 (componente PCA)", HELP.V]
  ];
  dl.innerHTML=entries.map(([t,d])=>`<dt>${t}</dt><dd>${d}</dd>`).join("");
}

// ---------------------------------------------------------------- tooltip global
function setupTooltip(){
  const tip = document.getElementById('tip');
  function show(el){
    tip.textContent = el.dataset.tip;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    const pad = 8;
    let left = r.left + r.width/2 - tw/2;
    let top  = r.top - th - 10;
    if (top < pad) top = r.bottom + 10;
    left = Math.max(pad, Math.min(left, window.innerWidth - tw - pad));
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }
  function hide(){ tip.hidden = true; }
  document.body.addEventListener('mouseover', e => {
    const el = e.target.closest('.info-icon');
    if (el) show(el);
  });
  document.body.addEventListener('mouseout', e => {
    if (e.target.closest('.info-icon')) hide();
  });
  document.querySelectorAll('.sidebar').forEach(el => el.addEventListener('scroll', hide, {passive:true}));
  window.addEventListener('scroll', hide, {passive:true});
}
