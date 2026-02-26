"""Handles conversational logic via OpenAI GPT API."""

import openai


def generate_response(prompt: str, context: list = None) -> str:
    """Call GPT to produce a reply given a prompt and optional conversation context."""
    payload = {
        "model": "gpt-4o-mini",
        "prompt": prompt,
        "max_tokens": 500,
    }
    if context:
        # merge context if used
        payload["context"] = context
    response = openai.Completion.create(**payload)
    return response.choices[0].text.strip()
