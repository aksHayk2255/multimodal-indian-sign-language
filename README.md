# AI-Powered Multimodal Indian Sign Language (ISL) Communication Assistant

A web-based, bi-directional accessibility and communication platform bridging **Indian Sign Language (ISL) users** and **hearing individuals** who do not understand sign language.

Built with **MediaPipe**, **Temporal Deep Learning**, **Automatic Speech Recognition (ASR)**, **Text-to-Speech (TTS)**, **Multilingual Translation**, **Django REST Framework**, and **React + Vite**.

---

## 🌟 Core Features & Communication Flows

### Flow 1: ISL → Text → Speech
- **Continuous Video Stream**: Captures video frames from the user's webcam via the HTML5 `MediaDevices` API.
- **Kinematic Extraction**: Extracts 3D spatial coordinates using **MediaPipe** for pose (33 keypoints $\times$ 3) and dual-hand articulation ($2 \times 21$ keypoints $\times$ 3) resulting in a structured **225-dimensional feature vector** per frame.
- **Temporal Sequence Modeling**: Processes a 30-frame temporal window using a deep learning sequence network (BiLSTM) capturing motion dynamics over time rather than static image heuristics.
- **Invariance Normalization**: Normalizes coordinate values relative to torso reference center and shoulder span to maintain accuracy regardless of user distance or position.
- **Temporal Smoothing Engine**: Applies 75% confidence gating, 5-frame majority voting, duplicate suppression, and a 1.8s cooldown period to eliminate jitter and repeated tokens.
- **Sentence Construction & Vocalization**: Automatically punctuates sentences and synthesizes native speech audio for the hearing participant.

### Flow 2: Speech → Text
- **Live Voice Capture**: Hearing user speaks into device microphone.
- **Low-Latency ASR**: Transcribes speech in real time with the Web Speech API and backend transcription fallback.
- **Dialect & Language Detection**: Automatically formats speech transcripts with high-contrast visual display.

### Flow 3: Multilingual Communication
- **Cross-Lingual Translation**: Supports 6 key Indian languages:
  - **English (`en`)**
  - **Hindi (`hi`)** — हिन्दी
  - **Malayalam (`ml`)** — മലയാളം
  - **Tamil (`ta`)** — தமிழ்
  - **Telugu (`te`)** — తెలుగు
  - **Kannada (`kn`)** — ಕನ್ನಡ
- **Hybrid Engine**: Combines offline domain-specific translation dictionaries for sign language with public translation API fallbacks.
- **Regional Speech Synthesis**: Vocalizes translated sentences using localized speech synthesis.

---

## 🏗️ System Architecture

```
                       [ React + Vite Client ]
             (High Contrast Dark/Light Accessibility Theme)
                       /                      \
                      /                        \
          [ Flow 1: Signer ]              [ Flow 2: Hearing ]
                 ↓                                ↓
         Webcam Frame Stream              Microphone Stream
                 ↓                                ↓
        MediaPipe Landmarks                ASR Audio Engine
         (225 Dims / Frame)                       ↓
                 ↓                         Spoken Transcript
         30-Frame Queue                           ↓
                 ↓                        Translation Bridge
        Temporal Sequence Model                   ↓
                 ↓                         Display Bubble
        Smoothing & Cooldown                      ↓
                 ↓                            TTS Audio
       Sentence Constructor
                 ↓
             TTS Audio
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, React Router v7, Axios, Lucide React, Vanilla CSS Design System |
| **Backend** | Python 3.10-3.14, Django 6.1, Django REST Framework 3.18, Django CORS Headers |
| **AI / ML** | MediaPipe, OpenCV, Scikit-Learn, NumPy, SciPy, Keras / TensorFlow, Joblib |
| **Speech & Audio** | Web Speech Recognition API, Web Speech Synthesis API, gTTS |
| **Database** | SQLite3 (ORM with Django Migrations) |
| **Containerization** | Docker, Docker Compose |

---

## 📂 Project Directory Structure

```
Multimodal Indian Sign Language/
├── backend/
│   ├── manage.py
│   ├── config/                     # Settings, Root URLs, Responses
│   ├── accounts/                   # Auth, User Profile, Language Preferences
│   ├── communication/              # Two-Way Turn Orchestrator & Dispatcher
│   ├── sign_language/              # Real-Time ML Inference & Buffer Manager
│   ├── speech/                     # ASR Transcription & TTS Audio Synthesis
│   ├── translation/                # 6 Indian Languages Translation Service
│   ├── history/                    # Session Storage & Message Logs
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── Dockerfile
│   └── src/
│       ├── components/             # Accessible UI components (Webcam, Mic, etc.)
│       ├── pages/                  # 10 Application Pages
│       ├── services/               # API Clients & Web Speech Wrappers
│       ├── hooks/                  # useCamera, useMicrophone, useAuth
│       ├── context/                # AuthContext & User Preferences
│       └── utils/                  # Constants & Supported Languages
├── ml/
│   ├── dataset/                    # Raw & Processed Sequence Datasets
│   ├── preprocessing/              # Coordinate Centering & Temporal Normalizer
│   ├── landmark_extraction/        # Batch MediaPipe Video Extractor
│   ├── training/                   # Model Architecture & Training Pipeline
│   ├── evaluation/                 # Accuracy, Precision, Recall, F1 & Confusion Matrix
│   ├── models/                     # Saved Weights, Label Encoders, Configs
│   ├── inference/                  # Real-Time Smoothing & Sentence Constructor
│   └── tests/                      # ML Unit Tests
├── docs/                           # Architecture, API, ML, and Setup Guides
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart & Local Setup

### 1. Backend Setup
```bash
# From workspace root
python -m venv venv
.\venv\Scripts\activate       # On Windows
# source venv/bin/activate    # On Linux/macOS

# Install dependencies
python -m pip install -r backend/requirements.txt

# Run migrations
python backend/manage.py makemigrations accounts communication history
python backend/manage.py migrate

# Start backend server
python backend/manage.py runserver 0.0.0.0:8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open browser at `http://localhost:5173`.

---

## 🧠 Model Training & Evaluation

### Train the ISL Sequence Model:
```bash
python -m ml.training.train --epochs 30
```
This generates:
- `ml/models/isl_sequence_model.joblib` / `isl_bilstm_model.keras`
- `ml/models/isl_labels.json`
- `ml/models/isl_config.json`
- `ml/models/training_history.json`

### Run Model Evaluation:
```bash
python -m ml.evaluation.evaluate
```
Outputs classification report, per-class F1-scores, and confusion matrix in `ml/evaluation/results/`.

---

## 🧪 Testing

### Backend API Tests:
```bash
python backend/manage.py test accounts history translation sign_language
```

### ML Pipeline Unit Tests:
```bash
python -m unittest ml/tests/test_ml_pipeline.py
```

### Frontend Build Test:
```bash
cd frontend
npm run build
```

---

## ♿ Accessibility Compliance
- **High-Contrast Dark & Light Modes**: Exceeds WCAG AAA visual contrast ratios.
- **Large Touch & Click Targets**: Buttons and toggles have a minimum height of 44px to 52px.
- **Keyboard Navigable**: Visible outline focus rings on all interactive elements.
- **Screen Reader Support**: Semantic HTML5 tags and descriptive `aria-label` attributes.
- **Honest AI Status**: The UI never presents fake predictions when a model is untrained; clear status indicators display model readiness.

---

## 📝 License
Educational & Research Open-Source Project.
