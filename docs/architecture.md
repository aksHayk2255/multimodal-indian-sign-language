# Multimodal Indian Sign Language (ISL) Assistant — System Architecture

## 1. Overview
The **AI-Powered Multimodal Indian Sign Language Communication Assistant** is a bi-directional accessibility platform engineered to eliminate communication friction between Deaf/Hard-of-Hearing ISL signers and hearing non-signers.

The system combines:
1. **Computer Vision & Kinematics**: MediaPipe Holistic extraction of 3D coordinates for dual-hand articulation and upper-body skeletal landmarks.
2. **Deep Learning Temporal Modeling**: Bidirectional Long Short-Term Memory (BiLSTM) sequence networks capturing 30-frame temporal dynamics.
3. **Natural Language Processing**: Contextual sentence reconstruction, phrase normalization, and grammatical smoothing.
4. **Multilingual Translation Service**: Neural and lexicon-backed translation across 6 key Indian languages: English, Hindi, Malayalam, Tamil, Telugu, and Kannada.
5. **Speech Processing**: Automatic Speech Recognition (ASR) with Web Speech API & server fallbacks, and Text-to-Speech (TTS) audio synthesis via gTTS and Web Speech Synthesis.
6. **Full-Stack Application**: React + Vite frontend adhering to WCAG 2.1 AAA high-contrast accessibility standards paired with a modular Django REST Framework backend.

---

## 2. Architectural Diagram

```
                      +---------------------------------------+
                      |         React + Vite Client           |
                      |  (WCAG AAA Contrast / MediaDevices)   |
                      +-------------------+-------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
            [Flow 1: Signer Input]                    [Flow 2: Hearing Input]
                     |                                         |
                     v                                         v
        +-------------------------+               +-------------------------+
        |   Webcam Frame Stream   |               |   Microphone Stream     |
        +------------+------------+               +------------+------------+
                     |                                         |
                     v                                         v
        +-------------------------+               +-------------------------+
        |  MediaPipe Kinematics   |               |     ASR Audio Engine    |
        |  (21 Dual Hand + 33 Pose|               |  (Web Speech API Engine)|
        |  = 225 Features/Frame)  |               +------------+------------+
        +------------+------------+                            |
                     |                                         |
                     v                                         v
        +-------------------------+               +-------------------------+
        | Sliding Temporal Buffer |               |  Spoken Text Transcript |
        |  (30 Sequential Frames) |               +------------+------------+
        +------------+------------+                            |
                     |                                         |
                     v                                         |
        +-------------------------+                            |
        |  ISL Temporal BiLSTM    |                            |
        |   Deep Learning Model   |                            |
        +------------+------------+                            |
                     |                                         |
                     v                                         |
        +-------------------------+                            |
        |   Smoothing & Duplicate |                            |
        |   Cooldown Suppression  |                            |
        +------------+------------+                            |
                     |                                         |
                     +--------------------+--------------------+
                                          |
                                          v
                      +---------------------------------------+
                      |       Django REST Framework API       |
                      |---------------------------------------|
                      | /api/sign-language/  /api/speech/     |
                      | /api/translate/      /api/history/    |
                      | /api/auth/           /api/settings/   |
                      +-------------------+-------------------+
                                          |
                     +--------------------+--------------------+
                     |                                         |
                     v                                         v
        +-------------------------+               +-------------------------+
        |   Multilingual Bridge   |               |  Persistent Repository  |
        |  (EN, HI, ML, TA, TE, KN|               |  (SQLite DB / Django    |
        |  Lexicon + API Fallback)|               |   Conversations & Log)  |
        +------------+------------+               +-------------------------+
                     |
                     v
        +-------------------------+
        | Text-to-Speech (TTS)    |
        | (gTTS Server + Browser) |
        +-------------------------+
```

---

## 3. Core Communication Flows

### Flow 1: ISL → Text → Speech
1. User activates webcam in `SignLanguage.jsx`.
2. Video frames sampled at 30 fps.
3. MediaPipe Holistic extracts 225 spatial coordinates per frame (99 pose + 63 left hand + 63 right hand).
4. `LandmarkNormalizer` centers and scales landmarks relative to shoulder midpoint for distance invariance.
5. The sliding window buffers 30 normalized frames `(1, 30, 225)`.
6. BiLSTM sequence classifier outputs posterior probability distribution over sign vocabulary.
7. Smoothing rules apply:
   - Confidence thresholding ($\ge 75\%$).
   - 5-frame temporal majority voting.
   - Duplicate suppression & 1.8-second cooldown (prevents repeated tokens like `HELLO HELLO HELLO`).
8. Sentence constructor concatenates tokens into grammatically punctuated sentences.
9. Automatic speech synthesis (TTS) vocalizes the sentence in the target language.

### Flow 2: Speech → Text
1. Hearing participant speaks into device microphone.
2. Low-latency client ASR captures acoustic stream via Web Speech API.
3. Detected speech transcribed to high-contrast readable text.
4. Auto-translation pipeline translates spoken English/Hindi to target dialect.
5. Visual bubble displayed in high-contrast view for Deaf participant.

### Flow 3: Multilingual Communication
1. Bi-directional translation module evaluates input language and target dialect.
2. Supports English, Hindi, Malayalam, Tamil, Telugu, and Kannada.
3. Hybrid architecture combines deterministic offline dictionary matching with public translation API fallbacks.
4. Text synthesized into native speech audio for the listener.

---

## 4. Backend Modular App Separation
- `accounts`: User authentication, profile management, and persistent accessibility preferences.
- `sign_language`: Deep learning inference service orchestration, model status telemetry, and temporal buffers.
- `speech`: Audio transcription interfaces and Text-to-Speech synthesis with base64 audio streaming.
- `translation`: Multilingual cross-lingual translation bridge for 6 Indian languages.
- `history`: Session archive, message logging, filtering, and export.
- `communication`: Integrated turn-taking endpoint orchestrating simultaneous translation and TTS persistence.
