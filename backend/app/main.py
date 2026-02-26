"""
FastAPI application entry point.
This server handles incoming Twilio webhooks, invokes OpenAI services
(Whisper for STT, GPT for conversational logic), and uses Eleven Labs for TTS.
Comments throughout guide further implementation.
"""

from fastapi import FastAPI

app = FastAPI(title="X-Ception AI Voice Chatbot")


@app.get("/")
def root():
    return {"message": "X-Ception backend is running."}

# import and include routers here
# from .routes import voice
# app.include_router(voice.router)
