# 🏀 March Madness Bracket Predictor

A full-stack web app that lets users build out their own NCAA March Madness bracket — and use machine learning to **predict winners** of any matchup!

Built with:
- ⚛️ React frontend for interactive bracket selection
- 🐍 FastAPI + XGBoost backend for predictions
- 📊 Trained on historical and statistical features of NCAA tournament teams

---

## 🚀 Features

- Drag/drop or click-to-select your own custom bracket
- Predict matchups using a trained ML model (XGBoost)
- Predict Final Four and Championship rounds with one click
- Smart handling of team name mismatches between frontend/backend
- Easily extendable for future March Madness seasons

---

## 🧠 How It Works

- The backend loads a CSV (`team_stats_features.csv`) and a pre-trained `xgb_model.json` model.
- The React frontend sends two team names to the backend.
- The model calculates the difference in team features and returns a winner + probability.
- The frontend updates the bracket based on prediction results.

---

## 🛠️ Setup

### 📦 Prerequisites
- Node.js & npm
- Python (3.9+ recommended)
- Conda or virtualenv

---

### 🖥️ Frontend

```bash
cd march-madness-bracket
npm install
npm start
```

### Backend
Create a virtual environment or use conda environment and make sure its activated, install dependencies and run the backend with:
```bash
pip install fastapi uvicorn pandas xgboost scikit-learn
#Run the API
cd python-backend
uvicorn main:app --reload
ngrok http 8000
```
Make sure you copy the ngrok URL to the global variable set up for it in Vercel

This will run on http://127.0.01:8000

Be sure to start the backend and then start the frontend with
```bash
npm run start
```
when doing local development.
