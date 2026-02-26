# Frontend

React-based UI with authentication forms and call/chat interface.

## Getting Started

```bash
cd frontend
npm install
npm start
```

1. Copy `.env.example` to `.env` and adjust `REACT_APP_API_URL` if backend runs elsewhere.
2. The app provides:
   - `/login` & `/register` forms
   - `/dashboard` entry point
   - `/chat` area for textual conversation or later voice control
3. Authentication token is stored in `localStorage` and sent with each request.

Styles are defined in `src/index.css` for a simple layout.
