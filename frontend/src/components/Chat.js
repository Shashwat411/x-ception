import React, { useState, useEffect } from 'react';
import api from '../services/api';

function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    // load previous conversation if necessary
    async function load() {
      try {
        const res = await api.get('/conversation');
        setMessages(res.data);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, []);

  const sendText = async () => {
    if (!input) return;
    const newMsg = { role: 'user', text: input };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    try {
      const res = await api.post('/conversation', { text: newMsg.text });
      setMessages((prev) => [...prev, { role: 'bot', text: res.data.reply }]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="container chat-container">
      <h2>Conversation</h2>
      <div className="messages">
        {messages.map((m, idx) => (
          <div key={idx} className={m.role}>
            <div className="message-bubble">{m.text}</div>
          </div>
        ))}
      </div>
      <div className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={sendText}>Send</button>
      </div>
      {/* future: add button to initiate voice call via Twilio */}
    </div>
  );
}

export default Chat;