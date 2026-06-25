# Detectia fraudelor in tranzactii financiare folosind inteligenta artificiala

Lucrare de licenta — Universitatea „Lucian Blaga" din Sibiu, Facultatea de Stiinte,
Specializarea Informatica, 2026.

Detectarea tranzactiilor frauduloase cu modele de machine learning, pe un set de
date puternic dezechilibrat.

**Dataset:** ULB Credit Card Fraud Detection — 284.807 tranzactii, dintre care
492 fraude (0.17%).

---

## Structura

```
.
├── notebooks/
│   ├── 01_eda.ipynb              # Analiza exploratorie a datelor (EDA)
│   ├── 02_preprocessing.ipynb    # SMOTE, ADASYN, Random Undersampling
│   ├── 03_models.ipynb           # RF, XGBoost, LightGBM + evaluare
│   └── 04_explainability.ipynb   # Interpretabilitate (SHAP, importanta features)
├── api/                          # Aplicatia (Capitolul 7) — FastAPI + SPA
│   ├── main.py                   # Montare FastAPI + rute REST
│   ├── schemas.py                # Modele Pydantic + constante
│   ├── preprocessor.py           # Scalare Time/Amount, statistici dataset
│   ├── model.py                  # 3 modele (RF/XGBoost/LightGBM) + SHAP local
│   ├── generator.py              # Generare tranzactii sintetice per-clasa
│   ├── sampler.py                # Esantionare tranzactii reale din setul de test
│   └── static/                   # Frontend SPA (index.html, style.css, config/ui/render/app.js)
├── figures/                      # Figuri generate de notebooks (PNG, 300 dpi)
├── data/                         # demo_sample.csv (inclus); creditcard.csv — adauga manual
└── models/                       # Nu e pe Git — generate de notebooks
```

---

## Setup

Python via Anaconda (base environment).

Instaleaza dependintele:
```bash
pip install pandas numpy matplotlib seaborn scikit-learn xgboost lightgbm imbalanced-learn shap joblib
```

Descarca datasetul de pe Kaggle:
[kaggle.com/datasets/mlg-ulb/creditcardfraud](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)

Pune `creditcard.csv` in folderul `data/`.

---

## Rularea notebook-urilor

```bash
jupyter notebook
```

Ordinea recomandata:
`01_eda` → `02_preprocessing` → `03_models` → `04_explainability`

Pasul `03_models` antreneaza si salveaza modelele in `models/` (necesare pentru aplicatie).

---

## Aplicatia interactiva (FastAPI + SPA)

Aplicatia din Capitolul 7: backend REST (FastAPI) + frontend SPA static.
Ruleaza in paralel cele trei modele antrenate (`models/rf_smote.joblib`,
`xgb_smote.joblib`, `lgbm_smote.joblib`), cu RandomForest ca model principal,
si are nevoie de dataset (`data/creditcard.csv`) — ! ruleaza mai intai `03_models.ipynb`.

Instaleaza dependintele:
```bash
pip install fastapi uvicorn shap xgboost lightgbm
```

Porneste aplicatia din radacina proiectului:
```bash
uvicorn api.main:app --reload
```

Se deschide la `http://localhost:8000`:
- `/` — frontend SPA: introdu parametrii tranzactiei, genereaza automat exemple
  legitime / frauda sau alege o tranzactie reala din setul de test, apoi **Verifica
  tranzactie**. Rezultatul arata cele 3 modele in paralel, contributiile SHAP locale
  si, pentru exemplele reale, comparatia predictiei cu eticheta adevarata.
- `/docs` — Swagger UI cu endpoint-urile REST.

Endpoint-uri principale:
- `POST /predict` — predictie (eticheta, probabilitate, cele 3 modele, contributii SHAP locale, mesaj).
- `GET /generate/{class_type}` — genereaza o tranzactie sintetica (`legitimate` / `fraud`).
- `GET /samples` — lista de tranzactii reale din setul de test (held-out), cu eticheta adevarata.
- `GET /samples/{index}` — o tranzactie reala din setul de test (din `data/demo_sample.csv`).
- `GET /health` — status model.

---

## Modele antrenate

- Random Forest (SMOTE) — model principal (predictie + SHAP local)
- XGBoost (SMOTE) — rulat in paralel pentru comparatie
- LightGBM (SMOTE) — rulat in paralel pentru comparatie

Metrica principala: **AUC-PR** (aria sub curba Precision-Recall) — relevanta pe
seturi de date dezechilibrate.

---

## De stiut

- `data/creditcard.csv` si folderul `models/` **nu sunt versionate pe Git** (vezi
  `.gitignore`); subsetul `data/demo_sample.csv` (folosit de `/samples`) este inclus.
  Dupa clonarea repo-ului:
  1. Adauga manual `data/creditcard.csv` (descarcat de pe
     [Kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)).
  2. Ruleaza `notebooks/03_models.ipynb` pentru a regenera modelele in `models/`.
- Fara acesti doi pasi, aplicatia FastAPI nu porneste (ii lipsesc modelele din
  `models/` si `creditcard.csv`).

---

## Autor

Axente Andrei-Eugen
Coordonator stiintific: Conf. univ. dr. Stoica Florin
