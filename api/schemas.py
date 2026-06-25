# Pydantic models + constante partajate.

from pydantic import BaseModel, ConfigDict, create_model

# ordinea EXACTA in care modelele asteapta features la antrenare
FEATURE_NAMES = ["Time"] + [f"V{i}" for i in range(1, 29)] + ["Amount"]

TOP_FEATURES = ["V14", "V10", "V12", "V17", "V16"]
AUC_PR = 0.8842
DEFAULT_THRESHOLD = 0.5

# 30 de campuri float cu default 0.0, construite dinamic
TransactionInput = create_model(
    "TransactionInput",
    **{name: (float, 0.0) for name in FEATURE_NAMES},
)


class ModelScore(BaseModel):
    name: str
    probability: float


class ShapContribution(BaseModel):
    # shap are SEMN: pozitiv impinge spre FRAUDA, negativ spre LEGITIMA
    feature: str
    value: float
    shap: float


class PredictResponse(BaseModel):
    label: str
    probability: float                          # P(frauda) — modelul principal RF
    threshold: float
    message: str
    models: list[ModelScore]
    shap_base: float
    shap: list[ShapContribution]


class HealthResponse(BaseModel):
    model_config = ConfigDict(protected_namespaces=())   # permite campul "model"
    status: str
    model: str
    auc_pr: float


class SampleMeta(BaseModel):
    # element de listare pentru dropdown-ul cu exemple reale
    index: int
    true_label: str          # "FRAUDA" / "LEGITIMA" — eticheta adevarata (Class)
    amount: float
    orig_index: int          # rândul corespunzator din creditcard.csv


class SampleResponse(BaseModel):
    index: int
    true_label: str
    orig_index: int
    features: TransactionInput   # 30 valori BRUTE, complete (fara clamp)
