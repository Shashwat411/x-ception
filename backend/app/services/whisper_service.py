"""Wrapper around OpenAI Whisper for speech-to-text."""

import openai


def transcribe(audio_bytes: bytes, language: str = None) -> str:
    """Send audio to Whisper and return transcript.
    audio_bytes: raw bytes from recorded call
    language: optional language code for regional support
    """
    # openai.api_key should be set via environment
    response = openai.Audio.transcriptions.create(
        file=audio_bytes,
        model="whisper-1",
        language=language,
    )
    return response.text
