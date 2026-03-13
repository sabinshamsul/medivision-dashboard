from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import pickle
import numpy as np

app = FastAPI(title="MediVision AI Triage Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and feature ordering at startup
with open("ai_triage_model_XGBOOST.pkl", "rb") as f:
    model = pickle.load(f)

with open("model_features.pkl", "rb") as f:
    feature_names = pickle.load(f)


class PredictRequest(BaseModel):
    age: int = Field(..., ge=0, le=150)
    gender: int = Field(..., ge=0, le=1)
    systolic_bp: float = Field(..., ge=0, le=300)
    heart_rate: float = Field(..., ge=0, le=300)
    resp_rate: float = Field(..., ge=0, le=100)
    spo2: float = Field(..., ge=0, le=100)
    pain_score: float = Field(..., ge=0, le=10)
    mental_status: int = Field(..., ge=0, le=3)


class PredictResponse(BaseModel):
    category: int
    red_risk: float
    yellow_risk: float
    green_risk: float


@app.get("/health")
def health():
    return {"status": "ok", "model_features": feature_names}


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    try:
        # Build feature array in the order specified by model_features.pkl
        feature_values = []
        req_dict = req.model_dump()
        for feat in feature_names:
            feature_values.append(req_dict[feat])

        features = np.array([feature_values])

        category = int(model.predict(features)[0])
        probabilities = model.predict_proba(features)[0]

        # Map model classes to risk percentages
        classes = list(model.classes_)
        red_risk = float(probabilities[classes.index(1)]) * 100 if 1 in classes else 0.0
        yellow_risk = float(probabilities[classes.index(2)]) * 100 if 2 in classes else 0.0
        green_risk = float(probabilities[classes.index(3)]) * 100 if 3 in classes else 0.0

        return PredictResponse(
            category=category,
            red_risk=round(red_risk, 1),
            yellow_risk=round(yellow_risk, 1),
            green_risk=round(green_risk, 1),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
