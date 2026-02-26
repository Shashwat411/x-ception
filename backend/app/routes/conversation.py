"""Endpoint to receive and return chat messages. This is a stub.
Eventually will tie into gpt_service and whisper/eleven labs when voice is active.
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/conversation")

# store simple messages per session
_sessions = {}


class MessageIn(BaseModel):
    text: str


class ReplyOut(BaseModel):
    reply: str


@router.get("",
            response_model=List[dict])
def get_conversation():
    # return last conversation, using fixed key for demo
    return _sessions.get('default', [])


@router.post("", response_model=ReplyOut)
def post_message(msg: MessageIn):
    # append user message
    _sessions.setdefault('default', []).append({'role': 'user', 'text': msg.text})
    # echo response for now
    bot_reply = f"You said: {msg.text}"
    _sessions.setdefault('default', []).append({'role': 'bot', 'text': bot_reply})
    return {'reply': bot_reply}
