import React from 'react';
import { Link } from 'react-router-dom';

function Dashboard() {
  return (
    <div className="container dashboard">
      <h2>Dashboard</h2>
      <p>Welcome! From here you can start a voice session.</p>
      <Link to="/chat">
        <button>Start Voice Chat</button>
      </Link>
    </div>
  );
}

export default Dashboard;