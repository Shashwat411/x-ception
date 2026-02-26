"""Text-to-speech integration with Eleven Labs API."""

import requests
import os

API_KEY = os.getenv("ELEVEN_LABS_API_KEY")
BASE_URL = "https://api.elevenlabs.io/v1"


def synthesize(text: str, voice: str = "alloy") -> bytes:
    """Return audio bytes spoken by selected voice."""
    url = f"{BASE_URL}/text-to-speech/{voice}"
    headers = {"xi-api-key": API_KEY, "Content-Type": "application/json"}
    payload = {"text": text}
    r = requests.post(url, json=payload, headers=headers)
    r.raise_for_status()
    return r.content
