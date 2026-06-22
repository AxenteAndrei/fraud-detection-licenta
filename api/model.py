# -*- coding: utf-8 -*-
# Wrapper peste cele 3 modele sklearn (RF principal + XGBoost + LightGBM) si SHAP.

from pathlib import Path

import joblib
import numpy as np
import shap

from .schemas import ModelScore, ShapContribution


def _positive_class(shap_values, base_value):
    """Normalizeaza iesirea SHAP la clasa 1 ("frauda"), indiferent de versiunea shap
    (lista pe clase / ndarray 3D / ndarray 2D). Returneaza (contributii_1d, base_scalar)."""
    sv = shap_values
    if isinstance(sv, list):
        sv = sv[1] if len(sv) > 1 else sv[0]
    sv = np.asarray(sv)
    if sv.ndim == 3:                 # (n, features, classes)
        sv = sv[..., -1]
    sv = sv.reshape(-1)

    base = base_value
    if isinstance(base, (list, tuple, np.ndarray)):
        base = np.asarray(base).reshape(-1)
        base = float(base[-1] if base.size > 1 else base[0])
    else:
        base = float(base)
    return sv, base


class FraudDetector:
    """Modelul principal RF + XGBoost/LightGBM pentru comparatie + SHAP local."""

    THRESHOLD = 0.5

    def __init__(self, rf_path: Path, xgb_path: Path, lgbm_path: Path):
        self.rf = joblib.load(rf_path)
        # ordinea conteaza: RF ramane primul (modelul principal)
        self.models = {
            "RandomForest": self.rf,
            "XGBoost": joblib.load(xgb_path),
            "LightGBM": joblib.load(lgbm_path),
        }
        # explainer construit O SINGURA data, pe modelul principal RF
        self.explainer = shap.TreeExplainer(self.rf)

    # ---------------------------------------------------------------- predictie principala
    def predict_proba(self, x_scaled: np.ndarray) -> float:
        """Probabilitatea de frauda (clasa 1) data de RF pentru un vector de 30 features."""
        return float(self.rf.predict_proba(x_scaled.reshape(1, -1))[0, 1])

    def is_fraud(self, proba: float, threshold: float = THRESHOLD) -> bool:
        return proba >= threshold

    # ---------------------------------------------------------------- comparatie modele
    def model_scores(self, x_scaled: np.ndarray) -> list[ModelScore]:
        """P(frauda) pentru fiecare din cele 3 modele, in aceeasi ordine."""
        X = x_scaled.reshape(1, -1)
        return [
            ModelScore(name=name, probability=round(float(m.predict_proba(X)[0, 1]), 4))
            for name, m in self.models.items()
        ]

    # ---------------------------------------------------------------- explicabilitate SHAP
    def shap_contributions(
        self,
        x_scaled: np.ndarray,
        raw: dict,
        feature_names: list[str],
        k: int = 8,
    ) -> tuple[float, list[ShapContribution]]:
        """Contributii SHAP locale (RF), top-k dupa magnitudine.
        Aditivitate: base + suma(toate contributiile) ~ P(frauda)."""
        sv, base = _positive_class(
            self.explainer.shap_values(x_scaled.reshape(1, -1)),
            self.explainer.expected_value,
        )
        order = np.argsort(np.abs(sv))[::-1][:k]
        contribs = [
            ShapContribution(
                feature=feature_names[i],
                value=round(float(raw[feature_names[i]]), 3),
                shap=round(float(sv[i]), 4),
            )
            for i in order
        ]
        return round(base, 4), contribs

    # ---------------------------------------------------------------- mesaj UI
    @staticmethod
    def compose_message(este_frauda: bool, top_names: str, threshold: float = THRESHOLD) -> str:
        prag = f"{threshold:.2f}"
        if este_frauda:
            return (
                f"Modelul considera ca aceasta tranzactie prezinta caracteristici "
                f"asociate fraudei. Cele mai influente variabile in decizie au fost: "
                f"{top_names}. Un scor peste pragul de {prag} ar declansa o verificare "
                f"manuala sau blocarea tranzactiei."
            )
        return (
            f"Modelul estimeaza ca tranzactia este legitima. Cele mai relevante "
            f"variabile analizate au fost: {top_names}. Scorul ramane sub pragul de "
            f"{prag}, deci nu se recomanda blocarea."
        )
