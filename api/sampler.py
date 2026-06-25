# Esantionare de tranzactii REALE dintr-un subset curat al datasetului.
#
# Spre deosebire de TransactionGenerator (care produce date sintetice dintr-o
# distributie normala), aceasta clasa intoarce randuri reale din
# data/demo_sample.csv, impreuna cu eticheta adevarata (Class). Permite sa
# verifici daca modelul nimereste fraude/legitime reale, nu doar inventate.
#
# IMPORTANT: valorile sunt intoarse BRUTE si COMPLETE (V14 real poate fi ~ -18),
# fara clamp. Frontend-ul foloseste exact aceste valori la /predict, nu citirea
# din slidere (care sunt limitate la [-5, 5] doar pentru afisare).

from pathlib import Path

import pandas as pd

from .schemas import FEATURE_NAMES


class DatasetSampler:
    """Serveste randuri reale dintr-un subset echilibrat al datasetului."""

    def __init__(self, csv_path: Path):
        self.df = pd.read_csv(csv_path)
        self._has_orig = "orig_index" in self.df.columns

    @staticmethod
    def _label(class_val: int) -> str:
        return "FRAUDA" if int(class_val) == 1 else "LEGITIMA"

    def list_meta(self) -> list[dict]:
        """Listare usoara pentru dropdown: index, eticheta reala, suma."""
        out = []
        for i, row in self.df.iterrows():
            out.append({
                "index": int(i),
                "true_label": self._label(row["Class"]),
                "amount": round(float(row["Amount"]), 2),
                "orig_index": int(row["orig_index"]) if self._has_orig else int(i),
            })
        return out

    def get(self, index: int) -> dict:
        """Returneaza features (30, brute) + eticheta reala pentru un index.

        Ridica ValueError pentru index invalid (main.py il converteste in 400).
        """
        if index < 0 or index >= len(self.df):
            raise ValueError(f"index {index} in afara intervalului [0, {len(self.df) - 1}].")
        row = self.df.iloc[index]
        features = {name: float(row[name]) for name in FEATURE_NAMES}
        return {
            "index": int(index),
            "true_label": self._label(row["Class"]),
            "orig_index": int(row["orig_index"]) if self._has_orig else int(index),
            "features": features,
        }
