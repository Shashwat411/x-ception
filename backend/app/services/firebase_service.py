"""Simple Firebase wrapper for storing conversation logs, user profiles, etc."""

import firebase_admin
from firebase_admin import credentials, firestore

_firestore_client = None


def initialize(path_to_cred_json: str):
    global _firestore_client
    cred = credentials.Certificate(path_to_cred_json)
    firebase_admin.initialize_app(cred)
    _firestore_client = firestore.client()


def save_conversation(session_id: str, data: dict):
    """Persist conversation or call metadata."""
    if _firestore_client is None:
        raise RuntimeError("Firebase not initialized")
    _firestore_client.collection("conversations").document(session_id).set(data)
