# REST API Specification

All API endpoints follow standardized JSON envelopes:
- **Success**: `{ "success": true, "data": { ... }, "message": "..." }`
- **Error**: `{ "success": false, "error": { "code": "...", "message": "...", "details": { ... } } }`

---

## 1. Authentication Endpoints

### Register User
- **POST** `/api/auth/register/`
- **Payload**:
```json
{
  "username": "signer01",
  "email": "user@example.com",
  "first_name": "Aditi",
  "password": "Password123",
  "confirm_password": "Password123",
  "preferred_language": "en"
}
```
- **Response**: `201 Created` with auth token and profile.

### Login User
- **POST** `/api/auth/login/`
- **Payload**:
```json
{
  "username": "signer01",
  "password": "Password123"
}
```
- **Response**: `200 OK` with auth token.

### Profile & Settings
- **GET / PUT** `/api/auth/profile/`
- **GET / PUT** `/api/settings/`
- **Payload** (PUT):
```json
{
  "preferred_language": "en",
  "target_language": "hi",
  "theme": "dark",
  "auto_speak": true,
  "confidence_threshold": 0.75
}
```

---

## 2. Sign Language Recognition Endpoints

### Inference Prediction
- **POST** `/api/sign-language/predict/`
- **Payload (Single Frame Mode)**:
```json
{
  "mode": "frame",
  "features": [0.12, 0.45, ... 225 float numbers ...]
}
```
- **Payload (Sequence Mode)**:
```json
{
  "mode": "sequence",
  "sequence": [
    [ ... 225 features ... ], // frame 0
    ... 30 frames ...
  ]
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "sign": "HELLO",
    "confidence": 0.94,
    "sentence": "Hello how are you.",
    "model_loaded": true,
    "model_status": "Recognized: HELLO",
    "is_new_sign": true
  },
  "message": "Frame processed successfully"
}
```

### Model Status
- **GET** `/api/sign-language/status/`
- **Response**:
```json
{
  "success": true,
  "data": {
    "loaded": true,
    "status_message": "Model loaded successfully (8 classes).",
    "classes": ["HELLO", "THANK YOU", "YES", "NO", "PLEASE", "HELP", "GOODBYE", "HOW ARE YOU"],
    "confidence_threshold": 0.75,
    "sequence_length": 30
  }
}
```

### Clear Sentence Constructor
- **POST** `/api/sign-language/clear/`

---

## 3. Translation Endpoints

### Translate Text
- **POST** `/api/translate/`
- **Payload**:
```json
{
  "text": "Hello, thank you for your help",
  "source_language": "en",
  "target_language": "hi"
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "original_text": "Hello, thank you for your help",
    "translated_text": "नमस्ते, आपकी मदद के लिए धन्यवाद",
    "source_language": "en",
    "target_language": "hi",
    "engine": "lexicon_exact"
  }
}
```

### Supported Languages
- **GET** `/api/translate/languages/`
- Lists: `en`, `hi`, `ml`, `ta`, `te`, `kn`.

---

## 4. Speech Recognition & Text-to-Speech Endpoints

### ASR Audio Transcription
- **POST** `/api/speech/transcribe/`
- **Form Data**:
  - `audio`: audio file (.wav/.webm)
  - `language`: `en` | `hi` | etc.

### Text-to-Speech Synthesis
- **POST** `/api/speech/tts/`
- **Payload**:
```json
{
  "text": "नमस्ते, आप कैसे हैं?",
  "language": "hi",
  "slow": false
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "audio_url": "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2...",
    "text": "नमस्ते, आप कैसे हैं?",
    "language": "hi"
  }
}
```

---

## 5. Conversation History Endpoints

### List Conversations
- **GET** `/api/history/?mode=two_way&search=hello`

### Create Conversation
- **POST** `/api/history/`

### Send Communication Turn
- **POST** `/api/communication/send/`
- **Payload**:
```json
{
  "conversation_id": 1,
  "sender": "sign_user",
  "message_type": "isl_sign",
  "original_text": "Thank you",
  "source_language": "en",
  "target_language": "ml"
}
```
- **Response**: Message stored with auto-translation and TTS audio URI.
