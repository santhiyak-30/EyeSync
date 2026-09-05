import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { RoleProvider } from './context/RoleContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RoleProvider>
      <App />
    </RoleProvider>
  </React.StrictMode>
);
