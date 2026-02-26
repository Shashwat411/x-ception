from fastapi import APIRouter, Form
from fastapi.responses import Response
from twilio.twiml.voice_response import VoiceResponse
from app.services.gpt_service import generate_ai_response

router = APIRouter()

@router.post("/voice")
async def handle_voice(SpeechResult: str = Form(None)):

    response = VoiceResponse()

    if SpeechResult:
        ai_reply = generate_ai_response(SpeechResult)
        response.say(ai_reply, voice="alice")
    else:
        response.say("Hello, I am your AI voice assistant. How can I help you today?")

    response.gather(input="speech", action="/voice", method="POST")

    return Response(content=str(response), media_type="application/xml")