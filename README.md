# SignBridge AI — Bidirectional ASL Communication System

**Breaking communication barriers through AI-powered sign language translation.**

SignBridge AI is an AI-based communication system designed to support communication between American Sign Language (ASL) users and people who communicate through spoken or written language. The project aims to combine computer vision, speech recognition, language translation, text-to-speech, and 3D avatar animation in one interactive platform.

## 🎯 Project Objective

The primary objective of SignBridge AI is to develop a bidirectional communication platform that converts sign language into understandable text and speech, while also translating spoken or written language into visual ASL signs.

## ✨ Key Features

- **ASL to Text:** Recognize sign-language gestures using a camera and convert them into text.
- **Speech Output:** Provide spoken output for recognized text.
- **Speech-to-Text:** Convert spoken language into text using speech recognition.
- **Multilingual Communication:** Aim to support English, Kannada, and Hindi input.
- **Text/Speech to ASL:** Display corresponding ASL signs through a 3D avatar.
- **3D Avatar Animation:** Use animated avatar models to represent supported signs.
- **Meeting Rooms:** Develop room creation and joining functionality to support communication between users.
- **Interactive Web Interface:** Provide a user-friendly frontend connected to a Python backend.

*Note: Feature availability and translation accuracy depend on the current implementation, supported signs, trained models, and runtime environment.*

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | Next.js, React, TypeScript |
| Backend | Python, FastAPI |
| Speech Recognition | OpenAI Whisper |
| Text-to-Speech | Coqui XTTS-v2 |
| Computer Vision | MediaPipe |
| 3D Avatar | Three.js, GLB models |
| Machine Learning | Python-based ASL model training |
| Version Control | Git and GitHub |

## 🏗️ Project Structure

```text
SignBridge-AI/
├── backend/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── uploads/
│   └── app.py
├── frontend/
│   ├── app/
│   ├── components/
│   ├── context/
│   ├── public/
│   │   └── models/
│   └── services/
├── asl_training/
├── avatar/
├── datasets/
├── docs/
├── models/
├── shared/
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Python 3.10 (recommended for the current ML environment)
- Node.js and npm
- Git
- A webcam and microphone for relevant real-time features
- Required speech and machine-learning model files

### 1. Clone the repository

```bash
git clone https://github.com/kavana0906/ASL_Bidirectional_Communication.git
cd ASL_Bidirectional_Communication
```

### 2. Set up the backend

From the project root, activate your configured Python environment and install the dependencies listed in `backend/requirements.txt`.

For Windows PowerShell, if your environment is located at `xtts_venv`:

```powershell
.\xtts_venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

Start the backend from the project root:

```bash
python -m uvicorn backend.app:app --reload
```

The backend should be available at:

`http://127.0.0.1:8000`

If the backend is running, its root endpoint can be checked at `http://127.0.0.1:8000/`, and the health endpoint at `http://127.0.0.1:8000/health`.

### 3. Set up the frontend

Open a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the local development URL printed by Next.js, usually:

`http://localhost:3000`

### Setup Notes

- Some features require model files that are not included in the Git repository.
- Install any additional dependencies required by your local environment.
- Configure any necessary model paths and environment variables before running the application.
- Start the backend and frontend in separate terminals.
- Camera access requires browser permission.

## 🔄 How It Works

1. **Input:** Capture sign-language gestures through a camera or receive spoken/written language.
2. **Recognition:** Use computer vision or speech recognition to interpret the input.
3. **Processing:** Convert recognized content into the appropriate text or language representation.
4. **Output:** Provide text and/or speech, or display supported ASL signs through a 3D avatar.
5. **Communication:** Use the meeting-room functionality as it is implemented to support interaction between users.

## 🎓 Project Information

**Project Name:** SignBridge AI — Bidirectional ASL Communication System

**Project Type:** Academic / Machine Learning and AI Project

**Project Domain:** Artificial Intelligence, Computer Vision, Speech Processing, Natural Language Processing, and 3D Visualization

**Project Guide:** Praveen R.

### Project Team

- Kavana G H
- Sriraksha M N
- Ram Kumar
- Suprith A S

## 🔮 Future Enhancements

- Improve continuous sign recognition and sentence formation.
- Expand the supported ASL vocabulary and translation accuracy.
- Improve synchronization between speech output and avatar animations.
- Enhance real-time multilingual translation.
- Improve multi-user meeting stability and communication.
- Optimize model inference for lower-latency performance.

## ⚠️ Limitations

This project is under development. Recognition accuracy, supported vocabulary, avatar animation coverage, and real-time performance depend on the available models and implementation. The system should not be considered a complete replacement for qualified sign-language interpretation.

## 📄 License

No license has been specified yet. Please contact the repository owner before reusing or redistributing this project.

---

**SignBridge AI — Making communication more accessible through artificial intelligence.**
