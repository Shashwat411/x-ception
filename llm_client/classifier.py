"""Lightweight client for LLM-based classification tasks (urgency, sentiment, fraud).
Can be used by backend services to analyze text before deciding next steps."""

from openai import OpenAI

client = OpenAI()


def classify_text(text: str, task: str) -> dict:
    """Example classification using a prompt template.
    task could be one of "urgency", "sentiment", "fraud".
    Returns structured dictionary with labels/scores.
    """
    prompt = f"Classify the following text for {task}:\n{text}\nProvide JSON output."
    response = client.responses.create(
        model="gpt-4o-mini",
        input=prompt,
    )
    # NOTE: parse response output here
    return response.output
