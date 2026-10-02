# Development & Local Testing Guide

## Prerequisites
- Python 3.10+ (Tested up to Python 3.14)
- Node.js 18+ and npm
- Webcam and microphone enabled on localhost (HTTPS or `http://localhost`)

---

## 1. Environment Setup

### Backend Virtual Environment
```bash
# From workspace root
python -m venv venv
.\venv\Scripts\activate   # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
python -m pip install -r backend/requirements.txt
```

### Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

---

## 2. Database Migrations
```bash
.\venv\Scripts\python.exe backend/manage.py makemigrations
.\venv\Scripts\python.exe backend/manage.py migrate
```

---

## 3. Train ISL Temporal Model
Before real-time recognition can predict signs, train the model:
```bash
.\venv\Scripts\python.exe -m ml.training.train --epochs 30
```
This generates:
- `ml/models/isl_sequence_model.joblib` or `isl_bilstm_model.keras`
- `ml/models/isl_labels.json`
- `ml/models/isl_config.json`
- `ml/models/training_history.json`

To evaluate model metrics (Accuracy, Precision, Recall, Confusion Matrix):
```bash
.\venv\Scripts\python.exe -m ml.evaluation.evaluate
```

---

## 4. Run Development Servers

### Start Django Backend:
```bash
.\venv\Scripts\python.exe backend/manage.py runserver 0.0.0.0:8000
```

### Start Vite Frontend:
```bash
cd frontend
npm run dev
```

Navigate browser to `http://localhost:5173`.
