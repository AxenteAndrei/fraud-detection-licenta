// ============================================================
// render.js — randarea rezultatului (badge, bara, modele, SHAP, istoric).
// Re-randeaza din LAST + pragul curent, fara reapel API.
// ============================================================

let LAST = null;
let HISTORY = [];

function getThreshold(){ return parseFloat(document.getElementById("thr-slider").value); }

function applyAll(){
  if(!LAST) return;
  const t = getThreshold();
  document.getElementById("thr-val").textContent = t.toFixed(2);
  const r = LAST.resp;
  const p = r.probability;                 // P(frauda) — model principal RF
  const fraud = p >= t;

  renderBadge(fraud, p);
  renderBar(p, t);
  renderModels(r.models, t);

  const topNames = r.shap.slice(0,3).map(c=>c.feature).join(", ");
  document.getElementById("msg-wrap").innerHTML = `<div class="msg">${composeMsg(fraud, topNames, t)}</div>`;
  renderShap(r.shap);
}

// ---------------------------------------------------------------- mesaj (threshold-aware)
function composeMsg(fraud, topNames, t){
  const prag = t.toFixed(2);
  if(fraud){
    return `Modelul considera ca aceasta tranzactie prezinta caracteristici asociate fraudei. `+
           `Cele mai influente variabile in decizie au fost: ${topNames}. Un scor peste pragul de ${prag} `+
           `ar declansa o verificare manuala sau blocarea tranzactiei.`;
  }
  return `Modelul estimeaza ca tranzactia este legitima. Cele mai relevante variabile analizate au fost: `+
         `${topNames}. Scorul ramane sub pragul de ${prag}, deci nu se recomanda blocarea.`;
}

// ---------------------------------------------------------------- componente rezultat
function renderBadge(fraud, p){
  const pc=(p*100).toFixed(2);
  const conf=((fraud?p:1-p)*100).toFixed(2);
  document.getElementById("badge-wrap").innerHTML = fraud
    ? `<span class="badge fraud">FRAUDA &middot; ${pc}%</span>`
    : `<span class="badge legit">LEGITIMA &middot; ${conf}% siguranta</span>`;
}

function renderBar(p, t){
  const pct = (p*100).toFixed(1);
  const tpct = (t*100).toFixed(0);
  const fraud = p >= t;
  document.getElementById("prob-wrap").innerHTML=`
    <div class="prob">
      <div class="prob-head"><span>Probabilitate de frauda</span><span class="prob-pct">${pct}%</span></div>
      <div class="prob-bar">
        <div class="prob-fill ${fraud?'fraud':'legit'}" style="width:${pct}%"></div>
        <div class="prob-thr" style="left:${tpct}%" title="prag ${t.toFixed(2)}"></div>
      </div>
      <div class="prob-foot"><span>0%</span><span class="prob-thr-lab" style="left:${tpct}%">prag ${t.toFixed(2)}</span><span>100%</span></div>
    </div>`;
}

function renderModels(models, t){
  const cards = models.map(m=>{
    const fraud = m.probability >= t;
    const pct=(m.probability*100).toFixed(1);
    const star = m.name==="RandomForest" ? `<span class="m-star" title="model principal">&#9733;</span>` : "";
    return `<div class="model-card ${fraud?'fraud':'legit'}">
        <div class="m-name">${m.name}${star}</div>
        <div class="m-prob">${pct}%</div>
        <div class="m-pill ${fraud?'fraud':'legit'}">${fraud?'FRAUDA':'LEGITIMA'}</div>
      </div>`;
  }).join("");
  document.getElementById("models-wrap").innerHTML =
    `<div class="res-sub-title">Comparatie modele &mdash; P(frauda)</div><div class="models">${cards}</div>`;
}

function renderShap(contribs){
  const maxAbs = Math.max(...contribs.map(c=>Math.abs(c.shap)), 1e-6);
  const rows = contribs.map(c=>{
    const w = Math.abs(c.shap)/maxAbs*48;                 // pana la ~48% din track
    const pos = c.shap > 0;
    const bar = pos
      ? `<div class="sh-bar pos" style="left:50%;width:${w.toFixed(1)}%"></div>`
      : `<div class="sh-bar neg" style="left:${(50-w).toFixed(1)}%;width:${w.toFixed(1)}%"></div>`;
    return `<div class="sh-row">
        <div class="sh-feat">${c.feature}<span class="sh-val">val ${c.value}</span></div>
        <div class="sh-track"><div class="sh-axis"></div>${bar}</div>
        <div class="sh-num ${pos?'pos':'neg'}">${pos?'+':''}${c.shap}</div>
      </div>`;
  }).join("");
  document.getElementById("shap-wrap").innerHTML=`
    <div class="res-sub-title">De ce aceasta decizie? <span class="sub-note">(contributii SHAP locale)</span></div>
    <div class="sh-legend"><span class="leg legit">&larr; spre legitim</span><span class="leg fraud">spre frauda &rarr;</span></div>
    <div class="shap">${rows}</div>
    <p class="sh-hint">Calculat pe modelul principal RandomForest. Bara spre dreapta (rosu) impinge decizia spre frauda, spre stanga (verde) spre legitim. Lungimea = cat de mult conteaza acea variabila pentru ACEASTA tranzactie.</p>`;
}

// ---------------------------------------------------------------- istoric (in memorie)
function pushHistory(j, payload){
  const t=getThreshold();
  const p=j.probability*100;
  const label = j.probability>=t ? "FRAUDA" : "LEGITIMA";
  HISTORY.unshift({amount:payload.Amount, time:payload.Time, p, label});
  HISTORY=HISTORY.slice(0,5);
  const rows=HISTORY.map(h=>`
    <tr><td class="num">${Number(h.amount).toFixed(2)}</td>
        <td class="num">${Number(h.time).toFixed(0)}</td>
        <td class="num">${h.p.toFixed(2)}%</td>
        <td><span class="pill ${h.label==='FRAUDA'?'fraud':'legit'}">${h.label}</span></td></tr>`).join("");
  document.getElementById("history").innerHTML=`
    <table>
      <thead><tr><th class="num">Amount</th><th class="num">Time</th><th class="num">P(frauda)</th><th>Decizie</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>`;
}
