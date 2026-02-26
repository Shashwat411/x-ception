# x-ception

**AI Voice Chatbot for Real-Time Human-Like Assistance**

In many regions (especially rural/semi‑urban India) voice remains the preferred mode of communication. Existing IVR systems frustrate users with robotic responses, menu trees ("press 1"), and poor language support. This project delivers a truly intelligent, multilingual, context‑aware voice assistant that:

- understands natural speech (Whisper) in regional languages
- responds emotionally and contextually using GPT
- speaks replies via Eleven Labs TTS
- integrates with Twilio voice API for calls
- connects to CRM/WhatsApp/ERP systems via backend hooks
- detects urgency, sentiment and fraud using LLM classification
- persists sessions in Firebase

Customers gain 24/7 human‑like support, reduced call drops, and improved satisfaction while businesses cut operational costs and capture more sales.

## Tech Stack

- **Speech-to-text:** OpenAI Whisper
- **Conversational engine:** OpenAI GPT API
- **Text-to-speech:** Eleven Labs AI Voice
- **Voice interface:** Twilio Voice API
- **Backend framework:** FastAPI (Python)
- **Database:** Firebase Firestore
- **LLM classification:** custom client
- **Frontend:** React

## Repository Structure

```
x-ception/
├── README.md                  # this file
├── backend/
│   ├── requirements.txt       # Python dependencies
│   └── app/
│       ├── main.py            # FastAPI entry point
│       ├── routes/            # API routers (e.g. twilio webhooks)
│       ├── services/          # logic for Whisper, GPT, ElevenLabs, Firebase
│       ├── models/            # Pydantic schemas
│       └── utils/             # helpers, config loaders
├── frontend/                  # React application
│   ├── package.json
│   └── src/                   # components, services
└── llm_client/                # classification helper library
    └── classifier.py
```

## Getting Started

### Backend

```bash
cd backend
python -m venv .venv          # create virtual environment
source .venv/Scripts/activate  # Windows PowerShell
pip install -r requirements.txt
```

- set environment variables: `OPENAI_API_KEY`, `ELEVEN_LABS_API_KEY`, `TWILIO_ACCOUNT_SID`, etc.
- configure Firebase credentials and call `firebase_service.initialize(...)`.
- run with `uvicorn app.main:app --reload --port 8000`

### API endpoints (demo)

- `POST /auth/register` – body `{email,password}`
- `POST /auth/login` – returns `{token}` for use in frontend
- `GET /conversation` – list of messages
- `POST /conversation` – send `{text}` and receive reply

These are simple in-memory stubs for prototyping; replace with real storage & JWT auth later.

### Frontend

React-based UI with authentication forms and a chat interface. The layout uses
card-style containers on a soothing gradient background, with colored
message bubbles; you can easily swap in a UI library (Tailwind, MUI, etc.) for
fancier visuals.

```bash
cd frontend
npm install
npm start
```

### Notes

- All code is heavily commented to explain integration points and flow.
- Use the `llm_client.classifier` for sentiment/urgency detection before responding.
- Additional folders can be added for CRM/ERP connectors as needed.

