# NovaBharat Bank Demo

This workspace contains a simple banking web application with an AI voice chatbot. It's built with a Node/Express backend and a vanilla HTML/CSS/JS frontend.

## Structure
```
/backend      - Express API + lowdb JSON datastore
/public       - Static site (index.html, css, js)
``` 

## Setup & Run
1. Open a terminal in the `backend` folder:
   ```bash
   cd "c:\Users\Pranav\OneDrive\Desktop\final demo\backend"
   npm install
   ```
2. Start the server (development):
   ```bash
   npm run dev   # uses nodemon
   # or: node server.js
   ```
3. Open your browser to `http://localhost:3000` to load the app.

## Features
- Voice chatbot using Web Speech API (English, Hindi, Marathi, Tamil).
- Signup/login with JWT tokens stored in session.
- Balance check, fund transfer with 4-digit PIN, transaction history.
- Admin console (`Admin` link in nav) to view customer list (credentials: `ADMIN001` / `admin123`).
- Voice login (button on login page) that matches spoken first name.
- Multilingual UI strings.
- 20 dummy customer accounts seeded automatically.

> **Note:** This is a demo. Security practices (e.g. exposing customer list, voice login without authentication, plain-text passwords) are intentionally lax for convenience.

## Development Tips
- The backend uses `lowdb` with `backend/models/data.json` as storage. You can inspect/edit it directly.
- JWT secret is hard‑coded in `server.js` — change for production.
- Add new voice command handling logic in `public/js/app.js` under `handleVoiceCommand()`.
- Styles are defined in `<style>` inside `index.html` for simplicity but can be extracted to `public/css/style.css`.

Enjoy exploring the demo! 😊