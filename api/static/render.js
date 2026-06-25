// ============================================================
// render.js — randarea rezultatului (badge, bara, modele, SHAP, istoric).
// Re-randeaza din LAST, fara reapel API. Decizia foloseste pragul fix returnat
// de model (DEFAULT_THRESHOLD = 0.50).
// ============================================================

let LAST = null;
let HISTORY = [];

function applyAll(){
  if(!LAST) return;
  const r = LAST.resp;
  const t = r.threshold;                    // prag fix de decizie (0.50)
  const p = r.probability;                  // P(frauda) — model principal RF
  const fraud = p >= t;

  renderBadge(fraud, p);
  renderBar(p, t);
  renderModels(r.models, t);
  renderTruth(LAST.trueLabel, fraud);

  const topNames = r.shap.slice(0,3).map(c=>c.feature).join(", ");
  document.getElementById("msg-wrap").innerHTML = `<div class="msg">${composeMsg(fraud, topNames)}</div>`;
  renderShap(r.shap);
}

// ---------------------------------------------------------------- mesaj explicativ
function composeMsg(fraud, topNames){
  if(fraud){
    return `Modelul considera ca aceasta tranzactie prezinta caracteristici asociate fraudei. `+
           `Cele mai influente variabile in decizie au fost: ${topNames}. Scorul depaseste limita `+
           `de decizie, ceea ce ar declansa o verificare manuala sau blocarea tranzactiei.`;
  }
  return `Modelul estimeaza ca tranzactia este legitima. Cele mai relevante variabile analizate au fost: `+
         `${topNames}. Scorul ramane sub limita de decizie, deci nu se recomanda blocarea.`;
}

// ---------------------------------------------------------------- componente rezultat
function renderBadge(fraud, p){
  const pc=(p*100).toFixed(2);
  const conf=((fraud?p:1-p)*100).toFixed(2);
  document.getElementById("badge-wrap").innerHTML = fraud
    ? `<span class="badge fraud">FRAUDA &middot; ${pc}%</span>`
    : `<span class="badge legit">LEGITIMA &middot; ${conf}% siguranta</span>`;
}

// Componenta dedicata exemplelor reale din dataset: dupa predictie, dezvaluie
// eticheta reala (din setul de test) si o compara cu verdictul modelului.
// Nu apare la date manuale/sintetice.
function renderTruth(trueLabel, fraud){
  const el=document.getElementById("truth-wrap");
  if(!trueLabel){ el.innerHTML=""; el.hidden=true; return; }
  el.hidden=false;
  const pred = fraud ? "FRAUDA" : "LEGITIMA";
  const ok = pred === trueLabel;
  el.innerHTML=`<div class="truth ${ok?'ok':'bad'}">
      <span class="truth-mark">${ok?'&#10003;':'&#10007;'}</span>
      <span>Eticheta reala: <b>${trueLabel}</b> &middot; model: <b>${pred}</b> &mdash;
        ${ok?'model corect':'model gresit'}</span>
    </div>`;
}

function renderBar(p, t){
  const pct = (p*100).toFixed(1);
  const fraud = p >= t;
  document.getElementById("prob-wrap").innerHTML=`
    <div class="prob">
      <div class="prob-head"><span>Probabilitate de frauda</span><span class="prob-pct">${pct}%</span></div>
      <div class="prob-bar">
        <div class="prob-fill ${fraud?'fraud':'legit'}" style="width:${pct}%"></div>
      </div>
      <div class="prob-foot"><span>0%</span><span>100%</span></div>
    </div>`;
}

function renderModels(models, t){
  const cards = models.map(m=>{
    const fraud = m.probability >= t;
    // Afisam siguranta deciziei (increderea in verdictul propriu), nu P(frauda) bruta:
    // pentru o tranzactie legitima => 100 - P(frauda), evitand confuzia (ex. 98% LEGITIMA).
    const conf=((fraud ? m.probability : 1-m.probability)*100).toFixed(1);
    const star = m.name==="RandomForest" ? `<span class="m-star" title="model principal">&#9733;</span>` : "";
    return `<div class="model-card ${fraud?'fraud':'legit'}">
        <div class="m-name">${m.name}${star}</div>
        <div class="m-prob">${conf}%</div>
        <div class="m-pill ${fraud?'fraud':'legit'}">${fraud?'FRAUDA':'LEGITIMA'}</div>
      </div>`;
  }).join("");
  document.getElementById("models-wrap").innerHTML =
    `<div class="res-sub-title">Comparatie modele &mdash; siguranta deciziei</div><div class="models">${cards}</div>`;
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
  const t=j.threshold;                       // prag fix de decizie (0.50)
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
