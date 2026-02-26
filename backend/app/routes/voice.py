"""Routes related to voice call handling via Twilio webhooks."""

from fastapi import APIRouter, Request

router = APIRouter()


@router.post("/twilio/voice")
async def handle_twilio_voice(request: Request):
    # Placeholder - parse TwiML or parameters from Twilio
    # 1. Receive recorded audio or stream
    # 2. Send to Whisper service for transcription
    # 3. Generate GPT response text
    # 4. Convert response to speech via Eleven Labs
    # 5. Return TwiML with <Play> or <Say> instructions
    return {"status": "received"}
