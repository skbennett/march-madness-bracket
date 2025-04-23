from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import xgboost as xgb
import pandas as pd
import numpy as np
from fastapi.middleware.cors import CORSMiddleware


MODEL_FEATURES = [
    'OPP BADJ EM', 'BADJ EM', 'OPP TR RATING', 'TR RATING', 'H BADJ EM',
    'OPP H BADJ EM', 'KADJ EM', 'OPP KADJ EM', 'OPP H TR RATING', 'H TR RATING',
    'BARTHAG', 'OPP BARTHAG', 'OPP BARTHAG RANK', 'BARTHAG RANK', 'BADJ EM RANK',
    'OPP BADJ EM RANK', 'OPP WAB', 'WAB', 'TR RANK', 'OPP TR RANK', 'LAST',
    'OPP LAST', 'OPP B POWER', 'B POWER', 'KADJ EM RANK', 'OPP KADJ EM RANK',
    'AN BARTHAG', 'OPP AN BARTHAG', 'OPP AN BADJ EM', 'AN BADJ EM',
    'H BARTHAG RANK', 'OPP H BARTHAG RANK', 'OPP H BARTHAG', 'H BARTHAG',
    'OPP SOS RANK', 'SOS RANK', 'SOS LAST', 'OPP SOS LAST', 'OPP H TR RANK',
    'H TR RANK', 'H LAST', 'OPP H LAST', 'OPP HI', 'HI', 'OPP H BADJ EM RANK',
    'H BADJ EM RANK', 'SOS RATING', 'OPP SOS RATING', 'OPP AN BARTHAG RANK',
    'AN BARTHAG RANK', 'OPP AN BADJ EM RANK', 'AN BADJ EM RANK',
    'OPP A BARTHAG', 'A BARTHAG', 'OPP RESUME', 'RESUME', 'OPP LO', 'LO',
    'OPP A BADJ EM', 'A BADJ EM', 'A TR RATING', 'OPP A TR RATING',
    'OPP WAB RANK', 'WAB RANK', 'OPP A TR RANK', 'A TR RANK', 'A LAST',
    'OPP A LAST', 'OPP A BADJ EM RANK', 'A BADJ EM RANK', 'A BARTHAG RANK',
    'OPP A BARTHAG RANK', 'OPP R SCORE', 'R SCORE', 'AN ELITE SOS RANK',
    'OPP AN ELITE SOS RANK', 'OPP ELITE SOS RANK', 'ELITE SOS RANK',
    'AN WAB', 'OPP AN WAB', 'NET RPI', 'OPP NET RPI', 'A WAB', 'OPP A WAB',
    'OPP H ELITE SOS RANK', 'H ELITE SOS RANK', 'H WAB', 'OPP H WAB',
    'ELO', 'OPP ELO', 'AN ELITE SOS', 'OPP AN ELITE SOS', 'TALENT',
    'OPP TALENT', 'OPP AN TR RATING', 'AN TR RATING', 'Q1 PLUS Q2 W',
    'OPP Q1 PLUS Q2 W', 'ELITE SOS', 'OPP ELITE SOS', 'Q3 Q4 L',
    'OPP Q3 Q4 L', 'OPP AN LAST', 'AN LAST', 'A ELITE SOS RANK',
    'OPP A ELITE SOS RANK', 'OPP AN TR RANK', 'AN TR RANK',
    'OPP BADJ D RANK', 'BADJ D RANK', 'OPP BADJ O', 'BADJ O',
    'TALENT RANK', 'OPP TALENT RANK', 'BADJ D', 'OPP BADJ D', 'H BADJ D',
    'OPP H BADJ D', 'OPP BADJ O RANK', 'BADJ O RANK', 'KADJ D RANK',
    'OPP KADJ D RANK', 'H BADJ D RANK', 'OPP H BADJ D RANK', 'KADJ O',
    'OPP KADJ O', 'A ELITE SOS', 'OPP A ELITE SOS', 'Q1 W', 'OPP Q1 W',
    'KADJ D', 'OPP KADJ D', 'OPP KADJ O RANK', 'KADJ O RANK',
    'OPP N ELITE SOS RANK', 'N ELITE SOS RANK', 'AN BADJ O', 'OPP AN BADJ O',
    'H ELITE SOS', 'OPP H ELITE SOS', 'AN BADJ O RANK', 'OPP AN BADJ O RANK',
    'PRESEASON RANK?', 'OPP PRESEASON RANK?', 'OPP V 1-25 WINS',
    'V 1-25 WINS', 'N ELITE SOS', 'OPP N ELITE SOS', 'A BADJ O',
    'OPP A BADJ O', 'OPP POWER-PATH', 'POWER-PATH', 'OPP A BADJ O RANK',
    'A BADJ O RANK', 'POWER', 'OPP POWER', 'PATH', 'OPP PATH',
    'POOL S-RANK', 'OPP POOL S-RANK'
]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # or specify ["http://localhost:3000"] for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load full team stats dataframe (with "TEAM" as column)
df = pd.read_csv("team_stats_features.csv")

# Drop duplicates in case there are multiple rows for a team
df = df.drop_duplicates(subset="TEAM")

# Save list of feature columns (excluding TEAM)
feature_cols = df.columns.drop("TEAM")

# Make team stats lookup dictionary
team_stats = df.set_index("TEAM").to_dict(orient="index")

class Matchup(BaseModel):
    team1: str
    team2: str

# Load model
model = xgb.Booster()
model.load_model("xgb_model.json")

@app.post("/predict")
def predict_winner(matchup: Matchup):
    t1 = team_stats.get(matchup.team1)
    t2 = team_stats.get(matchup.team2)
    if not t1 or not t2:
        raise HTTPException(status_code=404, detail="One or both teams not found")

    try:
        t1_array = np.array([float(t1[col]) for col in MODEL_FEATURES])
        t2_array = np.array([float(t2[col]) for col in MODEL_FEATURES])
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing feature: {e}")

    X = (t1_array - t2_array).reshape(1, -1)
    dmat = xgb.DMatrix(X, feature_names=MODEL_FEATURES)
    pred = model.predict(dmat)[0]
    return {
        "winner": matchup.team1 if pred > 0.5 else matchup.team2,
        "probability_team1": round(float(pred), 4),
        "probability_team2": round(float(1 - pred), 4)
    }

